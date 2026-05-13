import type { Core } from '@strapi/strapi';

type RelationIdentifier = number | string | { id?: number; documentId?: string };

type RelationOperation = {
  connect?: RelationIdentifier[];
  disconnect?: RelationIdentifier[];
  set?: RelationIdentifier[];
};

type RelationValue = RelationIdentifier | RelationIdentifier[] | RelationOperation | null;

type SchemaAttribute = {
  type?: string;
  relation?: string;
  target?: string;
  mappedBy?: string;
  inversedBy?: string;
};

type ContentTypeSchema = {
  attributes?: Record<string, SchemaAttribute>;
};

type NormalizedPayload = {
  body: Record<string, unknown>;
  inverseRelations: Array<{
    key: string;
    targetUid: string;
    targetField: string;
    value: RelationValue;
  }>;
};

function isRelationOperation(value: RelationValue): value is RelationOperation {
  return Boolean(
    value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      ('connect' in value || 'disconnect' in value || 'set' in value),
  );
}

function getSchema(strapi: Core.Strapi, uid: string): ContentTypeSchema {
  return (((strapi as any).contentType(uid) as ContentTypeSchema | undefined) ?? {});
}

function normalizeRelationIdentifier(value: unknown): RelationIdentifier | unknown {
  if (typeof value === 'string') {
    const normalized = value.trim();
    return normalized || value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const relation = value as { id?: number; documentId?: string };
  const normalized: { id?: number; documentId?: string } = {};

  if (typeof relation.id === 'number' && Number.isFinite(relation.id)) {
    normalized.id = relation.id;
  }

  if (typeof relation.documentId === 'string' && relation.documentId.trim()) {
    normalized.documentId = relation.documentId.trim();
  }

  return Object.keys(normalized).length > 0 ? normalized : value;
}

function normalizeRelationValue(value: unknown): RelationValue | unknown {
  if (value === null) {
    return null;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeRelationIdentifier(entry)) as RelationIdentifier[];
  }

  if (!value || typeof value !== 'object') {
    return normalizeRelationIdentifier(value);
  }

  const relation = value as RelationOperation;
  const normalized: RelationOperation = {};

  if (Array.isArray(relation.connect)) {
    normalized.connect = relation.connect.map((entry) => normalizeRelationIdentifier(entry) as RelationIdentifier);
  }

  if (Array.isArray(relation.disconnect)) {
    normalized.disconnect = relation.disconnect.map((entry) => normalizeRelationIdentifier(entry) as RelationIdentifier);
  }

  if (Array.isArray(relation.set)) {
    normalized.set = relation.set.map((entry) => normalizeRelationIdentifier(entry) as RelationIdentifier);
  }

  return Object.keys(normalized).length > 0 ? normalized : normalizeRelationIdentifier(value);
}

function isToManyRelation(relation: string | undefined) {
  return relation === 'oneToMany' || relation === 'manyToMany' || relation === 'morphMany' || relation === 'morphToMany';
}

function toRelationOperation(attribute: SchemaAttribute, value: unknown): RelationValue | unknown {
  const normalizedValue = normalizeRelationValue(value);

  if (normalizedValue === null || isRelationOperation(normalizedValue as RelationValue)) {
    return normalizedValue;
  }

  if (Array.isArray(normalizedValue)) {
    return {
      set: normalizedValue,
    } satisfies RelationOperation;
  }

  if (attribute.relation && isToManyRelation(attribute.relation)) {
    return {
      set: [normalizedValue as RelationIdentifier],
    } satisfies RelationOperation;
  }

  return {
    connect: [normalizedValue as RelationIdentifier],
  } satisfies RelationOperation;
}

function getStatusFieldName(attributes: Record<string, SchemaAttribute>) {
  const matches = Object.entries(attributes)
    .filter(([key, attribute]) => key.endsWith('Status') && attribute.type === 'enumeration')
    .map(([key]) => key);

  return matches.length === 1 ? matches[0] : undefined;
}

export function normalizeContentTypePayload(strapi: Core.Strapi, uid: string, body: unknown): NormalizedPayload {
  if (!body || typeof body !== 'object') {
    return {
      body: {},
      inverseRelations: [],
    };
  }

  const payload = body as Record<string, unknown>;
  const rawData =
    payload.data && typeof payload.data === 'object'
      ? { ...(payload.data as Record<string, unknown>) }
      : { ...payload };
  const attributes = getSchema(strapi, uid).attributes ?? {};
  const statusFieldName = getStatusFieldName(attributes);

  delete rawData.data;

  if ('status' in rawData && !('status' in attributes)) {
    if (statusFieldName && !(statusFieldName in rawData)) {
      rawData[statusFieldName] = rawData.status;
    }

    delete rawData.status;
  }

  const data: Record<string, unknown> = {};
  const inverseRelations: NormalizedPayload['inverseRelations'] = [];

  for (const [key, value] of Object.entries(rawData)) {
    const attribute = attributes[key];

    if (!attribute) {
      continue;
    }

    if (attribute.type !== 'relation') {
      data[key] = value;
      continue;
    }

    const normalizedValue = toRelationOperation(attribute, value);

    if (attribute.mappedBy && attribute.target) {
      inverseRelations.push({
        key,
        targetUid: attribute.target,
        targetField: attribute.mappedBy,
        value: normalizedValue as RelationValue,
      });
      continue;
    }

    data[key] = normalizedValue;
  }

  return {
    body: {
      ...payload,
      data,
    },
    inverseRelations,
  };
}

function getRelationDocumentIds(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => getRelationDocumentId(entry))
      .filter((entry): entry is string => Boolean(entry));
  }

  const documentId = getRelationDocumentId(value);
  return documentId ? [documentId] : [];
}

function getRelationDocumentId(value: unknown) {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const relation = value as { documentId?: string };
  return typeof relation.documentId === 'string' && relation.documentId ? relation.documentId : undefined;
}

async function resolveRelationDocumentId(strapi: Core.Strapi, targetUid: string, value: RelationIdentifier) {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    const record = await (strapi.db.query as any)(targetUid).findOne({
      where: { id: value },
      select: ['documentId'],
    });

    if (typeof record?.documentId === 'string' && record.documentId) {
      return record.documentId;
    }

    throw new Error(`Unable to resolve relation id ${value} for ${targetUid}`);
  }

  if (value && typeof value === 'object') {
    if (typeof value.documentId === 'string' && value.documentId) {
      return value.documentId;
    }

    if (typeof value.id === 'number') {
      return await resolveRelationDocumentId(strapi, targetUid, value.id);
    }
  }

  throw new Error(`Invalid relation reference for ${targetUid}`);
}

async function resolveRelationDocumentIds(strapi: Core.Strapi, targetUid: string, values: RelationIdentifier[]) {
  const resolved = await Promise.all(values.map((value) => resolveRelationDocumentId(strapi, targetUid, value)));
  return Array.from(new Set(resolved));
}

async function fetchCurrentRelatedDocumentIds(
  strapi: Core.Strapi,
  uid: string,
  sourceDocumentId: string,
  relationKey: string,
) {
  const record = await (strapi.documents as any)(uid).findOne({
    documentId: sourceDocumentId,
    populate: {
      [relationKey]: true,
    },
  });

  return getRelationDocumentIds(record?.[relationKey]);
}

async function updateTargetOwnerRelation(
  strapi: Core.Strapi,
  targetUid: string,
  targetField: string,
  relationType: string | undefined,
  targetDocumentIds: string[],
  sourceDocumentId: string,
  action: 'connect' | 'disconnect',
) {
  for (const targetDocumentId of targetDocumentIds) {
    if (relationType === 'manyToOne' || relationType === 'oneToOne') {
      await (strapi.documents as any)(targetUid).update({
        documentId: targetDocumentId,
        data: {
          [targetField]: action === 'connect' ? sourceDocumentId : null,
        },
      });
      continue;
    }

    await (strapi.documents as any)(targetUid).update({
      documentId: targetDocumentId,
      data: {
        [targetField]: {
          [action]: [{ documentId: sourceDocumentId }],
        },
      },
    });
  }
}

export async function syncInverseRelations(
  strapi: Core.Strapi,
  uid: string,
  sourceDocumentId: string,
  inverseRelations: NormalizedPayload['inverseRelations'],
) {
  if (inverseRelations.length === 0) {
    return;
  }

  for (const relation of inverseRelations) {
    const targetAttributes = getSchema(strapi, relation.targetUid).attributes ?? {};
    const targetAttribute = targetAttributes[relation.targetField];

    if (!targetAttribute || targetAttribute.type !== 'relation') {
      continue;
    }

    const operation = isRelationOperation(relation.value) ? relation.value : undefined;
    const usesSet =
      relation.value === null ||
      Array.isArray(relation.value) ||
      !isRelationOperation(relation.value) ||
      Boolean(operation?.set);
    const currentDocumentIds = usesSet || Array.isArray(operation?.disconnect)
      ? await fetchCurrentRelatedDocumentIds(strapi, uid, sourceDocumentId, relation.key)
      : [];

    const desiredDocumentIds = usesSet
      ? await resolveRelationDocumentIds(
          strapi,
          relation.targetUid,
          Array.isArray(relation.value)
            ? relation.value
            : relation.value === null
              ? []
              : operation?.set ?? [relation.value as RelationIdentifier],
        )
      : [];

    const connectDocumentIds = usesSet
      ? desiredDocumentIds.filter((documentId) => !currentDocumentIds.includes(documentId))
      : await resolveRelationDocumentIds(strapi, relation.targetUid, operation?.connect ?? []);

    const disconnectDocumentIds = usesSet
      ? currentDocumentIds.filter((documentId) => !desiredDocumentIds.includes(documentId))
      : await resolveRelationDocumentIds(strapi, relation.targetUid, operation?.disconnect ?? []);

    await updateTargetOwnerRelation(
      strapi,
      relation.targetUid,
      relation.targetField,
      targetAttribute.relation,
      disconnectDocumentIds,
      sourceDocumentId,
      'disconnect',
    );

    await updateTargetOwnerRelation(
      strapi,
      relation.targetUid,
      relation.targetField,
      targetAttribute.relation,
      connectDocumentIds,
      sourceDocumentId,
      'connect',
    );
  }
}
