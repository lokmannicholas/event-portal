import { createHash, randomUUID } from 'node:crypto';
import type { Core } from '@strapi/strapi';

type AnyRecord = Record<string, any>;
type IntegrationRequestBodyType = 'JSON' | 'FORM_DATA';
type IntegrationRequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type IntegrationOutcome = 'SUCCESS' | 'FAILED' | 'UNKNOWN';

function toArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function nowIso() {
  return new Date().toISOString();
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function createEformSubmissionReference() {
  return `EF-${randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()}`;
}

function getStatus(record: AnyRecord, key: string) {
  return record[key] ?? record.status;
}

function eformVisibleInErp(eform: AnyRecord) {
  const status = getStatus(eform, 'eventStatus');
  const today = todayIso();
  const withinEventPeriod =
    typeof eform.eventStartDate === 'string' &&
    typeof eform.eventEndDate === 'string' &&
    eform.eventStartDate <= today &&
    today <= eform.eventEndDate;
  const expired = typeof eform.eventEndDate === 'string' && eform.eventEndDate < today;

  if ((status !== 'RELEASED' && status !== 'CLOSED') || status === 'DISABLED') {
    return false;
  }

  if (status === 'CLOSED' && !(eform.showInExpired === true && expired)) {
    return false;
  }

  return (
    (eform.showInEventPeriod !== false && withinEventPeriod) ||
    (eform.showInExpired === true && expired)
  );
}

function mapField(record: AnyRecord) {
  return {
    fieldKey: record.fieldKey,
    labelEn: record.labelEn,
    labelZh: record.labelZh,
    fieldType: record.fieldType,
    required: Boolean(record.required),
    visibleInERP: record.visibleInErp !== false,
    visibleInECP: record.visibleInEcp !== false,
    visibleInEAP: record.visibleInEap !== false,
    sortOrder: record.sortOrder ?? 0,
    isSystem: Boolean(record.isSystem),
    placeholderEn: record.placeholderEn,
    placeholderZh: record.placeholderZh,
    options: record.optionsJson,
  };
}

function buildEformPaths(record: AnyRecord) {
  const eformCode = record.publicSlug ?? record.documentId;
  const publicIdentifier = record.publicUuid ?? record.documentId;
  const accessType = record.eventAccessType === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC';
  const accessSegment = accessType === 'PRIVATE' ? 'private' : 'public';
  const partitionCode = record.userPartition?.code ?? '';
  const publicPath = `/eform/${accessSegment}/${publicIdentifier}`;

  return {
    eformCode,
    accessType,
    partitionCode,
    publicUrl: publicPath,
    qrPayload: publicPath,
  };
}

function mapEformListItem(record: AnyRecord) {
  const paths = buildEformPaths(record);

  return {
    documentId: record.documentId,
    eformCode: paths.eformCode,
    companyName: record.companyName,
    companyNameZh: record.companyNameZh,
    location: record.location,
    locationZh: record.locationZh,
    eformName: record.eformName,
    eformNameZh: record.eformNameZh,
    description: record.eformDescription,
    descriptionZh: record.eformDescriptionZh,
    notes: record.eformNotes,
    notesZh: record.eformNotesZh,
    partitionCode: paths.partitionCode,
    partitionDocumentId: record.userPartition?.documentId,
    templateDocumentId: record.template?.documentId,
    accessType: paths.accessType,
    status: getStatus(record, 'eventStatus'),
    eventStartDate: record.eventStartDate,
    eventEndDate: record.eventEndDate,
    showInEventPeriod: record.showInEventPeriod !== false,
    showInExpired: record.showInExpired === true,
    publishedToPortals: record.publishedToPortals === true,
    publicUrl: paths.publicUrl,
    qrPayload: paths.qrPayload,
    layoutSettings: record.template?.layoutSettings,
    customCss: record.template?.customCss,
  };
}

function mapEformDetail(record: AnyRecord) {
  return {
    eform: {
      ...mapEformListItem(record),
      fields: toArray<any>(record.template?.formFields).map((field) => mapField(field)),
    },
  };
}

function normalizeStringRecord(input: Record<string, unknown> | undefined) {
  return Object.fromEntries(
    Object.entries(input ?? {})
      .filter(([key]) => typeof key === 'string' && key.trim())
      .map(([key, value]) => [key.trim(), typeof value === 'string' ? value : String(value ?? '')]),
  );
}

function buildParticipantIdentityHash(input: {
  eformDocumentId: string;
  participantName: string;
  staffNumber?: string;
}) {
  return createHash('sha256')
    .update([input.eformDocumentId, input.participantName.trim().toLowerCase(), input.staffNumber?.trim().toLowerCase() ?? ''].join('|'))
    .digest('hex');
}

function getTemplateValue(source: unknown, path: string) {
  return path
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .reduce<unknown>((current, segment) => {
      if (!current || typeof current !== 'object') {
        return undefined;
      }

      return (current as Record<string, unknown>)[segment];
    }, source);
}

function renderTemplateString(template: string, context: Record<string, unknown>) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_match, path) => {
    const value = getTemplateValue(context, path);
    return value === undefined || value === null ? '' : encodeURIComponent(String(value));
  });
}

function tryParseJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function matchesExpectedShape(actual: unknown, expected: unknown): boolean {
  if (expected === undefined) {
    return false;
  }

  if (expected === null || typeof expected !== 'object') {
    if (typeof actual === 'string' && typeof expected === 'string') {
      return actual.trim() === expected.trim();
    }

    return actual === expected;
  }

  if (Array.isArray(expected)) {
    if (!Array.isArray(actual) || actual.length < expected.length) {
      return false;
    }

    return expected.every((item, index) => matchesExpectedShape(actual[index], item));
  }

  if (!actual || typeof actual !== 'object' || Array.isArray(actual)) {
    return false;
  }

  return Object.entries(expected as Record<string, unknown>).every(([key, value]) =>
    matchesExpectedShape((actual as Record<string, unknown>)[key], value),
  );
}

function getIntegrationOutcome(responseBody: unknown, integrationSystem: AnyRecord, responseOk: boolean): IntegrationOutcome {
  if (matchesExpectedShape(responseBody, integrationSystem.failedResponseBody)) {
    return 'FAILED';
  }

  if (matchesExpectedShape(responseBody, integrationSystem.successResponseBody)) {
    return 'SUCCESS';
  }

  return responseOk ? 'SUCCESS' : 'FAILED';
}

function buildFlatSubmissionRecord(input: {
  eform: AnyRecord;
  submissionReference: string;
  participantName?: string;
  staffNumber?: string;
  medicalCardNumber?: string;
  hkidPrefix?: string;
  registeredEmail?: string;
  mobileNumber?: string;
  submittedAt: string;
  formValues: Record<string, string>;
  queryParams: Record<string, string>;
}) {
  const flatRecord: Record<string, string> = {
    submissionReference: input.submissionReference,
    eformDocumentId: String(input.eform.documentId ?? ''),
    eformCode: String(input.eform.publicSlug ?? input.eform.documentId ?? ''),
    eformName: String(input.eform.eformName ?? ''),
    companyName: String(input.eform.companyName ?? ''),
    partitionCode: String(input.eform.userPartition?.code ?? ''),
    portalSource: 'ERP',
    submittedAt: input.submittedAt,
    participantName: input.participantName ?? '',
    staffNumber: input.staffNumber ?? '',
    medicalCardNumber: input.medicalCardNumber ?? '',
    hkidPrefix: input.hkidPrefix ?? '',
    registeredEmail: input.registeredEmail ?? '',
    mobileNumber: input.mobileNumber ?? '',
  };

  for (const [key, value] of Object.entries(input.formValues)) {
    flatRecord[key] = value;
    flatRecord[`formValues.${key}`] = value;
  }

  for (const [key, value] of Object.entries(input.queryParams)) {
    flatRecord[`queryParams.${key}`] = value;
  }

  return flatRecord;
}

async function parseIntegrationResponse(response: Response) {
  const rawBody = await response.text();

  if (!rawBody.trim()) {
    return undefined;
  }

  return tryParseJson(rawBody);
}

async function dispatchIntegrationSystem(input: {
  eform: AnyRecord;
  integrationSystem: AnyRecord;
  submissionReference: string;
  participantName?: string;
  staffNumber?: string;
  medicalCardNumber?: string;
  hkidPrefix?: string;
  registeredEmail?: string;
  mobileNumber?: string;
  submittedAt: string;
  formValues: Record<string, string>;
  queryParams: Record<string, string>;
}) {
  const method = (input.integrationSystem.apiMethod ?? 'POST') as IntegrationRequestMethod;
  const requestBodyType = (input.integrationSystem.requestBodyType ?? 'JSON') as IntegrationRequestBodyType;
  const flatRecord = buildFlatSubmissionRecord(input);
  const integrationContext = {
    ...flatRecord,
    eform: {
      documentId: input.eform.documentId,
      code: input.eform.publicSlug ?? input.eform.documentId,
      name: input.eform.eformName,
      companyName: input.eform.companyName,
      partitionCode: input.eform.userPartition?.code ?? '',
    },
    formValues: input.formValues,
    queryParams: input.queryParams,
  };
  const requestPath = renderTemplateString(String(input.integrationSystem.apiPath ?? ''), integrationContext);

  if (!requestPath) {
    return {
      success: false,
      requestMethod: method,
      requestPath,
      requestBodyType,
      matchedOutcome: 'FAILED' as IntegrationOutcome,
      errorMessage: 'Integration API path is empty.',
    };
  }

  const requestInit: RequestInit = {
    method,
  };

  if (method === 'GET' || method === 'DELETE') {
    const url = new URL(requestPath);

    for (const [key, value] of Object.entries(flatRecord)) {
      if (!url.searchParams.has(key) && value) {
        url.searchParams.set(key, value);
      }
    }

    try {
      const response = await fetch(url.toString(), requestInit);
      const responseBody = await parseIntegrationResponse(response);
      const matchedOutcome = getIntegrationOutcome(responseBody, input.integrationSystem, response.ok);

      return {
        success: matchedOutcome === 'SUCCESS',
        requestMethod: method,
        requestPath: url.toString(),
        requestBodyType,
        statusCode: response.status,
        matchedOutcome,
        responseBody,
      };
    } catch (error) {
      return {
        success: false,
        requestMethod: method,
        requestPath: url.toString(),
        requestBodyType,
        matchedOutcome: 'FAILED' as IntegrationOutcome,
        errorMessage: error instanceof Error ? error.message : 'Unknown integration request error',
      };
    }
  }

  if (requestBodyType === 'FORM_DATA') {
    const body = new FormData();

    for (const [key, value] of Object.entries(flatRecord)) {
      body.append(key, value);
    }

    requestInit.body = body;
  } else {
    requestInit.headers = {
      'Content-Type': 'application/json',
    };
    requestInit.body = JSON.stringify({
      submissionReference: input.submissionReference,
      submittedAt: input.submittedAt,
      portalSource: 'ERP',
      eform: {
        documentId: input.eform.documentId,
        code: input.eform.publicSlug ?? input.eform.documentId,
        name: input.eform.eformName,
        companyName: input.eform.companyName,
        partitionCode: input.eform.userPartition?.code ?? '',
      },
      participant: {
        participantName: input.participantName ?? null,
        staffNumber: input.staffNumber ?? null,
        medicalCardNumber: input.medicalCardNumber ?? null,
        hkidPrefix: input.hkidPrefix ?? null,
        registeredEmail: input.registeredEmail ?? null,
        mobileNumber: input.mobileNumber ?? null,
      },
      formValues: input.formValues,
      queryParams: input.queryParams,
    });
  }

  try {
    const response = await fetch(requestPath, requestInit);
    const responseBody = await parseIntegrationResponse(response);
    const matchedOutcome = getIntegrationOutcome(responseBody, input.integrationSystem, response.ok);

    return {
      success: matchedOutcome === 'SUCCESS',
      requestMethod: method,
      requestPath,
      requestBodyType,
      statusCode: response.status,
      matchedOutcome,
      responseBody,
    };
  } catch (error) {
    return {
      success: false,
      requestMethod: method,
      requestPath,
      requestBodyType,
      matchedOutcome: 'FAILED' as IntegrationOutcome,
      errorMessage: error instanceof Error ? error.message : 'Unknown integration request error',
    };
  }
}

async function fetchEformList(strapi: Core.Strapi) {
  return (await (strapi.documents as any)('plugin::eform.eform').findMany({
    populate: {
      userPartition: true,
      template: {
        populate: {
          formFields: true,
        },
      },
    },
    sort: ['eventStartDate:asc', 'eformName:asc'],
    limit: 200,
  })) as AnyRecord[];
}

async function fetchEformDetailRecord(strapi: Core.Strapi, documentId: string) {
  return (await (strapi.documents as any)('plugin::eform.eform').findOne({
    documentId,
    populate: {
      userPartition: true,
      template: {
        populate: {
          formFields: true,
        },
      },
      integrationSystem: true,
    },
  })) as AnyRecord | null;
}

async function fetchEformDetailRecordByIdentifier(strapi: Core.Strapi, identifier: string) {
  const byDocumentId = await fetchEformDetailRecord(strapi, identifier);

  if (byDocumentId) {
    return byDocumentId;
  }

  const byPublicUuid = (await (strapi.documents as any)('plugin::eform.eform').findMany({
    filters: {
      publicUuid: identifier,
    },
    populate: {
      userPartition: true,
      template: {
        populate: {
          formFields: true,
        },
      },
      integrationSystem: true,
    },
    limit: 1,
  })) as AnyRecord[];

  if (byPublicUuid[0]) {
    return byPublicUuid[0];
  }

  const byPublicSlug = (await (strapi.documents as any)('plugin::eform.eform').findMany({
    filters: {
      publicSlug: identifier,
    },
    populate: {
      userPartition: true,
      template: {
        populate: {
          formFields: true,
        },
      },
      integrationSystem: true,
    },
    limit: 1,
  })) as AnyRecord[];

  return byPublicSlug[0] ?? null;
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async erpEformsForPartition(partitionDocumentId?: string, partitionCode?: string) {
    return (await fetchEformList(strapi))
      .filter((eform) => {
        const eformPartitionDocumentId = String(eform.userPartition?.documentId ?? '');
        const eformPartitionCode = String(eform.userPartition?.code ?? '');

        return (
          (partitionDocumentId && eformPartitionDocumentId === partitionDocumentId) ||
          (partitionCode && eformPartitionCode === partitionCode)
        );
      })
      .filter(eformVisibleInErp)
      .map(mapEformListItem);
  },

  async erpEformDetail(identifier: string, partitionCode?: string) {
    const eform = await fetchEformDetailRecordByIdentifier(strapi, identifier);

    if (!eform || !eformVisibleInErp(eform)) {
      return null;
    }

    if (partitionCode && eform.userPartition?.code && eform.userPartition.code !== partitionCode) {
      return null;
    }

    return mapEformDetail(eform);
  },

  async createEformSubmission(input: {
    eformDocumentId: string;
    partitionCode: string;
    termsAccepted: boolean;
    formValues?: Record<string, string>;
    queryParams?: Record<string, string>;
    autoSubmit?: boolean;
  }) {
    if (!input.termsAccepted) {
      throw new Error('Terms and conditions must be accepted');
    }

    const eform = await fetchEformDetailRecord(strapi, input.eformDocumentId);

    if (!eform) {
      throw new Error('E-form not found');
    }

    if (eform.userPartition?.code !== input.partitionCode) {
      throw new Error('This e-form is not available in the requested partition');
    }

    if (!eformVisibleInErp(eform)) {
      throw new Error('This e-form is not available for ERP submission');
    }

    const erpFields = toArray<any>(eform.template?.formFields).filter((field) => field.visibleInErp !== false);
    const allowedFieldKeys = new Set(erpFields.map((field) => String(field.fieldKey ?? '')));
    const formValues = Object.fromEntries(
      Object.entries(input.formValues ?? {})
        .filter(([fieldKey]) => allowedFieldKeys.has(fieldKey))
        .map(([fieldKey, value]) => [fieldKey, typeof value === 'string' ? value.trim() : '']),
    );

    for (const field of erpFields) {
      if (field.required && !formValues[String(field.fieldKey ?? '')]) {
        throw new Error(`${field.labelEn ?? field.fieldKey ?? 'Registration field'} is required`);
      }
    }

    const participantName = formValues.participant_name;
    const staffNumber = formValues.staff_number;
    const medicalCardNumber = formValues.medical_card_number;
    const hkidPrefix = formValues.hkid_prefix;
    const registeredEmail = formValues.registered_email;
    const mobileNumber = formValues.mobile_number;
    const submittedAt = nowIso();
    const queryParams = normalizeStringRecord(input.queryParams);
    const payload = {
      source: 'ERP',
      autoSubmitted: input.autoSubmit === true,
      formValues,
      queryParams,
    };
    const participantIdentityHash =
      participantName && staffNumber
        ? buildParticipantIdentityHash({
            eformDocumentId: input.eformDocumentId,
            participantName,
            staffNumber,
          })
        : undefined;

    const created = (await (strapi.documents as any)('plugin::eform.eform-submission').create({
      data: {
        submissionReference: createEformSubmissionReference(),
        participantName,
        staffNumber,
        medicalCardNumber,
        hkidPrefix,
        registeredEmail,
        mobileNumber,
        termsAccepted: input.termsAccepted,
        participantIdentityHash,
        submittedAt,
        portalSource: 'ERP',
        payload,
        eform: input.eformDocumentId,
      } as any,
    })) as AnyRecord;

    let integration: Record<string, unknown> | undefined;

    if (eform.integrationSystem?.enabled !== false && eform.integrationSystem?.apiPath) {
      const integrationResult = await dispatchIntegrationSystem({
        eform,
        integrationSystem: eform.integrationSystem,
        submissionReference: String(created.submissionReference ?? ''),
        participantName,
        staffNumber,
        medicalCardNumber,
        hkidPrefix,
        registeredEmail,
        mobileNumber,
        submittedAt,
        formValues,
        queryParams,
      });

      integration = integrationResult;

      await (strapi.documents as any)('plugin::eform.eform-submission').update({
        documentId: created.documentId,
        data: {
          payload: {
            ...payload,
            integration: integrationResult,
          },
        } as any,
      });
    }

    return {
      documentId: String(created.documentId ?? ''),
      submissionReference: String(created.submissionReference ?? ''),
      eformDocumentId: String(eform.documentId ?? ''),
      eformName: String(eform.eformName ?? ''),
      companyName: String(eform.companyName ?? ''),
      participantName: participantName || undefined,
      staffNumber: staffNumber || undefined,
      medicalCardNumber: medicalCardNumber || undefined,
      hkidPrefix: hkidPrefix || undefined,
      registeredEmail: registeredEmail || undefined,
      mobileNumber: mobileNumber || undefined,
      submittedAt,
      portalSource: 'ERP',
      integration,
    };
  },
});
