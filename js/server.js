const path = require('path');
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, '../')));
app.use(express.json());

// ═══════════════════════════════════════════════════════════════
//  ARTICLES — full CRUD
// ═══════════════════════════════════════════════════════════════

// GET all articles
app.get('/api/articles', (req, res) => {
    const articles = db.all('SELECT * FROM articles');
    res.json(articles);
});

// GET one article by ID
app.get('/api/articles/:id', (req, res) => {
    const article = db.get('SELECT * FROM articles WHERE id = ?', [req.params.id]);
    if (!article) return res.status(404).json({ message: 'Article not found' });
    res.json(article);
});

// POST create or update an article (upsert)
app.post('/api/articles', (req, res) => {
    const { id, title, author, category, contentSnippet = '', preferredDistChannel = '', notes = '', status = 'Pending' } = req.body;
    if (!id || !title || !author || !category) {
        return res.status(400).json({ message: 'Missing required fields: id, title, author, category' });
    }
    db.run(
        `INSERT INTO articles (id, title, author, category, contentSnippet, preferredDistChannel, notes, status)
         VALUES (?,?,?,?,?,?,?,?)
         ON CONFLICT(id) DO UPDATE SET
             title=excluded.title, author=excluded.author, category=excluded.category,
             contentSnippet=excluded.contentSnippet, preferredDistChannel=excluded.preferredDistChannel,
             notes=excluded.notes, status=excluded.status`,
        [id, title, author, category, contentSnippet, preferredDistChannel, notes, status]
    );
    console.log('Article saved:', id);
    res.status(201).json({ message: 'Article saved', id });
});

// PUT update an existing article
app.put('/api/articles/:id', (req, res) => {
    const { title, author, category, contentSnippet = '', preferredDistChannel = '', notes = '', status } = req.body;
    const result = db.run(
        `UPDATE articles SET title=?, author=?, category=?, contentSnippet=?,
         preferredDistChannel=?, notes=?, status=? WHERE id=?`,
        [title, author, category, contentSnippet, preferredDistChannel, notes, status, req.params.id]
    );
    if (result.changes === 0) return res.status(404).json({ message: 'Article not found' });
    console.log('Article updated:', req.params.id);
    res.json({ message: 'Article updated' });
});

// DELETE an article
app.delete('/api/articles/:id', (req, res) => {
    const result = db.run('DELETE FROM articles WHERE id=?', [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ message: 'Article not found' });
    console.log('Article deleted:', req.params.id);
    res.json({ message: 'Article deleted' });
});

// ═══════════════════════════════════════════════════════════════
//  SUBSCRIBERS — full CRUD
// ═══════════════════════════════════════════════════════════════

// GET all subscribers
app.get('/api/subscribers', (req, res) => {
    const subscribers = db.all('SELECT * FROM subscribers');
    res.json(subscribers);
});

// GET one subscriber by ID
app.get('/api/subscribers/:id', (req, res) => {
    const subscriber = db.get('SELECT * FROM subscribers WHERE id=?', [req.params.id]);
    if (!subscriber) return res.status(404).json({ message: 'Subscriber not found' });
    res.json(subscriber);
});

// POST create a subscriber
app.post('/api/subscribers', (req, res) => {
    const { name, email, phone = '', ageOrYear = '', address = '' } = req.body;
    if (!name || !email) {
        return res.status(400).json({ message: 'Missing required fields: name, email' });
    }
    try {
        db.run(
            'INSERT INTO subscribers (name, email, phone, ageOrYear, address) VALUES (?,?,?,?,?)',
            [name, email, phone, ageOrYear, address]
        );
        const inserted = db.get('SELECT * FROM subscribers WHERE email=?', [email]);
        console.log('Subscriber added:', email);
        res.status(201).json({ message: 'Subscriber added', id: inserted.id });
    } catch (err) {
        if (err.message && err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ message: 'Email already registered' });
        }
        res.status(500).json({ message: 'Error saving subscriber' });
    }
});

// PUT update a subscriber
app.put('/api/subscribers/:id', (req, res) => {
    const { name, email, phone = '', ageOrYear = '', address = '' } = req.body;
    if (!name || !email) {
        return res.status(400).json({ message: 'Missing required fields: name, email' });
    }
    try {
        const result = db.run(
            'UPDATE subscribers SET name=?, email=?, phone=?, ageOrYear=?, address=? WHERE id=?',
            [name, email, phone, ageOrYear, address, req.params.id]
        );
        if (result.changes === 0) return res.status(404).json({ message: 'Subscriber not found' });
        console.log('Subscriber updated:', req.params.id);
        res.json({ message: 'Subscriber updated' });
    } catch (err) {
        if (err.message && err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ message: 'Email already in use' });
        }
        res.status(500).json({ message: 'Error updating subscriber' });
    }
});

// DELETE a subscriber
app.delete('/api/subscribers/:id', (req, res) => {
    const result = db.run('DELETE FROM subscribers WHERE id=?', [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ message: 'Subscriber not found' });
    console.log('Subscriber deleted:', req.params.id);
    res.json({ message: 'Subscriber deleted' });
});

// ═══════════════════════════════════════════════════════════════
//  LEGACY ENDPOINTS — kept so existing pages keep working
// ═══════════════════════════════════════════════════════════════

app.get('/api/submissions', (req, res) => {
    res.json(db.all('SELECT * FROM articles'));
});

app.post('/api/submit', (req, res) => {
    const { id, title, author, category, contentSnippet = '', preferredDistChannel = '', notes = '', status = 'Pending' } = req.body;
    if (!id) return res.status(400).json({ message: 'Missing article ID' });
    db.run(
        `INSERT INTO articles (id, title, author, category, contentSnippet, preferredDistChannel, notes, status)
         VALUES (?,?,?,?,?,?,?,?)
         ON CONFLICT(id) DO UPDATE SET
             title=excluded.title, author=excluded.author, category=excluded.category,
             contentSnippet=excluded.contentSnippet, preferredDistChannel=excluded.preferredDistChannel,
             notes=excluded.notes, status=excluded.status`,
        [id, title, author, category, contentSnippet, preferredDistChannel, notes, status]
    );
    console.log('Submission saved:', id);
    res.json({ message: 'Submission received successfully' });
});

app.post('/api/approve', (req, res) => {
    const { id, status } = req.body;
    if (!id || !status) return res.status(400).json({ message: 'Missing id or status' });
    const result = db.run('UPDATE articles SET status=? WHERE id=?', [status, id]);
    if (result.changes === 0) return res.status(404).json({ message: 'Article not found' });
    console.log(`Article ${id} status → ${status}`);
    res.json({ message: `Submission status updated to ${status}` });
});

// ═══════════════════════════════════════════════════════════════
//  Start server after database is ready
// ═══════════════════════════════════════════════════════════════

db.init().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Access site at http://localhost:${PORT}/index.html`);
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});
