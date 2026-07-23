/*
 * Compares package versions hardcoded in 'plugin/src/shared/dependencies.ts' (what generators
 * write into consumer package.json files) against the versions actually used in this workspace
 * (root 'package.json' and 'apps/mobile/package.json', which is the source of truth after a
 * dependency update in the example apps).
 *
 * Usage: node tools/scripts/check-generator-dependencies.mjs
 *
 * Exits with code 1 if any version mismatch is found, 0 otherwise. Read-only — never writes files.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const repoRoot = join(fileURLToPath(import.meta.url), '..', '..', '..');
const depsFilePath = join(repoRoot, 'plugin', 'src', 'shared', 'dependencies.ts');

function loadJson(relativePath) {
  return JSON.parse(readFileSync(join(repoRoot, relativePath), 'utf8'));
}

// 'dependencies.ts' has no TypeScript-only syntax (no type annotations), so it can be evaluated
// directly as plain JS once the 'export' keyword is stripped.
function loadGeneratorDependencies() {
  const source = readFileSync(depsFilePath, 'utf8').replace(/export const/g, 'const');
  return new Function(`${source}\nreturn { dependencies, devDependencies };`)();
}

// Flattens nested groups (e.g. `sentry: { expo: {...}, next: {...} }`) into top-level pseudo-keys
// so every leaf is a plain `{ [packageName]: version }` map.
function flattenGroups(groups) {
  const flat = {};

  for (const [groupName, group] of Object.entries(groups)) {
    const isPackageMap = Object.values(group).every((value) => typeof value === 'string');

    if (isPackageMap) {
      flat[groupName] = group;
    } else {
      for (const [subGroupName, subGroup] of Object.entries(group)) {
        flat[`${groupName}.${subGroupName}`] = subGroup;
      }
    }
  }

  return flat;
}

function coreVersion(range) {
  return range.replace(/^[\^~]/, '');
}

const rootPackage = loadJson('package.json');
const mobilePackage = loadJson('apps/mobile/package.json');

const mobileVersions = { ...mobilePackage.dependencies, ...mobilePackage.devDependencies };
const rootVersions = { ...rootPackage.dependencies, ...rootPackage.devDependencies };

const { dependencies, devDependencies } = loadGeneratorDependencies();
const groups = {
  ...Object.fromEntries(Object.entries(flattenGroups(dependencies)).map(([k, v]) => [`dependencies.${k}`, v])),
  ...Object.fromEntries(Object.entries(flattenGroups(devDependencies)).map(([k, v]) => [`devDependencies.${k}`, v])),
};

let mismatches = 0;
let notFound = 0;
const rows = [];

for (const [groupName, packages] of Object.entries(groups)) {
  for (const [packageName, declaredRange] of Object.entries(packages)) {
    const workspaceRange = mobileVersions[packageName] ?? rootVersions[packageName];
    const source = packageName in mobileVersions ? 'apps/mobile' : packageName in rootVersions ? 'root' : null;

    if (!source) {
      notFound += 1;
      rows.push({
        groupName,
        packageName,
        declaredRange,
        workspaceRange: '(not in workspace)',
        source: '-',
        status: 'CHECK MANUALLY',
      });
      continue;
    }

    const status = coreVersion(declaredRange) === coreVersion(workspaceRange) ? 'ok' : 'MISMATCH';
    if (status === 'MISMATCH') {
      mismatches += 1;
    }
    rows.push({ groupName, packageName, declaredRange, workspaceRange, source, status });
  }
}

const toReport = rows.filter((row) => row.status !== 'ok');

if (toReport.length === 0) {
  console.log('All versions in plugin/src/shared/dependencies.ts match the workspace. Nothing to propagate.');
} else {
  console.log('Versions in plugin/src/shared/dependencies.ts that differ from the workspace:\n');
  console.table(
    toReport.map((row) => ({
      group: row.groupName,
      package: row.packageName,
      'dependencies.ts': row.declaredRange,
      workspace: row.workspaceRange,
      from: row.source,
      status: row.status,
    })),
  );
  console.log(
    `\n${mismatches} mismatch(es), ${notFound} package(s) not found in root or apps/mobile package.json (verify manually — ` +
      `they may come from another app, e.g. apps/web via root, or be intentionally absent from the workspace).`,
  );
}

process.exit(mismatches > 0 ? 1 : 0);
