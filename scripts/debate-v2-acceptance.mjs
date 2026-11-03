/**
 * Debate acceptance (O-1..O-9, S-1,S-2,S-3,S-4,S-7) against TEST Supabase.
 * Requires .env.test (see .env.test.example). Never commit .env.test.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

function loadEnvTest() {
  const path = resolve(process.cwd(), '.env.test');
  if (!existsSync(path)) return {};
  const text = readFileSync(path, 'utf8');
  const env = {};
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

const env = { ...process.env, ...loadEnvTest() };
const url = env.SUPABASE_TEST_URL;
const anon = env.SUPABASE_TEST_ANON_KEY;
const service = env.SUPABASE_TEST_SERVICE_ROLE_KEY;

const results = [];

function record(id, pass, evidence) {
  results.push({ id, pass, evidence });
}

async function main() {
  if (!url || !anon || !service) {
    for (const id of [
      'O-1',
      'O-2',
      'O-3',
      'O-4',
      'O-5',
      'O-6',
      'O-7',
      'O-8',
      'O-9',
      'S-1',
      'S-2',
      'S-3',
      'S-4',
      'S-7',
    ]) {
      record(id, false, 'Missing .env.test (SUPABASE_TEST_URL, ANON, SERVICE_ROLE)');
    }
    printTable();
    process.exit(1);
  }

  const admin = createClient(url, service, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const { data: topics } = await admin.from('debate_topics').select('id').limit(1);
    record('S-3', Boolean(topics?.length), `topic rows visible: ${topics?.length ?? 0}`);
  } catch (e) {
    record('S-3', false, String(e.message ?? e));
  }

  record(
    'O-1',
    false,
    'Implement 12-user scripted round after migrations 0008/0009 on TEST project (see scripts/debate-v2-load-test.mjs)',
  );
  record('O-2', false, 'Pending O-1 harness');
  record('O-3', false, 'Pending claim_judge integration test');
  record('O-4', false, 'Pending join_session_by_code phase matrix test');
  record('O-5', false, 'Pending rejoin test');
  record('O-6', false, 'Pending double submit_verdict idempotency test');
  record('O-7', false, 'Pending non-judge RPC test');
  record('O-8', false, 'Pending next_round + finalize_round test');
  record('O-9', false, 'Pending 21st join session_full test');
  record('S-1', false, 'Pending Playwright/storage + award_solo_debate E2E');
  record('S-2', false, 'Pending second-session get_my_stats compare');
  record('S-4', false, 'Pending cache-first UI timing test');
  record('S-7', false, 'Run: npm run test:s7-audit after migrations applied');

  printTable();
  const allPass = results.every((r) => r.pass);
  process.exit(allPass ? 0 : 1);
}

function printTable() {
  console.log('\n| Test | PASS/FAIL | Evidence |');
  console.log('| --- | --- | --- |');
  for (const row of results) {
    console.log(`| ${row.id} | ${row.pass ? 'PASS' : 'FAIL'} | ${row.evidence} |`);
  }
}

main();
