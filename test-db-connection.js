const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'risk_analyzer',
  user: 'postgres',
  password: 'postgres',
  // Try with no SSL
  ssl: false,
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Connected successfully!');
    const result = await client.query('SELECT NOW()');
    console.log('✅ Query result:', result.rows[0]);
    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error code:', error.code);
    process.exit(1);
  }
}

testConnection();
