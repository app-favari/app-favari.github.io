// Add functionality to the back button
const backButton = document.getElementById('back-button');

if (backButton) {
    backButton.addEventListener('click', () => {
        window.history.back(); // Simply navigate back in the browser's history
    });
}

// Register Service Worker for offline functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
            if (registrations.length === 0) {
                navigator.serviceWorker.register('/service-worker.js')
                    .then((registration) => {
                        console.log('Service Worker registered with scope: ', registration.scope);
                    })
                    .catch((error) => {
                        console.error('Service Worker registration failed: ', error);
                    });
            } else {
                console.log('Service Worker already registered');
            }
        });
    });
}

// Listen for the beforeinstallprompt event to show the install button
let deferredPrompt;
const installButton = document.getElementById('installButton');

window.addEventListener('beforeinstallprompt', (event) => {
    // Prevent the default prompt from showing automatically
    event.preventDefault();
    deferredPrompt = event;

    // Show the install button
    installButton.style.display = 'block';

    // When the user clicks the install button
    installButton.addEventListener('click', () => {
        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        deferredPrompt.userChoice
            .then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                } else {
                    console.log('User dismissed the install prompt');
                }
                deferredPrompt = null; // Reset the prompt
                installButton.style.display = 'none'; // Hide the install button after prompt
            });
    });
});
