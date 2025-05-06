import config from './config.js';  // Import config for URLs

const LOCAL_STORAGE_KEY = 'validPages'; // Centralize local storage key

// Function to fetch CSV data and parse it
export async function fetchCSVData(url) {
    try {
        const response = await fetch(url);
        const csvText = await response.text();
        return Papa.parse(csvText, { header: true, skipEmptyLines: true }).data;
    } catch (error) {
        console.error("Error fetching CSV data:", error);
        return [];
    }
}

// Filter out the most recent version of each webpage based on 'Informazioni cronologiche'
export function filterMostRecentPages(data) {
    const idMap = new Map();
    data.forEach(row => {
        const id = row.ID;
        const title = row.title;
        const timestamp = row["Informazioni cronologiche"];
        if (!id || !title || !timestamp) return;
        if (!idMap.has(id) || isNewer(timestamp, idMap.get(id).timestamp)) {
            idMap.set(id, { ...row, title, id, timestamp });
        }
    });
    return Array.from(idMap.values());
}

// Filter out pages that are in the deletedTable
export function filterDeletedPages(pages, deletedData) {
    const deletedIds = new Set(deletedData.map(row => row.ID));
    return pages.filter(page => !deletedIds.has(page.id));
}

// Check if a new timestamp is newer than an existing one
function isNewer(newTimestamp, oldTimestamp) {
    return parseTimestamp(newTimestamp) > parseTimestamp(oldTimestamp);
}

// Parse a timestamp string to a Date object
function parseTimestamp(timestamp) {
    const [date, time] = timestamp.split(" ");
    const [day, month, year] = date.split("/").map(Number);
    const [hours, minutes, seconds] = time.split(".").map(Number);
    return new Date(year, month - 1, day, hours, minutes, seconds).getTime();
}

// Main function to fetch valid pages (valid = most recent and not deleted)
// Accepts an argument `forceFresh` to force fetching fresh data (if true), else it defaults to local storage.
export async function getValidPages(forceFresh = false) {
    try {
        console.log(`getValidPages called with forceFresh: ${forceFresh}`);

        if (!forceFresh) {
            const cachedPages = getPagesFromLocalStorage();
            if (cachedPages) {
                console.log("Pages fetched from local storage.");
                return cachedPages; // Return cached data if available
            } else {
                console.log("No cached pages found. Fetching fresh data...");
            }
        }

        // Attempt to fetch fresh data from the server
        console.log("Fetching pages data...");
        const pagesData = await fetchCSVData(config.pagesTable);
        console.log("Fetching deleted data...");
        const deletedData = await fetchCSVData(config.deletedTable);

        // Check if deleted data is empty
        if (deletedData.length === 0) {
            console.warn("No deleted pages found. Skipping deleted data filtering.");
        }

        // If fetching fresh data fails or returns no data, return the cached pages
        if (!pagesData || pagesData.length === 0) {
            console.error("Failed to fetch pages data, returning cached pages.");
            const cachedPages = getPagesFromLocalStorage();
            if (cachedPages) {
                console.log("Returning cached valid pages.");
                return cachedPages; // Return cached data if fetching fails
            }
            return []; // Return an empty array if no cached data exists
        }

        // Proceed with processing the fresh data if available
        const recentPages = filterMostRecentPages(pagesData);
        const validPages = filterDeletedPages(recentPages, deletedData);

        console.log(`Filtered valid pages: ${validPages.length} pages`);
        savePagesToLocalStorage(validPages); // Save valid pages to local storage
        console.log("Valid Pages Table with Original Fields:", validPages);

        return validPages;
    } catch (error) {
        console.error("Error in getValidPages:", error);

        // If an error occurs during fetching, return the cached pages from local storage
        const cachedPages = getPagesFromLocalStorage();
        if (cachedPages) {
            console.log("Returning cached valid pages after error.");
            return cachedPages;
        }
        return []; // Return empty array if no cached pages exist
    }
}


// Save valid pages to localStorage
function savePagesToLocalStorage(pages) {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(pages));
        console.log("Valid pages saved to local storage.");
    } catch (error) {
        console.error("Error saving valid pages to local storage:", error);
    }
}

// Retrieve valid pages from localStorage
function getPagesFromLocalStorage() {
    try {
        const pages = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (pages) {
            return JSON.parse(pages);
        }
        return null;
    } catch (error) {
        console.error("Error retrieving valid pages from local storage:", error);
        return null;
    }
}

// Function to update the local storage with fresh data
export async function updateLocalStorageWithFreshData() {
    console.log("Updating local storage with fresh data...");

    // Make sure `updateNotification` function is accessible (you can pass it as an argument if needed)
    const notification = document.getElementById('notification'); // Get the notification div

    try {
        const freshData = await getValidPages(true); // Assuming this function is fetching fresh data

        if (freshData.length > 0) {
            console.log("Local storage updated successfully!");
            notification.textContent = "Aggiornamento completato!"; // Success message
        } else {
            console.error("Failed to update local storage. No valid data found.");
            notification.textContent = "Aggiornamento fallito"; // Failure message
        }
    } catch (error) {
        console.error("Error while updating local storage:", error);
        notification.textContent = "C'è stato un errore"; // Error message
    }
}


// Function to download the valid pages as CSV
export async function downloadValidPagesCSV() {
    try {
        const validPages = await getValidPages(true);  // Fetch fresh valid pages
        
        if (validPages.length === 0) {
            console.error("No valid pages to download.");
            return;
        }

        // Convert valid pages to CSV format using PapaParse
        const csv = Papa.unparse(validPages);
        
        // Create a temporary anchor element to trigger the download
        const downloadLink = document.createElement('a');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = 'valid_pages.csv'; // Set the filename
        document.body.appendChild(downloadLink);  // Append the anchor to the body
        downloadLink.click();  // Trigger the download
        document.body.removeChild(downloadLink);  // Remove the anchor after download
        console.log("Download initiated.");
    } catch (error) {
        console.error("Error downloading valid pages CSV:", error);
    }
}


/**
 * Reorder pages based on the 'category' field.
 * Pages with a valid 'category' value will be placed in the specified position.
 * Pages without a 'category' value or with invalid values will retain their original order.
 * Duplicate categories will be included in the order they appear.
 * @param {Array} pages - The list of pages to reorder.
 * @returns {Array} - The reordered list of pages.
 */
export function reorderPagesByCategory(pages) {
    const orderedPages = [];
    const unorderedPages = [];

    // Create a map to store pages with valid 'category' values
    const categoryMap = new Map();

    pages.forEach(page => {
        const category = parseInt(page.category, 10);
        if (!isNaN(category) && category > 0) {
            // Store all pages with valid categories, including duplicates
            if (!categoryMap.has(category)) {
                categoryMap.set(category, []);
            }
            categoryMap.get(category).push(page); // Add the page to the category
        } else {
            unorderedPages.push(page); // Pages without valid 'category' values
        }
    });

    // Sort the categoryMap by category keys and add them to the orderedPages array
    Array.from(categoryMap.keys())
        .sort((a, b) => a - b)
        .forEach(category => {
            // Add all pages under the same category in order
            orderedPages.push(...categoryMap.get(category));
        });

    // Fill in gaps with unordered pages while maintaining their original order
    let unorderedIndex = 0;
    for (let i = 0; i < orderedPages.length || unorderedIndex < unorderedPages.length; i++) {
        if (!orderedPages[i]) {
            orderedPages[i] = unorderedPages[unorderedIndex++];
        }
    }

    // Append any remaining unordered pages
    while (unorderedIndex < unorderedPages.length) {
        orderedPages.push(unorderedPages[unorderedIndex++]);
    }

    return orderedPages;
}

/**
 * Generates a SHA-1 hash of the given string.
 * 
 * This function uses the SubtleCrypto API to compute a secure SHA-1 digest.
 * It's useful for comparing user input (like form IDs or passwords) against
 * pre-hashed values without exposing the original data.
 * 
 * @param {string} message - The input string to hash.
 * @returns {Promise<string>} - A Promise that resolves to a SHA-1 hash in hexadecimal format.
 */
export async function sha1Hash(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}
