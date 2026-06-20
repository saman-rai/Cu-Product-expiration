const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'cu-store.db');

let db = null;

function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

async function initDatabase() {
  const SQL = await initSqlJs();

  // Load existing DB or create new
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');
  initTables();
  saveDb();
  return db;
}

function saveDb() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function initTables() {
  const d = getDb();
  d.run(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      username    TEXT NOT NULL UNIQUE,
      password    TEXT NOT NULL,
      store_name  TEXT DEFAULT 'CU 편의점',
      role        TEXT DEFAULT 'staff',
      created_at  TEXT DEFAULT (datetime('now','localtime'))
    )
  `);
  d.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      parent_id   INTEGER,
      sort_order  INTEGER DEFAULT 0,
      is_active   INTEGER DEFAULT 1,
      created_at  TEXT DEFAULT (datetime('now','localtime'))
    )
  `);
  d.run(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      name           TEXT NOT NULL,
      contact_person TEXT,
      phone          TEXT,
      email          TEXT,
      notes          TEXT,
      created_at     TEXT DEFAULT (datetime('now','localtime'))
    )
  `);
  d.run(`
    CREATE TABLE IF NOT EXISTS products (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode          TEXT,
      name             TEXT NOT NULL,
      category_id      INTEGER,
      supplier_id      INTEGER,
      quantity         INTEGER DEFAULT 1,
      unit             TEXT DEFAULT '개',
      shelf_location   TEXT,
      expiry_date      TEXT NOT NULL,
      manufactured_date TEXT,
      batch_number     TEXT,
      cost_price       REAL,
      selling_price    REAL,
      notes            TEXT,
      is_active        INTEGER DEFAULT 1,
      created_by       INTEGER,
      created_at       TEXT DEFAULT (datetime('now','localtime')),
      updated_at       TEXT DEFAULT (datetime('now','localtime'))
    )
  `);
  d.run(`
    CREATE INDEX IF NOT EXISTS idx_products_expiry ON products(expiry_date)
  `);
  d.run(`
    CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)
  `);
  d.run(`
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)
  `);
  d.run(`
    CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active)
  `);
  d.run(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER,
      action      TEXT,
      details     TEXT,
      created_at  TEXT DEFAULT (datetime('now','localtime'))
    )
  `);

  // Migrate: add parent_id column if missing (for upgrades)
  try {
    d.run('ALTER TABLE categories ADD COLUMN sort_order INTEGER DEFAULT 0');
  } catch {}
  try {
    d.run('ALTER TABLE categories ADD COLUMN is_active INTEGER DEFAULT 1');
  } catch {}
}

// Helper: run a SELECT query, returns array of objects
function query(sql, params = []) {
  const d = getDb();
  if (sql.trim().toUpperCase().startsWith('SELECT') || sql.trim().toUpperCase().startsWith('WITH')) {
    try {
      const stmt = d.prepare(sql);
      if (!Array.isArray(params)) params = [params];
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return rows;
    } catch (err) {
      // Try exec for non-prepared-statement queries (like SELECT * without params)
      try {
        const result = d.exec(sql);
        if (result.length === 0) return [];
        const { columns, values } = result[0];
        return values.map(row => {
          const obj = {};
          columns.forEach((col, i) => { obj[col] = row[i]; });
          return obj;
        });
      } catch (e) {
        throw err;
      }
    }
  }
  // Non-SELECT (INSERT, UPDATE, DELETE)
  try {
    const stmt = d.prepare(sql);
    if (!Array.isArray(params)) params = [params];
    stmt.bind(params);
    stmt.step();
    const result = {
      lastInsertRowid: d.exec("SELECT last_insert_rowid() as id")[0]?.values[0][0] || 0,
      changes: d.exec("SELECT changes() as c")[0]?.values[0][0] || 0,
    };
    stmt.free();
    saveDb();
    return result;
  } catch (err) {
    // Fallback to exec
    d.run(sql, params);
    saveDb();
    return {
      lastInsertRowid: d.exec("SELECT last_insert_rowid() as id")[0]?.values[0][0] || 0,
      changes: d.exec("SELECT changes() as c")[0]?.values[0][0] || 0,
    };
  }
}

// Helper: get a single row
function queryOne(sql, params = []) {
  const rows = query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// Helper: execute write query
function execute(sql, params = []) {
  return query(sql, params);
}

module.exports = { getDb, initDatabase, saveDb, query, queryOne, execute };
