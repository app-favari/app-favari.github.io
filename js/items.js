import { getValidPages, reorderPagesByCategory } from './page-utils.js'; // Import the reorder function

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const parentId = urlParams.get('parent'); // Retrieve the parent URL parameter

    const validPages = await getValidPages();

    // Filter pages based on the parentId or show rows with empty parent field
    const filteredPages = validPages.filter(page => {
        if (parentId) {
                     // If parentId is provided, show only rows where the 'parent' field matches the parentId
            return page.parent === parentId;
        } else {
            // If no parentId is provided, show only rows where the 'parent' field is empty (i.e., top-level pages)
            return page.parent === "";
        }
    });

    // Reorder pages based on the 'category' field
    const reorderedPages = reorderPagesByCategory(filteredPages);

    // Populate the list with reordered pages
    const itemsListContainer = document.getElementById('items-list-container');
    itemsListContainer.innerHTML = ''; // Clear any existing content

    reorderedPages.forEach(page => {
        const itemElement = createListItem(page, validPages); // Pass validPages here
        itemsListContainer.appendChild(itemElement);
    });
});

// Function to create the list item element
function createListItem(page, validPages) {
    const itemDiv = document.createElement('div');
    itemDiv.classList.add('list-item');
    itemDiv.style.cursor = 'pointer';

    // Circle element
    const circle = document.createElement('div');
    circle.classList.add('circle');

    // Check if the image_address is not empty or null
    if (page.image_address) {
        // If there is an image, set the background image of the circle
        circle.style.backgroundImage = `url(${page.image_address})`;
        circle.style.backgroundSize = 'cover'; // Ensure the image covers the circle
        circle.style.backgroundPosition = 'center'; // Center the image in the circle
    } else {
        // If there is no image, set the background color
        circle.style.backgroundColor = page.colour;
    }

    // Title
    const title = document.createElement('span');
    title.classList.add('item-title');
    title.textContent = page.title;

    // Subtitle
    const subtitle = document.createElement('span');
    subtitle.classList.add('item-subtitle');
    subtitle.textContent = page.subtitle || ''; // Default to an empty string if no subtitle is provided

    // Create a container for title and subtitle, which will stack them vertically
    const textContainer = document.createElement('div');
    textContainer.classList.add('text-container');
    textContainer.appendChild(title);
    textContainer.appendChild(subtitle);

    // Append the circle and the text container (with title and subtitle) to the list item
    itemDiv.appendChild(circle);
    itemDiv.appendChild(textContainer);

    // Add click event listener to the item
    itemDiv.addEventListener('click', () => {
        // Check if the clicked item has children by looking for other rows with this 'id' as the parent
        const hasChildren = isParentForOtherRows(page.id, validPages); // Pass validPages here
    
        if (hasChildren) {
            // If there are child items, reload the same page with 'parent' set to this item's 'id'
            window.location.href = `items.html?parent=${page.id}`;
        } else {
            // If the page has no children and the 'custom_page' field is "TRUE"
            if (page.custom_page === "TRUE") {
                // Redirect to the custom page based on 'id'
                window.location.href = `/pages/custom/${page.id}.html`;
            } else {
                // If the 'custom_page' is not "TRUE", check if external_link is provided
                if (page.external_link) {
                    // If the external link is a PDF, open it inside the app's PDF viewer
                    if (isPdfUrl(page.external_link)) {
                        window.location.href = `/pages/pdf-viewer.html?url=${encodeURIComponent(page.external_link)}`;
                    } else {
                        // Non-PDF external links: preserve existing behavior (avoid aggressive caching)
                        const timestamp = new Date().getTime();
                        const urlWithTimestamp = `${page.external_link}${page.external_link.includes('?') ? '&' : '?'}timestamp=${timestamp}`;
                        window.location.href = urlWithTimestamp;
                    }
                 } else {
                     // Otherwise, redirect to the 'single-item.html' page with 'id' as a URL parameter
                     const currentDate = new Date(); // Get the current date
                     const dayOfMonth = currentDate.getDate(); // Get the day of the month
     
                     // Redirect to 'single-item.html' with the 'id' and anchor (cal + day of the month)
                     window.location.href = `single-item.html?id=${page.id}#cal${dayOfMonth}`;
                 }
             }
         }
     });
     
     
     return itemDiv;
 }
 
 
 
 // Function to check if the page has children (rows with this 'id' in the 'parent' field)
 function isParentForOtherRows(parentId, validPages) {
     return validPages.some(page => page.parent === parentId);
 }
 
 // Helper to detect PDF URLs (handles query strings)
 function isPdfUrl(url) {
     try {
         const parsed = new URL(url, window.location.href);
         return /\.pdf(\?.*)?$/i.test(parsed.pathname + (parsed.search || '')) || parsed.pathname.toLowerCase().endsWith('.pdf');
     } catch (e) {
         // Fallback naive check
         return /\.pdf(\?.*)?$/i.test(url);
     }
 }
