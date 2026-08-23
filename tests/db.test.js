/**
 * Database connectivity tests
 * Run with:  node tests/db.test.js
 *
 * Test 1 — Basic connection: sends SELECT 1 to verify the pool can reach the DB.
 * Test 2 — Table access:     queries the `users` table to verify schema exists.
 */

require('dotenv').config();
const pool = require('../config/db');

let passed = 0;
let failed = 0;

async function runTest(name, fn) {
  process.stdout.write(`  [ RUN ] ${name} ... `);
  try {
    await fn();
    console.log('PASS');
    passed++;
  } catch (err) {
    console.log(`FAIL\n         ${err.message}`);
    failed++;
  }
}

async function main() {
  console.log('\nMahee Nexus — Database Tests\n');

  // ------------------------------------------------------------------
  // Test 1: Basic connection
  // ------------------------------------------------------------------
  await runTest('Basic connection (SELECT 1)', async () => {
    const { rows } = await pool.query('SELECT 1 AS result');
    if (rows[0].result !== 1) {
      throw new Error(`Expected 1, got ${rows[0].result}`);
    }
  });

  // ------------------------------------------------------------------
  // Test 2: Users table is accessible
  // ------------------------------------------------------------------
  await runTest('Users table exists and is queryable', async () => {
    const { rows } = await pool.query(
      `SELECT COUNT(*) AS count FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'users'`
    );
    const count = parseInt(rows[0].count, 10);
    if (count === 0) {
      throw new Error('Table "users" not found in public schema — run your DB migrations first');
    }
  });

  // ------------------------------------------------------------------
  // Summary
  // ------------------------------------------------------------------
  console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);

  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('\nUnhandled error:', err.message);
  process.exit(1);
});
