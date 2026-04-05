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

// Returns all rows as an array of plain objects
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

    if (fs.existsSync(DB_PATH)) {
        db = new SQL.Database(fs.readFileSync(DB_PATH));
    } else {
        db = new SQL.Database();
    }

    // ─── Schema ───────────────────────────────────────────────────────────────

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
        CREATE TABLE IF NOT EXISTS products (
            productId   TEXT PRIMARY KEY,
            name        TEXT NOT NULL,
            category    TEXT NOT NULL,
            price       REAL NOT NULL,
            description TEXT DEFAULT '',
            image       TEXT DEFAULT '',
            format      TEXT DEFAULT ''
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS cart (
            cartItemId  INTEGER PRIMARY KEY AUTOINCREMENT,
            productId   TEXT NOT NULL,
            productName TEXT NOT NULL,
            quantity    INTEGER NOT NULL DEFAULT 1,
            price       REAL NOT NULL,
            total       REAL NOT NULL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS shipping (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            fullName     TEXT NOT NULL,
            address      TEXT NOT NULL,
            city         TEXT NOT NULL,
            state        TEXT NOT NULL,
            zipCode      TEXT NOT NULL,
            deliveryType TEXT DEFAULT ''
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS billing (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            fullName       TEXT NOT NULL,
            address        TEXT NOT NULL,
            cardNumber     TEXT NOT NULL,
            expirationDate TEXT NOT NULL,
            securityCode   TEXT NOT NULL,
            totalAmount    REAL DEFAULT 0
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS returns (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            productName TEXT NOT NULL,
            price       REAL DEFAULT 0,
            reason      TEXT DEFAULT '',
            condition   TEXT DEFAULT '',
            notes       TEXT DEFAULT '',
            status      TEXT DEFAULT 'Pending'
        )
    `);

    // ─── Seed initial articles (only if table is empty) ──────────────────────

    const countResult = db.exec('SELECT COUNT(*) FROM articles');
    const count = countResult[0] ? countResult[0].values[0][0] : 0;

    if (count === 0) {
        const seedArticles = [
            ['HS301', 'Sunday Reset Routine',      'Lauren', 'Home Organization',  'A simple routine to prepare the home for the week ahead.', '',             '',                          'Pending'],
            ['HS302', '5-Minute Kitchen Reset',    'Lauren', 'Kitchen Resources',  'Quick habits that help keep the kitchen clean and calm.',   '',             '',                          'Approved'],
            ['HS303', 'Weekly Cleaning Checklist', 'Lauren', 'Printable Planners', 'A printable guide readers can use to stay on track.',       '',             '',                          'Pending'],
            ['HS304', 'Bathroom Refresh',          'Lauren', 'Cleaning Guides',    'Simple fixes and tips that help revive your bathroom.',     'Blog Feature', 'Both specific and simple fixes', 'Revisions Requested']
        ];
        for (const row of seedArticles) {
            db.run(
                'INSERT INTO articles (id,title,author,category,contentSnippet,preferredDistChannel,notes,status) VALUES (?,?,?,?,?,?,?,?)',
                row
            );
        }
    }

    // ─── Seed initial products (only if table is empty) ──────────────────────

    const prodCount = db.exec('SELECT COUNT(*) FROM products');
    const pCount = prodCount[0] ? prodCount[0].values[0][0] : 0;

    if (pCount === 0) {
        const seedProducts = [
            ['HS101', 'Kitchen Reset Guide',       'Kitchen Resources',  12.99, 'A step-by-step guide to resetting your kitchen.',      '', 'Download'],
            ['HS102', 'Closet Refresh Bundle',     'Home Organization',  15.99, 'Everything you need to refresh your closet space.',    '', 'Bundle'],
            ['HS103', 'Weekly Home Planner Pack',  'Printable Planners',  8.99, 'Printable weekly planner to keep your home on track.', '', 'Pack']
        ];
        for (const row of seedProducts) {
            db.run(
                'INSERT INTO products (productId,name,category,price,description,image,format) VALUES (?,?,?,?,?,?,?)',
                row
            );
        }
    }

    save();
    console.log('SQLite database ready:', DB_PATH);
}

module.exports = { init, save, all, get, run };
