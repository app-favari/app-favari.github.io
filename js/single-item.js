import { getValidPages } from './page-utils.js'; // Import the utility function

// This function will run when the DOM is ready
document.addEventListener('DOMContentLoaded', async function() {
    // Step 1: Get the ID from the URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const pageId = urlParams.get('id');

    if (!pageId) {
        console.error('No page ID specified.');
        return;
    }

    // Step 2: Fetch the valid pages data using the getValidPages function
    const validPages = await getValidPages();

    // Step 3: Find the page object that matches the ID
    const page = validPages.find(item => item.id === pageId);

    if (!page) {
        console.error('Page not found for ID:', pageId);
        return;
    }

    // Step 4: Render the page content
    renderPage(page);
});

// Function to render the page content dynamically
function renderPage(page) {
    const contentContainer = document.getElementById('content-container');

    // Set the page title
    const titleElement = document.createElement('h2');
    titleElement.textContent = page.title;
    contentContainer.appendChild(titleElement);

    // Set the subtitle if available
    if (page.subtitle) {
        const subtitleElement = document.createElement('h3');
        subtitleElement.textContent = page.subtitle;
        contentContainer.appendChild(subtitleElement);
    }

    // Insert the content HTML (already formatted HTML)
    const contentElement = document.createElement('div');
    contentElement.innerHTML = page.content;
    contentContainer.appendChild(contentElement);

    // Add an external link button if the external_link is not empty
    if (page.external_link) {
        const externalLinkButton = document.createElement('button');
        externalLinkButton.textContent = 'Link';
        // Set up the button's click event to open the link in a new tab
        externalLinkButton.addEventListener('click', () => {
            window.open(page.external_link, '_blank'); // Open the link in a new tab
        });
        contentContainer.appendChild(externalLinkButton);
    }
}
