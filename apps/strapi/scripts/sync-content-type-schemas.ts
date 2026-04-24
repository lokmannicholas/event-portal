import { promises as fs } from 'node:fs';
import path from 'node:path';

const appRoot = path.resolve(__dirname, '..', '..');
const apiRoot = path.join(appRoot, 'src', 'api');
const componentsRoot = path.join(appRoot, 'src', 'components');
const pluginsRoot = path.join(appRoot, 'src', 'plugins');

async function pathExists(targetPath: string) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function toModuleSource(schema: unknown) {
  return `export default ${JSON.stringify(schema, null, 2)};\n`;
}

async function syncSchemaFile(schemaJsonPath: string) {
  const schemaTsPath = schemaJsonPath.replace(/\.json$/, '.ts');
  const schema = JSON.parse(await fs.readFile(schemaJsonPath, 'utf8'));
  const nextSource = toModuleSource(schema);
  const currentSource = (await pathExists(schemaTsPath)) ? await fs.readFile(schemaTsPath, 'utf8') : null;

  if (currentSource !== nextSource) {
    await fs.writeFile(schemaTsPath, nextSource, 'utf8');
    return path.relative(appRoot, schemaTsPath);
  }

  return null;
}

async function syncApiSchemas() {
  if (!(await pathExists(apiRoot))) {
    return [] as string[];
  }

  const apiNames = await fs.readdir(apiRoot);
  const updated: string[] = [];

  for (const apiName of apiNames) {
    const contentTypesRoot = path.join(apiRoot, apiName, 'content-types');

    if (!(await pathExists(contentTypesRoot))) {
      continue;
    }

    const contentTypeNames = await fs.readdir(contentTypesRoot);

    for (const contentTypeName of contentTypeNames) {
      const schemaJsonPath = path.join(contentTypesRoot, contentTypeName, 'schema.json');

      if (!(await pathExists(schemaJsonPath))) {
        continue;
      }

      const updatedFile = await syncSchemaFile(schemaJsonPath);

      if (updatedFile) {
        updated.push(updatedFile);
      }
    }
  }

  return updated;
}

async function syncComponentSchemasAtRoot(rootPath: string) {
  if (!(await pathExists(rootPath))) {
    return [] as string[];
  }

  const componentCategories = await fs.readdir(rootPath);
  const updated: string[] = [];

  for (const category of componentCategories) {
    const categoryRoot = path.join(rootPath, category);
    const entryNames = await fs.readdir(categoryRoot);

    for (const entryName of entryNames) {
      if (!entryName.endsWith('.json')) {
        continue;
      }

      const updatedFile = await syncSchemaFile(path.join(categoryRoot, entryName));

      if (updatedFile) {
        updated.push(updatedFile);
      }
    }
  }

  return updated;
}

async function syncPluginSchemas() {
  if (!(await pathExists(pluginsRoot))) {
    return [] as string[];
  }

  const pluginNames = await fs.readdir(pluginsRoot);
  const updated: string[] = [];

  for (const pluginName of pluginNames) {
    const serverSrcRoot = path.join(pluginsRoot, pluginName, 'server', 'src');

    if (!(await pathExists(serverSrcRoot))) {
      continue;
    }

    const pluginContentTypesRoot = path.join(serverSrcRoot, 'content-types');
    const pluginComponentsRoot = path.join(serverSrcRoot, 'components');

    if (await pathExists(pluginContentTypesRoot)) {
      const contentTypeNames = await fs.readdir(pluginContentTypesRoot);

      for (const contentTypeName of contentTypeNames) {
        const schemaJsonPath = path.join(pluginContentTypesRoot, contentTypeName, 'schema.json');

        if (!(await pathExists(schemaJsonPath))) {
          continue;
        }

        const updatedFile = await syncSchemaFile(schemaJsonPath);

        if (updatedFile) {
          updated.push(updatedFile);
        }
      }
    }

    updated.push(...(await syncComponentSchemasAtRoot(pluginComponentsRoot)));
  }

  return updated;
}

async function main() {
  const updated = [
    ...(await syncApiSchemas()),
    ...(await syncComponentSchemasAtRoot(componentsRoot)),
    ...(await syncPluginSchemas()),
  ];

  if (updated.length > 0) {
    console.log(`Synced ${updated.length} content-type schema module(s).`);
  }
}

void main().catch((error) => {
  console.error(error);
  const runtime = globalThis as typeof globalThis & {
    process?: {
      exitCode?: number;
    };
  };

  if (runtime.process) {
    runtime.process.exitCode = 1;
  }
});
