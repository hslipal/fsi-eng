#!/usr/bin/env node
// GUARDRAIL: content is licensed data. Validates every content/**/*.json against the rules in
// content-policy.json and makes sure dev-only (copyrighted) material never enters Git.
//
//   node scripts/content-check.mjs        (called by ./scripts/verify.sh content)
//
// Every error starts with a stable code so the guardrail self-test can assert on it.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_DIR = join(ROOT, 'content');
const policy = JSON.parse(readFileSync(join(ROOT, 'content-policy.json'), 'utf8'));

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TRACKS = ['business', 'it', 'ielts'];
const errors = [];

function fail(file, code, hint) {
  errors.push(`${relative(ROOT, file)}: ${code} — ${hint}`);
}

function listJson(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return listJson(path);
    return name.endsWith('.json') ? [path] : [];
  });
}

function isText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function checkFields(file, item) {
  if (!isText(item.id) || !UUID.test(item.id)) fail(file, 'missing-field:id', 'id must be a UUID');
  if (!TRACKS.includes(item.track)) {
    fail(file, 'missing-field:track', `track must be one of ${TRACKS.join(', ')}`);
  }
  for (const field of ['title', 'level', 'reviewed_by']) {
    if (!isText(item[field])) fail(file, `missing-field:${field}`, `${field} is required`);
  }
  const source = item.source ?? {};
  if (!isText(source.url) && !isText(source.generator)) {
    fail(file, 'missing-field:source', 'source.url (real material) or source.generator is required');
  }
  if (!isText(item.license?.kind)) fail(file, 'missing-field:license', 'license.kind is required');
}

function checkLicense(file, item) {
  const kind = item.license?.kind;
  if (!isText(kind)) return;
  if (!policy.publishableLicenses.includes(kind)) {
    fail(
      file,
      'license-not-publishable',
      `license "${kind}" may not live in content/ (dev-only material belongs in content-dev/)`,
    );
  }
  if (kind === 'licensed' && !isText(item.license.grantId)) {
    fail(file, 'missing-grant-id', 'licensed material needs license.grantId (the contract id)');
  }
  if (kind === 'cc-by' && !isText(item.license.attribution)) {
    fail(file, 'missing-attribution', 'cc-by material needs license.attribution');
  }
  const url = item.source?.url;
  const banned = policy.bannedSourcePatterns.some((pattern) => new RegExp(pattern, 'i').test(url));
  if (isText(url) && banned && kind !== 'licensed') {
    fail(file, 'banned-source', `${url} is a banned source unless licensed with a grantId`);
  }
}

function checkReviewer(file, item) {
  if (isText(item.reviewed_by) && !policy.admins.includes(item.reviewed_by)) {
    fail(file, 'reviewer-not-admin', `reviewed_by must be an admin in content-policy.json`);
  }
}

function checkContentFile(file) {
  let item;
  try {
    item = JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    fail(file, 'invalid-json', String(error));
    return;
  }
  checkFields(file, item);
  checkLicense(file, item);
  checkReviewer(file, item);
}

function checkGitIgnore() {
  const gitignore = join(ROOT, '.gitignore');
  const lines = existsSync(gitignore) ? readFileSync(gitignore, 'utf8').split(/\r?\n/) : [];
  if (!lines.includes('content-dev/')) {
    fail(gitignore, 'content-dev-not-ignored', 'add a "content-dev/" line to .gitignore');
  }
}

function trackedFiles() {
  try {
    const out = execFileSync('git', ['ls-files', '-z'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return out.split('\0').filter((name) => name.length > 0);
  } catch {
    return null;
  }
}

function checkNoDevOnlyTracked() {
  const tracked = trackedFiles();
  if (tracked === null) {
    console.log('  (not a git repository: tracked-file scan skipped)');
    return;
  }
  for (const name of tracked) {
    const path = join(ROOT, name);
    const inDevFolder = name.startsWith('content-dev/');
    const jsonWithDevOnly =
      name.endsWith('.json') &&
      existsSync(path) &&
      /"kind"\s*:\s*"dev-only"/.test(readFileSync(path, 'utf8'));
    if (inDevFolder || jsonWithDevOnly) {
      fail(path, 'dev-only-content-tracked', 'copyrighted dev-only material must not be in Git');
    }
  }
}

const files = listJson(CONTENT_DIR);
files.forEach(checkContentFile);
checkGitIgnore();
checkNoDevOnlyTracked();

if (errors.length > 0) {
  for (const line of errors) console.error(`✖ ${line}`);
  console.error(`\n${errors.length} content problem(s). See AGENTS.md §7 and content/README.md.`);
  process.exit(1);
}
console.log(`✔ ${files.length} content file(s) valid, no dev-only material tracked`);
