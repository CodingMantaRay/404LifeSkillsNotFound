const path = require('path');
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));
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
//  PRODUCTS — full CRUD
// ═══════════════════════════════════════════════════════════════

app.get('/api/products', (req, res) => {
    res.json(db.all('SELECT * FROM products'));
});

app.get('/api/products/:id', (req, res) => {
    const product = db.get('SELECT * FROM products WHERE productId=?', [req.params.id]);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
});

app.post('/api/products', (req, res) => {
    const { productId, name, category, price, description = '', image = '', format = '' } = req.body;
    if (!productId || !name || !category || price == null) {
        return res.status(400).json({ message: 'Missing required fields: productId, name, category, price' });
    }
    db.run(
        `INSERT INTO products (productId,name,category,price,description,image,format)
         VALUES (?,?,?,?,?,?,?)
         ON CONFLICT(productId) DO UPDATE SET
             name=excluded.name, category=excluded.category, price=excluded.price,
             description=excluded.description, image=excluded.image, format=excluded.format`,
        [productId, name, category, price, description, image, format]
    );
    console.log('Product saved:', productId);
    res.status(201).json({ message: 'Product saved', productId });
});

app.put('/api/products/:id', (req, res) => {
    const { name, category, price, description = '', image = '', format = '' } = req.body;
    const result = db.run(
        'UPDATE products SET name=?,category=?,price=?,description=?,image=?,format=? WHERE productId=?',
        [name, category, price, description, image, format, req.params.id]
    );
    if (result.changes === 0) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product updated' });
});

app.delete('/api/products/:id', (req, res) => {
    const result = db.run('DELETE FROM products WHERE productId=?', [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
});

// ═══════════════════════════════════════════════════════════════
//  SHOPPING CART — full CRUD
// ═══════════════════════════════════════════════════════════════

app.get('/api/cart', (req, res) => {
    res.json(db.all('SELECT * FROM cart'));
});

app.get('/api/cart/:id', (req, res) => {
    const item = db.get('SELECT * FROM cart WHERE cartItemId=?', [req.params.id]);
    if (!item) return res.status(404).json({ message: 'Cart item not found' });
    res.json(item);
});

app.post('/api/cart', (req, res) => {
    const { productId, productName, quantity = 1, price, total } = req.body;
    if (!productId || !productName || price == null || total == null) {
        return res.status(400).json({ message: 'Missing required fields: productId, productName, price, total' });
    }
    db.run(
        'INSERT INTO cart (productId,productName,quantity,price,total) VALUES (?,?,?,?,?)',
        [productId, productName, quantity, price, total]
    );
    const inserted = db.get('SELECT * FROM cart WHERE cartItemId = (SELECT MAX(cartItemId) FROM cart)');
    console.log('Cart item added:', productId);
    res.status(201).json({ message: 'Item added to cart', cartItemId: inserted.cartItemId });
});

app.put('/api/cart/:id', (req, res) => {
    const { productId, productName, quantity, price, total } = req.body;
    const result = db.run(
        'UPDATE cart SET productId=?,productName=?,quantity=?,price=?,total=? WHERE cartItemId=?',
        [productId, productName, quantity, price, total, req.params.id]
    );
    if (result.changes === 0) return res.status(404).json({ message: 'Cart item not found' });
    res.json({ message: 'Cart item updated' });
});

app.delete('/api/cart/:id', (req, res) => {
    const result = db.run('DELETE FROM cart WHERE cartItemId=?', [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ message: 'Cart item not found' });
    res.json({ message: 'Cart item removed' });
});

app.delete('/api/cart', (req, res) => {
    db.run('DELETE FROM cart');
    res.json({ message: 'Cart cleared' });
});

// ═══════════════════════════════════════════════════════════════
//  SHIPPING — full CRUD
// ═══════════════════════════════════════════════════════════════

app.get('/api/shipping', (req, res) => {
    res.json(db.all('SELECT * FROM shipping'));
});

app.get('/api/shipping/:id', (req, res) => {
    const record = db.get('SELECT * FROM shipping WHERE id=?', [req.params.id]);
    if (!record) return res.status(404).json({ message: 'Shipping record not found' });
    res.json(record);
});

app.post('/api/shipping', (req, res) => {
    const { fullName, address, city, state, zipCode, deliveryType = '' } = req.body;
    if (!fullName || !address || !city || !state || !zipCode) {
        return res.status(400).json({ message: 'Missing required fields: fullName, address, city, state, zipCode' });
    }
    db.run(
        'INSERT INTO shipping (fullName,address,city,state,zipCode,deliveryType) VALUES (?,?,?,?,?,?)',
        [fullName, address, city, state, zipCode, deliveryType]
    );
    const inserted = db.get('SELECT * FROM shipping WHERE id = (SELECT MAX(id) FROM shipping)');
    console.log('Shipping record saved for:', fullName);
    res.status(201).json({ message: 'Shipping info saved', id: inserted.id });
});

app.put('/api/shipping/:id', (req, res) => {
    const { fullName, address, city, state, zipCode, deliveryType = '' } = req.body;
    const result = db.run(
        'UPDATE shipping SET fullName=?,address=?,city=?,state=?,zipCode=?,deliveryType=? WHERE id=?',
        [fullName, address, city, state, zipCode, deliveryType, req.params.id]
    );
    if (result.changes === 0) return res.status(404).json({ message: 'Shipping record not found' });
    res.json({ message: 'Shipping info updated' });
});

app.delete('/api/shipping/:id', (req, res) => {
    const result = db.run('DELETE FROM shipping WHERE id=?', [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ message: 'Shipping record not found' });
    res.json({ message: 'Shipping record deleted' });
});

// ═══════════════════════════════════════════════════════════════
//  BILLING — full CRUD
// ═══════════════════════════════════════════════════════════════

app.get('/api/billing', (req, res) => {
    res.json(db.all('SELECT * FROM billing'));
});

app.get('/api/billing/:id', (req, res) => {
    const record = db.get('SELECT * FROM billing WHERE id=?', [req.params.id]);
    if (!record) return res.status(404).json({ message: 'Billing record not found' });
    res.json(record);
});

app.post('/api/billing', (req, res) => {
    const { fullName, address, cardNumber, expirationDate, securityCode, totalAmount = 0 } = req.body;
    if (!fullName || !address || !cardNumber || !expirationDate || !securityCode) {
        return res.status(400).json({ message: 'Missing required fields: fullName, address, cardNumber, expirationDate, securityCode' });
    }
    db.run(
        'INSERT INTO billing (fullName,address,cardNumber,expirationDate,securityCode,totalAmount) VALUES (?,?,?,?,?,?)',
        [fullName, address, cardNumber, expirationDate, securityCode, totalAmount]
    );
    const inserted = db.get('SELECT * FROM billing WHERE id = (SELECT MAX(id) FROM billing)');
    console.log('Billing record saved for:', fullName);
    res.status(201).json({ message: 'Billing info saved', id: inserted.id });
});

app.put('/api/billing/:id', (req, res) => {
    const { fullName, address, cardNumber, expirationDate, securityCode, totalAmount = 0 } = req.body;
    const result = db.run(
        'UPDATE billing SET fullName=?,address=?,cardNumber=?,expirationDate=?,securityCode=?,totalAmount=? WHERE id=?',
        [fullName, address, cardNumber, expirationDate, securityCode, totalAmount, req.params.id]
    );
    if (result.changes === 0) return res.status(404).json({ message: 'Billing record not found' });
    res.json({ message: 'Billing info updated' });
});

app.delete('/api/billing/:id', (req, res) => {
    const result = db.run('DELETE FROM billing WHERE id=?', [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ message: 'Billing record not found' });
    res.json({ message: 'Billing record deleted' });
});

// ═══════════════════════════════════════════════════════════════
//  RETURNS — full CRUD
// ═══════════════════════════════════════════════════════════════

app.get('/api/returns', (req, res) => {
    res.json(db.all('SELECT * FROM returns'));
});

app.get('/api/returns/:id', (req, res) => {
    const record = db.get('SELECT * FROM returns WHERE id=?', [req.params.id]);
    if (!record) return res.status(404).json({ message: 'Return record not found' });
    res.json(record);
});

app.post('/api/returns', (req, res) => {
    const { productName, price = 0, reason = '', condition = '', notes = '', status = 'Pending' } = req.body;
    if (!productName) {
        return res.status(400).json({ message: 'Missing required field: productName' });
    }
    db.run(
        'INSERT INTO returns (productName,price,reason,condition,notes,status) VALUES (?,?,?,?,?,?)',
        [productName, price, reason, condition, notes, status]
    );
    const inserted = db.get('SELECT * FROM returns WHERE id = (SELECT MAX(id) FROM returns)');
    console.log('Return submitted for:', productName);
    res.status(201).json({ message: 'Return submitted', id: inserted.id });
});

app.put('/api/returns/:id', (req, res) => {
    const { productName, price = 0, reason = '', condition = '', notes = '', status } = req.body;
    const result = db.run(
        'UPDATE returns SET productName=?,price=?,reason=?,condition=?,notes=?,status=? WHERE id=?',
        [productName, price, reason, condition, notes, status, req.params.id]
    );
    if (result.changes === 0) return res.status(404).json({ message: 'Return record not found' });
    res.json({ message: 'Return updated' });
});

app.delete('/api/returns/:id', (req, res) => {
    const result = db.run('DELETE FROM returns WHERE id=?', [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ message: 'Return record not found' });
    res.json({ message: 'Return deleted' });
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
