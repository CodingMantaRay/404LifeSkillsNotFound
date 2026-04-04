const path = require('path');
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const router = express.Router();
const mysql = require("mysql");
const crypto = require("crypto");

// https://stackoverflow.com/questions/50093144
const pool = mysql.createPool(
    JSON.parse(fs.readFileSync("database.json", 'utf8') || [])
);

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
const subscriberFields = ["name", "email", "phone", "ageOrYear", "address", "id"];

function verifySubscriber(subscriber, exclude = []) {
    return verifyFields(subscriber, subscriberFields, exclude);
}

app.get("/api/subscribers", async (req, res) => {
    pool.query("SELECT * FROM " + subscriberTable, (err, rows) => {
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

app.post("/api/subscribers", async (req, res) => {
    if (req.body && verifySubscriber(req.body, ["id"])) {
        pool.query(`INSERT INTO ${subscriberTable} (name, email, phone, age, address) VALUES (?, ?, ?, ?, ?)`,
            [req.body.name, req.body.email, req.body.phone, req.body.ageOrYear, req.body.address],
            (err, result) => {
                if (err) {
                    console.log(err);
                    res.status(500).json("Server Error");
                } else {
                    res.json({
                        success: result.affectedRows > 0
                    });
                }
            });
    } else {
        res.status(400).json({
            message: 'Message body is missing properties'
        });
    }
});

app.put("/api/subscribers", async (req, res) => {
    if (req.body && verifySubscriber(req.body)) {
        pool.query(`UPDATE ${subscriberTable} SET name=?, email=?, phone=?, age=?, address=? WHERE id=?`,
            [req.body.name, req.body.email, req.body.phone, req.body.ageOrYear, req.body.address, req.body.id],
            (err, result) => {
                if (err) {
                    console.log(err);
                    res.status(500).json("Server Error");
                } else {
                    res.json({
                        success: result.affectedRows > 0
                    });
                }
            });
    } else {
        res.status(400).json({
            message: 'Message body is missing properties'
        });
    }
});

app.delete("/api/subscribers", async (req, res) => {
    if (req.body && "id" in req.body) {
        pool.query(`DELETE FROM ${subscriberTable} WHERE id=?`,
            [req.body.id],
            (err, result) => {
                if (err) {
                    console.log(err);
                    res.status(500).json("Server Error");
                } else {
                    res.json({
                        success: result.affectedRows > 0
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

const submissionFields = ["id", "title", "author", "category", "contentSnippet", "preferredDistChannel", "notes", "status"];
// const statusOptions = ["Pending", "Approved", "Rejected", "Revisions Requested"];
// const distOptions = ["Website Feature", "Email Newsletter", "Subscriber Portal", "Blog Feature"];

app.get('/api/submissions', (req, res) => {
    pool.query("SELECT * FROM submissions", (err, rows) => {
        if (err) {
            console.log(err)
            res.status(500).json({ message: 'Error reading submissions' });
        } else {
            for (let row of rows) {
                row.preferredDistChannel = [];
                if (row.webFeaturePreferred) {
                    row.preferredDistChannel.push("Website Feature");
                }
                if (row.emailNewsletterPreferred) {
                    row.preferredDistChannel.push("Email Newsletter");
                }
                if (row.subPortalPreferred) {
                    row.preferredDistChannel.push("Subscriber Portal");
                }
                if (row.blogFeaturePreferred) {
                    row.preferredDistChannel.push("Blog Feature");
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

app.post("/api/submissions", postSubmission);
app.post('/api/submit', postSubmission);

function postSubmission(req, res) {
    if (req.body && verifyFields(req.body, submissionFields, ["status"])) {
        const webFeaturePreferred = req.body.preferredDistChannel.includes("Website Feature") ? 1 : 0;
        const emailNewsletterPreferred = req.body.preferredDistChannel.includes("Email Newsletter") ? 1 : 0;
        const subPortalPreferred = req.body.preferredDistChannel.includes("Subscriber Portal") ? 1 : 0;
        const blogFeaturePreferred = req.body.preferredDistChannel.includes("Blog Feature") ? 1 : 0;

        pool.query('SELECT (id) FROM submissions WHERE id = ?', [req.body.id], (err, result) => {
            if (err) {
                console.log(err);
            } else {
                const idFound = (result.length > 0);

                let query, values;
                if (!idFound) {
                    query = 'INSERT INTO submissions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
                    values = [req.body.id, req.body.title, req.body.author, req.body.category, req.body.contentSnippet,
                        webFeaturePreferred, emailNewsletterPreferred, subPortalPreferred, blogFeaturePreferred,
                    req.body.notes, "Pending"];
                } else {
                    query = `UPDATE submissions SET title=?, author=?, category=?, contentSnippet=?, webFeaturePreferred=?, 
                        emailNewsletterPreferred=?, subPortalPreferred=?, blogFeaturePreferred=?, notes=? WHERE id=?`;
                    values = [req.body.title, req.body.author, req.body.category, req.body.contentSnippet,
                        webFeaturePreferred, emailNewsletterPreferred, subPortalPreferred, blogFeaturePreferred,
                    req.body.notes, req.body.id];
                }

                pool.query(query, values, (err, result) => {
                    if (err) {
                        console.log(err);
                        res.status(500).json({ message: 'Error saving submission' });
                    } else {
                        res.json({
                            message: 'Submission received successfully',
                            success: result.affectedRows > 0
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

function putApprove(req, res) {
    if ("id" in req.body && "status" in req.body) {
        pool.query('UPDATE submissions SET status=? WHERE id=?', [req.body.status, req.body.id],
            (err, result) => {
                if (err) {
                    console.log(err);
                    res.status(500).json({ message: 'Error updating submission' });
                } else {
                    res.json({
                        message: `Submission status updated to ${req.body.status}`,
                        success: result.affectedRows > 0
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
    pool.query("SELECT * FROM articles", (err, rows) => {
        if (err) {
            console.log(err)
            res.status(500).json({ message: 'Error reading articles' });
        } else {
            res.json(rows);
        }
    });
});

app.post("/api/articles", (req, res) => {
    if (req.body && verifyFields(req.body, articleFields)) {
        pool.query('SELECT (id) FROM articles WHERE id = ?', [req.body.id], (err, result) => {
            if (err) {
                console.log(err);
            } else {
                const idFound = (result.length > 0);

                let query, values;
                if (!idFound) {
                    query = 'INSERT INTO articles VALUES (?, ?, ?, ?, ?, ?)';
                    values = [req.body.id, req.body.title, req.body.category, req.body.format, req.body.value,
                    req.body.notes];
                } else {
                    query = `UPDATE articles SET title=?, category=?, format=?, value=?, notes=? WHERE id=?`;
                    values = [req.body.title, req.body.category, req.body.format, req.body.value,
                    req.body.notes, req.body.id];
                }

                pool.query(query, values, (err, result) => {
                    if (err) {
                        console.log(err);
                        res.status(500).json({ message: 'Error saving article' });
                    } else {
                        res.json({
                            message: 'Article received successfully',
                            success: result.affectedRows > 0
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

app.delete("/api/articles", async (req, res) => {
    if (req.body && "id" in req.body) {
        pool.query(`DELETE FROM articles WHERE id=?`,
            [req.body.id],
            (err, result) => {
                if (err) {
                    console.log(err);
                    res.status(500).json("Server Error");
                } else {
                    res.json({
                        success: result.affectedRows > 0
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

// Products

const productFields = ["id", "description", "category", "unit", "price", "weight", "color", "details"];

app.get('/api/products', (req, res) => {
    pool.query("SELECT * FROM products", (err, rows) => {
        if (err) {
            console.log(err)
            res.status(500).json({ message: 'Error reading products' });
        } else {
            res.json(rows);
        }
    });
});

app.post("/api/products", (req, res) => {
    if (req.body && verifyFields(req.body, productFields)) {
        pool.query('SELECT (id) FROM products WHERE id = ?', [req.body.id], (err, result) => {
            if (err) {
                console.log(err);
            } else {
                const idFound = (result.length > 0);

                let query, values;
                if (!idFound) {
                    query = 'INSERT INTO products VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
                    values = [req.body.id, req.body.description, req.body.category, req.body.unit, req.body.price,
                    req.body.weight, req.body.color, req.body.details];
                } else {
                    query = `UPDATE products SET description=?, category=?, unit=?, price=?, 
                        weight=?, color=?, details=? WHERE id=?`;
                    values = [req.body.description, req.body.category, req.body.unit, req.body.price,
                    req.body.weight, req.body.color, req.body.details, req.body.id];
                }

                pool.query(query, values, (err, result) => {
                    if (err) {
                        console.log(err);
                        res.status(500).json({ message: 'Error saving product' });
                    } else {
                        res.json({
                            message: 'Product received successfully',
                            success: result.affectedRows > 0
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

app.delete("/api/products", async (req, res) => {
    if (req.body && "id" in req.body) {
        pool.query(`DELETE FROM products WHERE id=?`,
            [req.body.id],
            (err, result) => {
                if (err) {
                    console.log(err);
                    res.status(500).json("Server Error");
                } else {
                    res.json({
                        success: result.affectedRows > 0
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
        const query = `SELECT id, description, category, unit, price, weight, color, details, quantity
            FROM carts AS c LEFT JOIN cartItems AS i
            ON  c.cartId = i.cartId
            INNER JOIN products AS p
            ON i.productId = p.id
            WHERE c.sessionId = ?`;
        const values = [req.query.sessionId];
        pool.query(query, values, (err, result) => {
            if (err) {
                console.log(err);
                res.status(500).json("Server Error");
            } else {
                res.json(result);
            }
        });
    } else {
        res.status(400).json({
            message: 'Need to provide a "sessionId" query parameter.'
        });
    }
});

// Add item to cart
// Add item: POST /api/cart?sessionId=id&productId=id
// Modify quantity: POST /api/cart?sessionId=id&productId=id&quantity=3
app.post('/api/cart', (req, finalResult) => {
    if (req.query && "sessionId" in req.query && "productId" in req.query && req.query.sessionId && req.query.productId) {
        let query = `SELECT cartId FROM carts WHERE sessionId = ?`;
        let values = [req.query.sessionId, req.query.productId];
        pool.query(query, values, (err, res) => {
            if (err) {
                console.log(err);
                finalResult.status(500).json("Server Error");
            } else {
                // Case 1: Cart doesn't exist
                if (res.length == 0) {
                    // Create new cart ID
                    let cartId = Date.now().toString(16);
                    cartId += crypto.randomBytes(4).toString('hex'); // 4 bytes = 8 chars in hex

                    // Create cart
                    query = `INSERT INTO carts VALUES (?, ?)`;
                    values = [cartId, req.query.sessionId];
                    pool.query(query, values, (err, res) => {
                        if (err) {
                            console.log(err);
                            finalResult.status(500).json("Server Error");
                        } else {
                            // Create cart item
                            query = `INSERT INTO cartItems VALUES (?, ?, ?)`;
                            values = [cartId, req.query.productId, "quantity" in req.query ? req.query.quantity : 1];
                            pool.query(query, values, (err, res) => {
                                if (err) {
                                    console.log(err);
                                    finalResult.status(500).json("Server Error");
                                } else {
                                    finalResult.json({
                                        success: res.affectedRows > 0
                                    });
                                }
                            });
                        }
                    });
                } else {
                    const row = res[0];
                    if ("cartId" in row && row.cartId) {
                        query = 'SELECT quantity FROM cartItems WHERE cartId = ? AND productId = ?';
                        values = [row.cartId, req.query.productId];
                        pool.query(query, values, (err, res) => {
                            if (err) {
                                console.log(err);
                                finalResult.status(500).json("Server Error");
                            } else {
                                // Case 2: Cart exists, but product doesn't
                                if (res.length == 0) {
                                    query = `INSERT INTO cartItems VALUES (?, ?, ?)`;
                                    values = [row.cartId, req.query.productId, "quantity" in req.query ? req.query.quantity : 1];
                                    pool.query(query, values, (err, res) => {
                                        if (err) {
                                            console.log(err);
                                            finalResult.status(500).json("Server Error");
                                        } else {
                                            finalResult.json({
                                                success: res.affectedRows > 0
                                            });
                                        }
                                    });
                                }
                                // Case 3: Cart and product exist, need to modify quantity
                                else {
                                    let quantity;
                                    if ("quantity" in req.query) {
                                        quantity = req.query.quantity;
                                    } else {
                                        quantity = (res[0].quantity || 0) + 1;
                                    }
                                    query = `UPDATE cartItems SET quantity = ? WHERE cartId = ? AND productId = ?`;
                                    values = [quantity, row.cartId, req.query.productId];
                                    pool.query(query, values, (err, res) => {
                                        if (err) {
                                            console.log(err);
                                            finalResult.status(500).json("Server Error");
                                        } else {
                                            finalResult.json({
                                                success: res.affectedRows > 0
                                            });
                                        }
                                    });
                                }
                            }
                        });
                    }
                }
            }
        });
    } else {
        finalResult.status(400).json({
            message: 'Need to provide "sessionId" and "productId" query parameters'
        });
    }
});

app.delete("/api/cart", async (req, res) => {
    if (req.query && "sessionId" in req.query) {
        let query = "DELETE i FROM carts AS c INNER JOIN cartItems AS i ON c.cartId = i.cartId WHERE sessionId = ?";
        let values = [req.query.sessionId];
        if ("productId" in req.query) {
            query += " AND productId = ?";
            values.push(req.query.productId);
        }
        pool.query(query, values, (err, result) => {
            if (err) {
                console.log(err);
                res.status(500).json("Server Error");
            } else {
                res.json({
                    success: result.affectedRows > 0
                });
            }
        });
    } else {
        res.status(400).json({
            message: 'Need to provide "sessionId" and "productId" query parameters'
        });
    }
});

/**
 * Given the session ID and product ID, 
 * gets the cart ID, product ID, and quantity from the database.
 * @param {*} sessionId 
 * @param {*} productId - for query, also passed onto callback
 * @param {*} newQuantity - integer or null, to be passed onto callback
 * @param {*} callback - function that takes 3 parameters: query result, 
 *      product ID, and new quantity
 */
function getProduct(sessionId, productId, newQuantity, callback) {

}

/**
 * Given a cart ID, creates a new cart item with the given product ID and quantity.
 * @param {*} cartId 
 * @param {*} productId 
 * @param {*} quantity - integer or null
 * @param {*} callback - function that takes query result as only param
 */
function insertProduct(cartId, productId, quantity, callback) {

}

/**
 * Given a cart ID and product ID, modify its quantity.
 * @param {*} cartId 
 * @param {*} productId 
 * @param {*} newQuantity 
 * @param {*} callback - function that takes query result as only param
 */
function updateProductQuantity(cartId, productId, newQuantity, callback) {

}


// ----------------------------------------------------------------

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Access site at http://localhost:${PORT}/index.html`);
});

// TODO: close pool
// https://stackoverflow.com/questions/14515954/how-to-properly-close-node-js-express-server