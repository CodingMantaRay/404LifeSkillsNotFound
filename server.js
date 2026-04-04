const path = require('path');
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const router = express.Router();
const mysql = require("mysql");

// https://stackoverflow.com/questions/50093144
const pool = mysql.createPool(
    JSON.parse(fs.readFileSync("database.json", 'utf8') || [])
); 

app.use(cors());
app.use(express.static("public")); // Serve static files from the "public" directory
app.use(express.json());

const PORT = 3000;



// Post - Create
// Get - Retrieve
// Put - Update
// Delete - Delete

function verifyFields(item, fields, exclude=[]) {
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

function verifySubscriber(subscriber, exclude=[]) {
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
const statusOptions = ["Pending", "Approved", "Rejected", "Revisions Requested"];
const distOptions = ["Website Feature", "Email Newsletter", "Subscriber Portal", "Blog Feature"];

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



// ----------------------------------------------------------------

app.listen(PORT, () => {
     console.log(`Server running on http://localhost:${PORT}`);
     console.log(`Access site at http://localhost:${PORT}/index.html`);
});

// TODO: close pool
// https://stackoverflow.com/questions/14515954/how-to-properly-close-node-js-express-server