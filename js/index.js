import { getValidPages } from './page-utils.js';

document.addEventListener('DOMContentLoaded', function() {
    const goButton = document.getElementById('goButton');  // Get the goButton element
    const homeLogo = document.getElementById('home-logo'); // Get the home logo element

    let clickCount = 0;  // Initialize a click counter for the home logo

    // Disable goButton initially
    if (goButton) {
        goButton.disabled = true;
    }

    // Set a maximum time limit of 4 seconds for goButton to stay disabled
    setTimeout(() => {
        if (goButton) {
            goButton.disabled = false;
        }
    }, 4000); // 4 seconds timeout

    // Call getValidPages() and wait for it to finish
    getValidPages(true).then(() => {
        // Enable goButton after getValidPages is complete, but only if the timeout hasn't triggered yet
        if (goButton && goButton.disabled) {
            goButton.disabled = false;
        }
    });

    if (goButton) {  // Add event listener for goButton
        goButton.addEventListener('click', function() {
            window.location.href = '/pages/items.html';  // Navigate to items.html
        });
    }

    // Track clicks on the home logo
    if (homeLogo) {
        homeLogo.addEventListener('click', function() {
            clickCount++; // Increment the click counter

            if (clickCount === 5) {
                // Redirect to the admin page after 5 clicks
                window.location.href = '/pages/admin.html';

                // Reset the click count after the redirection
                clickCount = 0;
            }
        });
    }
});
