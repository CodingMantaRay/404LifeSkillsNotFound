const path = require('path');
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();
const crypto = require("crypto");
const e = require('express');

// https://stackoverflow.com/questions/50093144
const db = new sqlite3.Database('./magazine.db', (err) => {
    if (err) {
        console.error(err.message);
    } else {
    console.log('Connected to the magazine database.');
    db.run("PRAGMA foreign_keys = ON");

    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS articles (id TEXT PRIMARY KEY, title TEXT NOT NULL, category TEXT NOT NULL, contentSnippet TEXT NOT NULL, preferredDistChannel TEXT NOT NULL, notes TEXT, status TEXT DEFAULT 'Pending')`);
        
        db.run(`CREATE TABLE IF NOT EXISTS subscribers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT, age INTEGER, address TEXT)`);

        db.run(`CREATE TABLE IF NOT EXISTS returnRequests ( id TEXT PRIMARY KEY, sessionId TEXT, productDesc TEXT, price REAL, reason TEXT, itemCondition TEXT, notes TEXT, status TEXT DEFAULT 'Pending')`);

        db.run (`CREATE TABLE IF NOT EXISTS billingInfo (billingId TEXT PRIMARY KEY, purchaseId TEXT, name TEXT, address TEXT, city TEXT, state TEXT, zipCode TEXT, creditCardNum TEXT, expirationDate TEXT, securityCode TEXT, shippingDetails TEXT)`);

        db.run (`CREATE TABLE IF NOT EXISTS carts (cartId TEXT PRIMARY KEY, sessionId TEXT UNIQUE)`);

        db.run (`CREATE TABLE IF NOT EXISTS cartItems (cartId TEXT, productId TEXT, quantity INTEGER, PRIMARY KEY (cartId, productId), FOREIGN KEY (cartId) REFERENCES carts(cartId) ON DELETE CASCADE)`);

        console.log("Database tables initialized.");
    });
    }
});

app.use(cors());
app.use(express.static("public")); // Serve static files from the "public" directory
app.use(express.json());

const PORT = 3000;

// POST - Create
// GET - Retrieve
// PUT - Update
// DELETE - Delete

function verifyFields(item, fields, exclude = []) {
    for (let field of fields) {
        if (!(field in item) && !(exclude.includes(field))) {
            return false;
        }
    }
    return true;
}

// ----------------------------------------------------------------

// Subscribers

const subscriberTable = "subscribers";
const subscriberFields = ["name", "email", "phone", "age", "address", "id"];

function verifySubscriber(subscriber, exclude = []) {
    return verifyFields(subscriber, subscriberFields, exclude);
}

app.get("/api/subscribers", (req, res) => {
    db.all("SELECT * FROM " + subscriberTable, [], (err, rows) => {
        if (err) {
            console.log(err);
            res.status(500).json("Server Error");
        } else {
            rows.forEach((value) => {
                value.ageOrYear = value.age;
                delete value.age;
            });
            res.json(rows);
        }
    });
});

app.post("/api/subscribers", (req, res) => {
    if (req.body && verifySubscriber(req.body, ["id"])) {
       const sql = `INSERT INTO ${subscriberTable} (name, email, phone, age, address) VALUES (?, ?, ?, ?, ?)`;
       const params = [req.body.name, req.body.email, req.body.phone, req.body.age, req.body.address];
       
        db.run(sql, params, function(err) {
                if (err) {
                    console.log(err);
                    res.status(500).json("Server Error");
                } else {
                    res.json({
                        id: this.lastID,
                        success: true
                    });
                }
            });
    } else {
        res.status(400).json({
            message: 'Message body is missing properties'
        });
    }
});

app.put("/api/subscribers", (req, res) => {
    if (req.body && verifySubscriber(req.body)) {
        const sql = `UPDATE ${subscriberTable} SET name=?, email=?, phone=?, age=?, address=? WHERE id=?`;
        const params = [req.body.name, req.body.email, req.body.phone, req.body.age, req.body.address, req.body.id];

        db.run(sql, params, function(err) {
                if (err) {
                    console.log(err);
                    res.status(500).json("Server Error");
                } else {
                    res.json({
                        success: this.changes > 0
                    });
                }
            });
    } else {
        res.status(400).json({
            message: 'Message body is missing properties'
        });
    }
});

app.delete("/api/subscribers", (req, res) => {
    if (req.body && "id" in req.body) {
      const sql = `DELETE FROM ${subscriberTable} WHERE id=?`;
        db.run(sql, [req.body.id],function(err) {
                if (err) {
                    console.log(err);
                    res.status(500).json("Server Error");
                } else {
                    res.json({
                        success: this.changes > 0
                    });
                }
            });
    } else {
        res.status(400).json({
            message: 'Message body is missing an "id" property'
        });
    }
});

// ----------------------------------------------------------------

// Submissions

const submissionFields = ["id", "title", "author", "category", "contentSnippet", "preferredDistChannel", "notes", "status", "pubDate", "featured", "access"];
// const statusOptions = ["Pending", "Approved", "Rejected", "Revisions Requested"];
// const distOptions = ["Website Feature", "Email Newsletter", "Subscriber Portal", "Blog Feature"];

app.get('/api/submissions', (req, res) => {
    db.all("SELECT * FROM submissions", [], (err, rows) => {
        if (err) {
            console.error(err.message)
            res.status(500).json({ message: 'Error reading submissions' });
        } else {
            res.json(rows);
        }
    });
});

app.post("/api/submissions", postSubmission);
app.post('/api/submit', postSubmission);

function postSubmission(req, res) {
    if (req.body && verifyFields(req.body, submissionFields, ["status"])) {
        db.get('SELECT id FROM submissions WHERE id = ?', [req.body.id], (err, row) => {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ message: 'Error saving submission' });
            } else {
                const idFound = !!row;

                let query, values;
                if (!idFound) {
                    query = 'INSERT INTO submissions (id, title, author, category, contentSnippet, preferredDistChannel, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
                    values = [req.body.id, req.body.title, req.body.author, req.body.category, req.body.contentSnippet,
                        req.body.preferredDistChannel, req.body.notes, "Pending"];
                } else {
                    query = `UPDATE submissions SET title=?, author=?, category=?, contentSnippet=?, preferredDistChannel=?, notes=? WHERE id=?`;
                    values = [req.body.title, req.body.author, req.body.category, req.body.contentSnippet,
                        req.body.preferredDistChannel, req.body.notes, req.body.id];
                }

                db.run(query, values, function(err){
                    if (err) {
                        console.error(err.message);
                        res.status(500).json({ message: 'Error saving submission' });
                    } else {
                        res.json({
                            message: 'Submission received successfully',
                            success: this.changes > 0
                        });
                    }
                });
            }
        });
    } else {
        res.status(400).json({
            message: 'Message body is missing properties'
        });
    }
}

app.post('/api/approve', putApprove);
app.put('/api/approve', putApprove); // Preferred
app.put('/api/submissions/status', putApprove);
function putApprove(req, res) {
    if ("id" in req.body && "status" in req.body) {
        db.run('UPDATE submissions SET status=? WHERE id=?', [req.body.status, req.body.id],
            function(err) {
                if (err) {
                    console.error(err.message);
                    res.status(500).json({ message: 'Error updating submission' });
                } else {
                    res.json({
                        message: `Submission status updated to ${req.body.status}`,
                        success: this.changes > 0
                    });
                }
            });
    } else {
        res.status(400).json({
            message: 'Request needs "id" and "status" properties'
        });
    }
}

// app.get('/api/approve/stats', (req, res) => {
//     pool.query('COUNT(SELECT * FROM submissions WHERE status="Approved"');

// });

// ----------------------------------------------------------------

// Articles

const articleFields = ["id", "title", "category", "format", "value", "notes"];

app.get('/api/articles', (req, res) => {
    db.all("SELECT * FROM articles", [], (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({ message: 'Error reading articles' });
        } else {
            res.json(rows);
        }
    });
});

app.post("/api/articles", (req, res) => {
    if (req.body && verifyFields(req.body, articleFields)) {
       db.get('SELECT id FROM articles WHERE id = ?', [req.body.id], (err, result) => {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ message: 'Error saving article' });
            } 
                const idFound = (result.length > 0);

                let query, values;
                if (!idFound) {
                    query = 'INSERT INTO articles (id, title, category, format, value, notes) VALUES (?, ?, ?, ?, ?, ?)';
                    values = [req.body.id, req.body.title, req.body.category, req.body.format, req.body.value,
                    req.body.notes];
                } else {
                    query = `UPDATE articles SET title=?, category=?, format=?, value=?, notes=? WHERE id=?`;
                    values = [req.body.title, req.body.category, req.body.format, req.body.value,
                    req.body.notes, req.body.id];
                }

                db.run(query, values, function(err) {
                    if (err) {
                        console.error(err.message);
                        res.status(500).json({ message: 'Error saving article' });
                    } else {
                        res.json({
                            message: 'Article received successfully',
                            success: this.changes > 0
                        });
                    }
                });
            });
    } else {
        res.status(400).json({
            message: 'Message body is missing properties'
        });
    }
});

app.delete("/api/articles", async (req, res) => {
    if (req.body && "id" in req.body) {
        db.run(`DELETE FROM articles WHERE id=?`,
            [req.body.id],
            function(err) {
                if (err) {
                    console.error(err.message);
                    res.status(500).json("Server Error");
                } else {
                    res.json({
                        success: this.changes > 0
                    });
                }
            });
    } else {
        res.status(400).json({
            message: 'Message body is missing an "id" property'
        });
    }
});

// ----------------------------------------------------------------

// Publication Options

const pubOptionFields = ["id", "title", "pubDate", "distChannel", "reviewStatus", "author", "featured", "access", "editNotes"];
const pubOptionCols = ["id", "title", "pubDate", "webFeaturePreferred", "emailNewsletterPreferred", "subPortalPreferred", 
    "blogFeaturePreferred", "reviewStatus", "author", "featured", "access", "editNotes"];

app.get('/api/pubOptions', (req, res) => {
    db.all("SELECT * FROM publicationOptions", [], (err, rows) => {
        if (err) {
            console.log(err)
            res.status(500).json({ message: 'Error reading publication options' });
        } else {
            for (let row of rows) {
                row.distChannel = [];
                if (row.webFeaturePreferred) {
                    row.distChannel.push("Website");
                }
                if (row.emailNewsletterPreferred) {
                    row.distChannel.push("Email Newsletter");
                }
                if (row.subPortalPreferred) {
                    row.distChannel.push("Subscriber Portal");
                }
                if (row.blogFeaturePreferred) {
                    row.distChannel.push("Blog Feature");
                }
                delete row.webFeaturePreferred;
                delete row.emailNewsletterPreferred;
                delete row.subPortalPreferred;
                delete row.blogFeaturePreferred;
            }
            res.json(rows);
        }
    });
});

app.post("/api/pubOptions", (req, res) => {
    if (req.body && verifyFields(req.body, pubOptionFields, ["status"])) {
        const webFeaturePreferred = req.body.distChannel.includes("Website") ? 1 : 0;
        const emailNewsletterPreferred = req.body.distChannel.includes("Email Newsletter") ? 1 : 0;
        const subPortalPreferred = req.body.distChannel.includes("Subscriber Portal") ? 1 : 0;
        const blogFeaturePreferred = req.body.distChannel.includes("Blog Feature") ? 1 : 0;

        db.get('SELECT (id) FROM publicationOptions WHERE id = ?', [req.body.id], (err, result) => {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ message: 'Error saving publication option' });
            } else {
                const idFound = !!row;

                let query, values;
                if (!idFound) {
                    query = `INSERT INTO publicationOptions (${pubOptionCols.join(', ')}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                    values = [req.body.id, req.body.title, req.body.pubDate, webFeaturePreferred, 
                        emailNewsletterPreferred, subPortalPreferred, blogFeaturePreferred, req.body.reviewStatus, 
                        req.body.author, req.body.featured, req.body.access, req.body.editNotes];
                } else {
                    query = `UPDATE publicationOptions SET title=?, pubDate=?, webFeaturePreferred=?, 
                        emailNewsletterPreferred=?, subPortalPreferred=?, blogFeaturePreferred=?, reviewStatus=?,
                        author=?, featured=?, access=?, editNotes=? WHERE id=?`;
                    values = [req.body.title, req.body.pubDate, webFeaturePreferred, 
                        emailNewsletterPreferred, subPortalPreferred, blogFeaturePreferred, req.body.reviewStatus, 
                        req.body.author, req.body.featured, req.body.access, req.body.editNotes, req.body.id];
                }

                db.run(query, values, function(err) {
                    if (err) {
                        console.error(err.message);
                        res.status(500).json({ message: 'Error saving submission' });
                    } else {
                        res.json({
                            message: 'Submission received successfully',
                            success: this.changes > 0
                        });
                    }
                });
            }
        });
    } else {
        res.status(400).json({
            message: 'Message body is missing properties'
        });
    }
});

// ----------------------------------------------------------------

// Products

const productFields = ["id", "description", "category", "unit", "price", "weight", "color", "details"];

app.get('/api/products', (req, res) => {
    db.all("SELECT * FROM products", [], (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({ message: 'Error reading products' });
        } else {
            res.json(rows);
        }
    });
});

app.post("/api/products", (req, res) => {
    if (req.body && verifyFields(req.body, productFields)) {
        db.get('SELECT (id) FROM products WHERE id = ?', [req.body.id], (err, row) => {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ message: 'Error saving product' });
            } else {
                const idFound = !!row;

                let query, values;
                if (!idFound) {
                    query = 'INSERT INTO products(id, description, category, unit, price, weight, color, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
                    values = [req.body.id, req.body.description, req.body.category, req.body.unit, req.body.price,
                    req.body.weight, req.body.color, req.body.details];
                } else {
                    query = `UPDATE products SET description=?, category=?, unit=?, price=?, 
                        weight=?, color=?, details=? WHERE id=?`;
                    values = [req.body.description, req.body.category, req.body.unit, req.body.price,
                    req.body.weight, req.body.color, req.body.details, req.body.id];
                }

                db.run(query, values, function(err) {
                    if (err) {
                        console.error(err.message);
                        res.status(500).json({ message: 'Error saving product' });
                    } else {
                        res.json({
                            message: 'Product received successfully',
                            success: this.changes > 0
                        });
                    }
                });
            }
        });
    } else {
        res.status(400).json({
            message: 'Message body is missing properties'
        });
    }
});

app.delete("/api/products",  (req, res) => {
    if (req.body && "id" in req.body) {
        db.run(`DELETE FROM products WHERE id=?`, [req.body.id], (err, result) => {
            if (err) {
                console.error(err.message);
                res.status(500).json("Server Error");
            } else {
                res.json({
                    success: this.changes > 0
                });
            }
        });
    } else {
        res.status(400).json({
            message: 'Message body is missing an "id" property'
        });
    }
});

// ----------------------------------------------------------------

// Cart

// Given a session ID, get a list of items in cart, as product objects
app.get('/api/cart', (req, res) => {
    if (req.query && "sessionId" in req.query) {
        const query = `SELECT p.id, p.description, p.category, p.unit, p.price, p.weight, p.color, p.details, i.quantity
            FROM carts AS c 
            LEFT JOIN cartItems AS i ON c.cartId = i.cartId
            INNER JOIN products AS p ON i.productId = p.id
            WHERE c.sessionId = ?`;
        
        db.all(query, [req.query.sessionId], (err, rows) => {
            if (err) {
                console.error(err.message);
                res.status(500).json("Server Error");
            } else {
                res.json(rows);
            }
        });
    } else {
        res.status(400).json({ message: 'Need to provide a "sessionId" query parameter.' });
    }
});

// Add item to cart
// Add item: POST /api/cart?sessionId=id&productId=id
// Modify quantity: POST /api/cart?sessionId=id&productId=id&quantity=3
app.post('/api/cart', (req, finalResult) => {
    const { sessionId, productId, quantity: queryQty } = req.query;

    if (sessionId && productId) {

        db.get(`SELECT cartId FROM carts WHERE sessionId = ?`, [sessionId], (err, cartRow) => {
            if (err) {
                console.error(err.message);
                return finalResult.status(500).json("Server Error");
            }
                // Case 1: Cart doesn't exist
                if (!cartRow) {
                let cartId = Date.now().toString(16) + crypto.randomBytes(4).toString('hex');
                
                db.run(`INSERT INTO carts (cartId, sessionId) VALUES (?, ?)`, [cartId, sessionId], function(err) {
                    if (err) {
                        console.error(err.message);
                        return finalResult.status(500).json("Server Error");
                    }
                    
                    const qty = queryQty ? parseInt(queryQty) : 1;
                    db.run(`INSERT INTO cartItems (cartId, productId, quantity) VALUES (?, ?, ?)`, [cartId, productId, qty], function(err) {
                        if (err) {
                            console.error(err.message);
                            return finalResult.status(500).json("Server Error");
                        }
                        finalResult.json({ success: this.changes > 0 });
                    });
                });
            } else {
               const cartId = cartRow.cartId;
                db.get('SELECT quantity FROM cartItems WHERE cartId = ? AND productId = ?', [cartId, productId], (err, itemRow) => {
                    if (err) {
                        console.error(err.message);
                        return finalResult.status(500).json("Server Error");
                    }

                    if (!itemRow) {
                       const qty = queryQty ? parseInt(queryQty) : 1;
                        db.run(`INSERT INTO cartItems (cartId, productId, quantity) VALUES (?, ?, ?)`, [cartId, productId, qty], function(err) {
                            if (err) {
                                console.error(err.message);
                                return finalResult.status(500).json("Server Error");
                            }
                            finalResult.json({ success: this.changes > 0 });
                        });
                    } else {

                        const newQty = queryQty ? parseInt(queryQty) : (itemRow.quantity || 0) + 1;
                        db.run(`UPDATE cartItems SET quantity = ? WHERE cartId = ? AND productId = ?`, [newQty, cartId, productId], function(err) {
                            if (err) {
                                console.error(err.message);
                                return finalResult.status(500).json("Server Error");
                            }
                            finalResult.json({ success: this.changes > 0 });
                        });
                    }
                });
            }
        });
    } else {
        finalResult.status(400).json({ message: 'Need to provide "sessionId" and "productId" query parameters' });
    }
});



app.delete("/api/cart", (req, res) => {
    if (req.query && "sessionId" in req.query) {
        // SQLite: Joins aren't allowed in DELETE. We use a subquery instead.
        let query = `DELETE FROM cartItems WHERE cartId IN (SELECT cartId FROM carts WHERE sessionId = ?)`;
        let values = [req.query.sessionId];

        if ("productId" in req.query) {
            query += " AND productId = ?";
            values.push(req.query.productId);
        }

        db.run(query, values, function(err) {
            if (err) {
                console.error(err.message);
                res.status(500).json("Server Error");
            } else {
                res.json({ success: this.changes > 0 });
            }
        });
    } else {
        res.status(400).json({ message: 'Need to provide "sessionId" query parameter' });
    }
});
function getProduct(sessionId, productId, newQuantity, callback) {
    const query = `SELECT cartId, quantity FROM carts WHERE sessionId = ?`;
    db.get(query, [sessionId], (err, row) => {
        callback(row, productId, newQuantity);
    });
}

function insertProduct(cartId, productId, quantity, callback) {
    const query = `INSERT INTO cartItems (cartId, productId, quantity) VALUES (?, ?, ?)`;
    db.run(query, [cartId, productId, quantity], function(err) {
        callback(this);
    });
}

function updateProductQuantity(cartId, productId, newQuantity, callback) {
    const query = `UPDATE cartItems SET quantity = ? WHERE cartId = ? AND productId = ?`;
    db.run(query, [newQuantity, cartId, productId], function(err) {
        callback(this);
    });
}

// ----------------------------------------------------------------

// Purchases

// const purchaseCols = ["purchaseId", "productId", "quantity", "description",
//     "category", "unit", "price", "weight", "color", "details"];
const cartItemCols = ["id", "description", "category", "unit", "price", "weight", "color", "details", "quantity"];

app.get("/api/purchase/items", (req, finalRes) => {
    if (req.query && "sessionId" in req.query) {
        const query = `SELECT i.productId, i.quantity, i.description, i.category, i.unit, i.price, i.weight, i.color, i.details 
            FROM purchases AS p INNER JOIN purchasedItems AS i
            ON p.purchaseId = i.purchaseId
            WHERE p.sessionId = ?`;
        
        db.all(query, [req.query.sessionId], (err, rows) => {
            if (err) {
                console.error(err.message);
                finalRes.status(500).json("Server Error");
            } else {
                finalRes.json(rows);
            }
        });
    }
});

// Post purchase - get purchaseId back
app.post("/api/purchase", (req, finalRes) => {
    if (req.body && "sessionId" in req.body) {
        let purchaseId = Date.now().toString(16) + crypto.randomBytes(8).toString('hex');
const cartQuery = `SELECT p.id, p.description, p.category, p.unit, p.price, p.weight, p.color, p.details, i.quantity
            FROM carts AS c 
            INNER JOIN cartItems AS i ON c.cartId = i.cartId
            INNER JOIN products AS p ON i.productId = p.id
            WHERE c.sessionId = ?`;

        db.all(cartQuery, [req.body.sessionId], (err, cartItems) => {
            if (err) {
                console.error(err.message);
                return finalRes.status(500).json("Server Error");
            }

            if (cartItems.length === 0) {
                return finalRes.status(400).json("No items in cart");
            }
db.run('INSERT INTO purchases (purchaseId, sessionId) VALUES (?, ?)', 
                [purchaseId, req.body.sessionId], function(err) {
                if (err) {
                    console.error(err.message);
                    return finalRes.status(500).json("Server Error");
                }
let errorOccurred = false;
                const itemInsertQuery = `INSERT INTO purchasedItems 
                    (purchaseId, productId, quantity, description, category, unit, price, weight, color, details) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

                cartItems.forEach((item) => {
                    if (verifyFields(item, cartItemCols)) {
                        db.run(itemInsertQuery, [
                            purchaseId, item.id, item.quantity, item.description, item.category, 
                            item.unit, item.price, item.weight, item.color, item.details
                        ], (err) => {
                            if (err) {
                                console.error("Item Insert Error:", err.message);
                                errorOccurred = true;
                            }
                        });
                    }
                });
finalRes.json({
                    purchaseId: purchaseId, 
                    success: !errorOccurred
                });
            });
        });
    } else {
        finalRes.status(400).json({ message: 'Message body is missing properties' });
    }
});

// ----------------------------------------------------------------

// Billing Info

const billingFields = ["purchaseId", "fullName", "address", "city", "state", "zip", "creditCardNum", "expDate", "secCode", "shippingDetails"];

app.post("/api/billing", (req, res) => {
    if (req.body && verifyFields(req.body, billingFields)) {
        const billingId = Date.now().toString(16) + crypto.randomBytes(4).toString('hex');
        
        const query = `INSERT INTO billingInfo (billingId, purchaseId, name, address, city, state, zipCode, creditCardNum, expirationDate, securityCode, shippingDetails) 
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        const values = [
            billingId, req.body.purchaseId, req.body.fullName, req.body.address, req.body.city, 
            req.body.state, req.body.zip, req.body.creditCardNum, req.body.expDate, 
            req.body.secCode, req.body.shippingDetails
        ];

        db.run(query, values, function(err) {
            if (err) {
                console.error(err.message);
                return res.status(500).json("Server Error");
            }
if (req.body.sessionId) {
                const deleteQuery = `DELETE FROM cartItems WHERE cartId IN (SELECT cartId FROM carts WHERE sessionId = ?)`;
                db.run(deleteQuery, [req.body.sessionId], (err) => {
                    if (err) console.error("Cart cleanup error:", err.message);
                });
            }

            res.json({ billingId, success: true });
        });
    } else {
        res.status(400).json({ message: 'Message body is missing properties' });
    }
});
const returnFields = ["sessionId", "productDesc", "price", "reason", "condition", "notes"];

app.post("/api/returns", (req, res) => {
    const { id, productDesc, price, reason, itemCondition, notes, status, sessionId } = req.body;
const sql = `INSERT INTO returns (id, productDesc, price, reason, itemCondition, notes, status, sessionId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [id, productDesc, price, reason, itemCondition, notes, status, sessionId], function(err) {
       if (err) {
        console.error("Database Error:", err.message);
        return res.status(500).json({ error: err.message})
    }
res.json({ id, success: true });
});
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// TODO: close pool
// https://stackoverflow.com/questions/14515954/how-to-properly-close-node-js-express-server