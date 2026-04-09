/*
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../data');
const DB_PATH = path.join(dataDir, 'magazine.db');

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

let db;

// Saves the in-memory database to disk after every write
function save() {
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// Returns all rows from a prepared statement as an array of plain objects
function all(sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
}

// Returns a single row, or undefined
function get(sql, params = []) {
    return all(sql, params)[0];
}

// Runs a statement and returns { changes }
function run(sql, params = []) {
    db.run(sql, params);
    save();
    return { changes: db.getRowsModified() };
}

async function init() {
    const SQL = await initSqlJs();

    // Load existing database file if it exists, otherwise start fresh
    if (fs.existsSync(DB_PATH)) {
        db = new SQL.Database(fs.readFileSync(DB_PATH));
    } else {
        db = new SQL.Database();
    }

    // ─── Schema ──────────────────────────────────────────────────────────────

    db.run(`
        CREATE TABLE IF NOT EXISTS articles (
            id                   TEXT PRIMARY KEY,
            title                TEXT NOT NULL,
            author               TEXT NOT NULL,
            category             TEXT NOT NULL,
            contentSnippet       TEXT DEFAULT '',
            preferredDistChannel TEXT DEFAULT '',
            notes                TEXT DEFAULT '',
            status               TEXT DEFAULT 'Pending'
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS subscribers (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            name      TEXT NOT NULL,
            email     TEXT NOT NULL UNIQUE,
            phone     TEXT DEFAULT '',
            ageOrYear TEXT DEFAULT '',
            address   TEXT DEFAULT ''
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS returns (
        id TEXT PRIMARY KEY,
        productDesc TEXT,
        price REAL,
        reason TEXT,
        itemCondition TEXT,
        notes TEXT,
        status TEXT DEFAULT 'Pending',
        sessionId TEXT
    )
     `);

     db.run(`
        CREATE TABLE IF NOT EXISTS billingInfo( billingID TEXT PRIMARY KEY, purchaseId TEXT, name TEXT, address TEXT, city TEXT, state TEXT, zipCode TEXT, creditCardNum TEXT, expirationDate TEXT, securityCode TEXT, shippingDetails TEXT)
    `);

    // ─── Seed initial articles (only if table is empty) ──────────────────────

    const countResult = db.exec('SELECT COUNT(*) FROM articles');
    const count = countResult[0] ? countResult[0].values[0][0] : 0;

    if (count === 0) {
        const seedArticles = [
            ['HS301', 'Sunday Reset Routine',     'Lauren', 'Home Organization',  'A simple routine to prepare the home for the week ahead.', '',             '',                          'Pending'],
            ['HS302', '5-Minute Kitchen Reset',   'Lauren', 'Kitchen Resources',  'Quick habits that help keep the kitchen clean and calm.',   '',             '',                          'Approved'],
            ['HS303', 'Weekly Cleaning Checklist','Lauren', 'Printable Planners', 'A printable guide readers can use to stay on track.',       '',             '',                          'Pending'],
            ['HS304', 'Bathroom Refresh',          'Lauren', 'Cleaning Guides',    'Simple fixes and tips that help revive your bathroom.',     'Blog Feature', 'Both specific and simple fixes', 'Revisions Requested']
        ];

        for (const row of seedArticles) {
            db.run(
                'INSERT INTO articles (id, title, author, category, contentSnippet, preferredDistChannel, notes, status) VALUES (?,?,?,?,?,?,?,?)',
                row
            );
        }

        console.log('Database seeded with initial articles.');
    }

    save();
    console.log('SQLite database ready:', DB_PATH);
}

module.exports = { init, save, all, get, run };
*/