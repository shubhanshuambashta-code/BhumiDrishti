const { Pool } = require('pg');
const fs = require('fs/promises');
const path = require('path');

let pool;
let isDbConnected = false;

const dataDir = process.env.DATA_PATH 
  ? path.resolve(process.env.DATA_PATH, 'processed')
  : path.resolve(__dirname, '..', '..', '..', 'data', 'processed');

async function connectDB() {
  try {
    pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    const client = await pool.connect();
    client.release();
    isDbConnected = true;
    console.log('PostgreSQL connected');
  } catch (error) {
    console.warn('PostgreSQL connection failed, falling back to JSON data files.');
    isDbConnected = false;
  }
}

function getPool() { return pool; }
function isConnected() { return isDbConnected; }

module.exports = { connectDB, getPool, isConnected, dataDir };
