const path = require('path');
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.static("public")); // Serve static files from the "public" directory
app.use(express.json());

const PORT = 3000;
const DATABASE_FILE = 'data/submissions.json';

// Load existing submissions from file

if (!fs.existsSync("data")) {
    fs.mkdirSync("data");
}
if (!fs.existsSync(DATABASE_FILE)) {
    fs.writeFileSync(DATABASE_FILE, JSON.stringify([]));
}

app.get('/api/submissions', (req, res) => {
    fs.readFile(DATABASE_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ message: 'Error reading submissions' });
        const submissions = JSON.parse(data || '[]');
        res.status(200).json(submissions);
    });
});

app.post('/api/submit', (req, res) => {
    const newArticle = req.body;
   

    fs.readFile(DATABASE_FILE, 'utf8', (err, data) => {
        let submissions = JSON.parse(data || '[]');
        const existingIndex = submissions.findIndex(item => item.id === newArticle.id);
       if (existingIndex !== -1) {
            submissions[existingIndex] = newArticle; // Update existing article
            console.log('Updated existing submissions.', newArticle.id);
        } else {
       submissions.push(newArticle);
       console.log('Added new submission.', newArticle.id);
        }

        fs.writeFile(DATABASE_FILE, JSON.stringify(submissions, null, 2), (err) => {
            if (err) return res.status(500).json({ message: 'Error saving submission' });
            res.status(200).json({ message: 'Submission received successfully' });

        });
    });
});

app.post('/api/approve', (req, res) => {
    const targetId = req.body.id;
    const newStatus = req.body.status;
    console.log('Approving submission with ID:', targetId);

    fs.readFile(DATABASE_FILE, 'utf8', (err, data) => {
        if(err) return res.status(500).json({ message: 'Error reading submissions' });
        let submissions = JSON.parse(data || '[]');
        console.log('Found submissions:', submissions.length);

        const updatedSubmissions = submissions.map(item => {
            if (item.id === targetId) {
                return { ...item, status: newStatus };
                
            }
            return item;
        });

        fs.writeFile(DATABASE_FILE, JSON.stringify(updatedSubmissions, null, 2), (err) => {
            if (err) return res.status(500).json({ message: 'Error updating submission' });
           res.json({ message: `Submission status updated to ${newStatus}` });
        });
    });
});

app.listen(PORT, () => {
     console.log(`Server running on http://localhost:${PORT}`);
     console.log(`Access site at http://localhost:${PORT}/index.html`);
});