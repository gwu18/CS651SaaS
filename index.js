const express = require('express');
const multer = require('multer');
const vision = require('@google-cloud/vision');

const app = express();

// Pro-Tip: Use memoryStorage for App Engine so you don't write to a read-only disk
const upload = multer({ storage: multer.memoryStorage() }); 

// Initialize the Google Cloud Vision Client
const client = new vision.ImageAnnotatorClient();

// Serve static files from the "public" directory (your index.html)
app.use(express.static('public'));

// Handle the POST request from the form
app.post('/upload', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file was uploaded.');
    }

    try {
        // Pass the file buffer directly to the Vision API
        const [result] = await client.labelDetection(req.file.buffer);
        const labels = result.labelAnnotations;

        // Construct a well-formatted HTML response
        let htmlResponse = `
            <html>
            <head><title>Analysis Results</title></head>
            <body style="font-family: Arial, sans-serif; margin: 40px;">
                <h2>Image Analysis Complete</h2>
                <p>Google Cloud Vision detected the following labels:</p>
                <ul>
        `;

        labels.forEach(label => {
            const confidence = (label.score * 100).toFixed(2);
            htmlResponse += `<li><strong>${label.description}</strong> (Confidence: ${confidence}%)</li>`;
        });

        htmlResponse += `
                </ul>
                <br>
                <a href="/">Upload Another Image</a>
            </body>
            </html>
        `;

        // Send the HTML back to the browser
        res.send(htmlResponse);

    } catch (error) {
        console.error('Error analyzing image:', error);
        res.status(500).send('An error occurred while analyzing the image.');
    }
});

// Start the server (App Engine defaults to port 8080)
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
