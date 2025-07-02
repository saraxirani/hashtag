const request = require('request');
const fs = require('fs').promises;
const path = require('path');

// List of countries and their Where On Earth IDs (WOEIDs)
const countries = [
    { name: 'Iran' },
    { name: 'Egypt' }
];


const API_URL = 'https://twitter-api45.p.rapidapi.com/trends.php';
const RAPIDAPI_HOST = 'twitter-api45.p.rapidapi.com';

/**
 * Fetches Twitter trends for a specific country using the 'request' library.
 * @param {string} countryName The name of the country.
 * @returns {Promise<string[]|null>} A promise that resolves with an array of trend names, or null if an error occurs.
 */
function getTrends(countryName) {
    const options = {
        method: 'GET',
        url: API_URL,
        qs: { country: countryName },
        headers: {
            'x-rapidapi-key': '35fa66de07mshf9e587512f59407p1c744fjsn63783337fdf2',
            'x-rapidapi-host': RAPIDAPI_HOST,
        },
        timeout: 15000 // Add a 15-second timeout
    };

    return new Promise((resolve) => {
        console.log(` > Sending request for ${countryName}...`); // Added for debugging
        request(options, function (error, response, body) {
            if (error) {
                if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
                    console.error(`   Error: Request for ${countryName} timed out.`);
                } else {
                    console.error(`   Error: Failed to fetch trends for ${countryName}:`, error.message);
                }
                return resolve(null); // Resolve with null to allow the loop to continue
            }

            try {
                const data = JSON.parse(body);
                // The API returns an object with a 'trends' property, which is an array.
                if (data && Array.isArray(data.trends)) {
                    // Filter out any items that don't have a 'name' property
                    const trends = data.trends.map(trend => trend.name).filter(Boolean);
                    resolve(trends);
                } else if (data && data.message) { // Handle explicit API error messages
                    console.error(`   API error for ${countryName}: ${data.message}`);
                    resolve(null);
                }
                else {
                    console.warn(`   Warning: No trends found or unexpected format for ${countryName}. Body: ${body}`);
                    resolve([]);
                }
            } catch (parseError) {
                console.error(`   Error: Error parsing JSON for ${countryName}:`, parseError.message);
                console.error(`   Raw body received: ${body}`);
                resolve(null); // Resolve with null if parsing fails
            }
        });
    });
}

/**
 * The main function to orchestrate fetching trends and writing them to files.
 */
async function main() {
    console.log('Starting script to fetch Twitter trends...');
    console.log('Processing countries in the following order:', countries.map(c => c.name));

    for (const country of countries) {
        console.log(`\nFetching trends for ${country.name}...`);
        const trends = await getTrends(country.name);

        if (trends) {
            // Sanitize the country name to create a valid filename.
            const fileName = `${country.name.replace(/[\s/]/g, '_')}.txt`;
            const filePath = path.join(__dirname, fileName);
            const fileContent = trends.join('\n');

            try {
                // Write the trends to the corresponding text file.
                await fs.writeFile(filePath, fileContent, 'utf8');
                console.log(`Successfully wrote ${trends.length} trends to ${fileName}`);
            } catch (writeError) {
                console.error(`Error writing file for ${country.name}:`, writeError.message);
            }
        } else {
            console.log(`Skipping file creation for ${country.name} due to a fetch error.`);
        }
    }

    console.log('\nScript finished.');
}

// Run the main function
main();
