const path = require('path');
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.static(path.join(__dirname, '../'))); // Serve static files from the root directory
app.use(express.json());

const PORT = 3000;
const DATABASE_FILE = './data/submissions.json';

// Load existing submissions from file

if (!fs.existsSync('./data')) fs.mkdirSync('./data');
if (!fs.existsSync(DATABASE_FILE)) fs.writeFileSync(DATABASE_FILE, JSON.stringify([]));

app.post('/api/submit', (req, res) => {
    const newArticle = req.body;
    console.log('Received new submission:', newArticle.title);

    fs.readFile(DATABASE_FILE, 'utf8', (err, data) => {
        const submissions = JSON.parse(data || '[]');
        submissions.push(newArticle);

        fs.writeFile(DATABASE_FILE, JSON.stringify(submissions, null, 2), (err) => {
            if (err) return res.status(500).json({ message: 'Error saving submission' });
            res.status(200).json({ message: 'Submission received successfully' });

        });
    });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));