const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const unzipper = require('unzipper');
const kaggleCredentials = require('./kaggle.json');

const app = express();
const port = 3000;

// Proxy endpoint to fetch and parse Kaggle dataset
app.get('/api/dataset', async (req, res) => {
  try {
    const dataset = 'fedesoriano/air-quality-data-set'; // Kaggle dataset name
    const url = `https://www.kaggle.com/api/v1/datasets/download/${dataset}`;

    // Download the dataset (ZIP file)
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${kaggleCredentials.key}` },
      responseType: 'arraybuffer', // Binary data
    });

    // Save the ZIP file locally
    const zipFilePath = path.join(__dirname, 'temp', 'air_quality_dataset.zip');
    fs.writeFileSync(zipFilePath, response.data);
    console.log(`Dataset saved to ${zipFilePath}`);

    // Extract the ZIP file
    const extractedPath = path.join(__dirname, 'temp');
    fs.createReadStream(zipFilePath)
      .pipe(unzipper.Extract({ path: extractedPath }))
      .on('close', () => {
        console.log('ZIP file extracted');

        // Find the CSV file inside the extracted folder (assuming it's the only CSV file)
        const csvFilePath = path.join(extractedPath, 'AirQuality.csv'); // Adjust this based on actual filename

        // Parse CSV with ';' as the separator
        const results = [];
        fs.createReadStream(csvFilePath)
          .pipe(csv({ separator: ';' }))  // Correct separator for the CSV
          .on('data', (data) => {
            // Convert commas to dots for decimal values and remove empty columns
            const cleanedData = {};
            for (const key in data) {
              if (data.hasOwnProperty(key) && key !== '') { // Remove empty columns
                // Clean numeric fields
                if (data[key] && !isNaN(data[key].replace(',', '.'))) {
                  cleanedData[key] = parseFloat(data[key].replace(',', '.'));
                } else {
                  cleanedData[key] = data[key];
                }
              }
            }
            results.push(cleanedData);
          })
          .on('end', () => {
            console.log('Dataset parsed successfully.');
            res.json(results); // Send JSON data
          })
          .on('error', (error) => {
            console.error('Error parsing CSV:', error);
            res.status(500).send('Error parsing CSV file');
          });
      })
      .on('error', (error) => {
        console.error('Error extracting ZIP file:', error);
        res.status(500).send('Error extracting ZIP file');
      });
  } catch (error) {
    console.error('Error fetching dataset:', error.message);
    res.status(500).send('Error fetching dataset');
  }
});

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
