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

// The only place a tracked file may say "dev-only": tiny fake fixtures for backend tests.
const TEST_FIXTURE = 'backend/src/test/resources/content-dev-fixture/';
const MAX_FIXTURE_BYTES = 4096;

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
  for (const field of ['title', 'level']) {
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

const DRILL_TYPES = ['substitution', 'transformation', 'expansion', 'translation', 'response'];

function isDraft(file) {
  return relative(CONTENT_DIR, file).split(/[\\/]/)[0] === '_drafts';
}

function checkReviewer(file, item) {
  if (isDraft(file)) {
    if (item.reviewed_by !== undefined) {
      fail(file, 'draft-has-reviewer', 'drafts are unreviewed: move the file out of _drafts/');
    }
    return;
  }
  if (!isText(item.reviewed_by)) {
    fail(file, 'missing-field:reviewed_by', 'reviewed_by is required outside content/_drafts/');
  } else if (!policy.admins.includes(item.reviewed_by)) {
    fail(file, 'reviewer-not-admin', `reviewed_by must be an admin in content-policy.json`);
  }
}

function itemProblem(it, needsOptions) {
  if (!isText(it?.cue)) return 'every item needs a cue';
  if (!Array.isArray(it.answers) || it.answers.length === 0 || !it.answers.every(isText)) {
    return 'every item needs at least one answer';
  }
  const options = it.options ?? [];
  if (!Array.isArray(options) || !options.every(isText)) return 'options must be text';
  if (needsOptions && options.length === 0) return 'every reading question needs options';
  if (options.length > 0 && !it.answers.every((answer) => options.includes(answer))) {
    return `answer of "${it.cue}" is not one of its options`;
  }
  return null;
}

function itemsProblem(items, needsOptions) {
  if (!Array.isArray(items) || items.length === 0) return 'a drill needs items';
  for (const it of items) {
    const problem = itemProblem(it, needsOptions);
    if (problem !== null) return problem;
  }
  return null;
}

function drillProblem(drill) {
  if (drill?.type === 'dialogue') {
    const lines = drill.lines;
    if (!Array.isArray(lines) || lines.length === 0) return 'a dialogue needs lines';
    const bad = lines.some((line) => !isText(line?.speaker) || !isText(line?.text));
    return bad ? 'every dialogue line needs speaker and text' : null;
  }
  if (drill?.type === 'speaking') {
    if (!isText(drill.instruction)) return 'a speaking drill needs an instruction';
    if (!Array.isArray(drill.items) || drill.items.length === 0) return 'a speaking drill needs items';
    const bad = drill.items.find(
      (it) =>
        !isText(it?.cue) ||
        ![1, 2, 3].includes(it.part) ||
        (it.audio !== undefined && (!isText(it.audio) || it.audio.split(/[\\/]/).includes('..'))),
    );
    return bad === undefined ? null : 'every speaking item needs a cue, part 1-3 and a safe audio path';
  }
  if (drill?.type === 'reading') {
    if (!isText(drill.instruction)) return 'a reading drill needs an instruction';
    if (!isText(drill.passage)) return 'a reading drill needs a passage';
    return itemsProblem(drill.items, true);
  }
  if (!DRILL_TYPES.includes(drill?.type)) {
    return `type must be dialogue, reading, speaking or ${DRILL_TYPES.join(', ')}`;
  }
  if (!isText(drill.instruction)) return `a ${drill.type} drill needs an instruction`;
  return itemsProblem(drill.items, false);
}

function checkDrills(file, item) {
  if (item.drills === undefined) return;
  if (!Array.isArray(item.drills)) {
    fail(file, 'invalid-drill', 'drills must be an array');
    return;
  }
  item.drills.forEach((drill, index) => {
    const problem = drillProblem(drill);
    if (problem !== null) fail(file, 'invalid-drill', `drills[${index}]: ${problem}`);
  });
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
  checkDrills(file, item);
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
    if (name.startsWith(TEST_FIXTURE) && statSync(path).size <= MAX_FIXTURE_BYTES) {
      continue; // fake dev-only data for backend tests; real material would exceed the size cap
    }
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

function checkDevSwitch() {
  const resources = join(ROOT, 'backend', 'src', 'main', 'resources');
  if (!existsSync(resources)) return;
  for (const name of readdirSync(resources)) {
    if (!/^application.*\.(properties|ya?ml)$/.test(name) || name === 'application-dev.properties') {
      continue;
    }
    const text = readFileSync(join(resources, name), 'utf8');
    if (/include-dev-only\s*[=:]\s*true/.test(text)) {
      fail(
        join(resources, name),
        'dev-only-enabled-outside-dev-profile',
        'fsi.content.include-dev-only=true belongs only in application-dev.properties',
      );
    }
  }
}

const files = listJson(CONTENT_DIR);
files.forEach(checkContentFile);
checkGitIgnore();
checkNoDevOnlyTracked();
checkDevSwitch();

if (errors.length > 0) {
  for (const line of errors) console.error(`✖ ${line}`);
  console.error(`\n${errors.length} content problem(s). See AGENTS.md §7 and content/README.md.`);
  process.exit(1);
}
console.log(`✔ ${files.length} content file(s) valid, no dev-only material tracked`);
