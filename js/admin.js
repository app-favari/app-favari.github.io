import { downloadValidPagesCSV } from './page-utils.js';  // Import the function

// Add event listener to the download link
document.getElementById('downloadLink').addEventListener('click', downloadValidPagesCSV);

// Get the update button
const updateButton = document.getElementById('updateButton');

// notification text
const notification = document.getElementById('notification');  // div for the notification

// Function to handle the update process
if (updateButton) {
    updateButton.addEventListener('click', async function() {
        // Show loading message while the update is in progress
        updateNotification("Cache aggiornata");
        // Trigger a service worker cache update
        if (navigator.serviceWorker) {
            navigator.serviceWorker.ready.then(registration => {
                // Send a message to the service worker to trigger cache update
                registration.active.postMessage({ action: 'update-cache' });
            });
        }
    });
}

// Function to update notification text
function updateNotification(message) {
    notification.textContent = message;
}