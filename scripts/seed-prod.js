#!/usr/bin/env node
/**
 * Production database seeder.
 * Reads scripts/seed.sql (data-only pg_dump), strips Replit-specific meta-commands,
 * and inserts all rows into $DATABASE_URL — skipping if data already exists.
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function seed() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌  DATABASE_URL is not set.');
    process.exit(1);
  }

  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  try {
    // Check if data is already present
    const { rows } = await client.query('SELECT COUNT(*) AS cnt FROM airlines');
    const existing = parseInt(rows[0].cnt, 10);
    if (existing > 0) {
      console.log(`✅  Production database already has ${existing} airlines — skipping seed.`);
      return;
    }

    console.log('🌱  Production database is empty — seeding...');

    const sqlFile = path.join(__dirname, 'seed.sql');
    const raw = fs.readFileSync(sqlFile, 'utf8');

    // Strip Replit-specific meta-commands and PostgreSQL client-only directives
    const sql = raw
      .split('\n')
      .filter(line => !line.startsWith('\\restrict') && !line.startsWith('\\unrestrict'))
      .join('\n');

    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');

    // Verify
    const verify = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM airlines)          AS airlines,
        (SELECT COUNT(*) FROM airports)          AS airports,
        (SELECT COUNT(*) FROM airline_operations) AS ops,
        (SELECT COUNT(*) FROM ground_handlers)   AS handlers
    `);
    const v = verify.rows[0];
    console.log(`✅  Seeded successfully:`);
    console.log(`    airlines=${v.airlines}  airports=${v.airports}  ops=${v.ops}  handlers=${v.handlers}`);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('❌  Seed failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
