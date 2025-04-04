import config from './config.js';
import { getValidPages } from './page-utils.js';

async function fetchValidPages() {
    const validPages = await getValidPages(true);
    console.log(validPages);

    const pagesDropdown = document.getElementById('pagesDropdown');
    pagesDropdown.innerHTML = ''; // Clear the dropdown first

    // Create and append a default 'Select a page' option
    const defaultOption = document.createElement('option');
    defaultOption.textContent = 'Seleziona una pagina';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    pagesDropdown.appendChild(defaultOption);

    validPages.forEach(page => {
        const option = document.createElement('option');
        option.value = page.id; // Store the page ID in the option's value
        option.textContent = page.title || page.id; // Display the title or fall back to the ID if no title is available
        pagesDropdown.appendChild(option);
    });
}

export async function deletePage() {
    const formId = document.getElementById('deletionFormId').value.trim();
    console.log('Form ID:', formId);

    if (!formId) {
        alert('Please enter a Google Form ID');
        return;
    }

    const pagesDropdown = document.getElementById('pagesDropdown');
    const selectedId = pagesDropdown.value;
    
    if (!selectedId) {
        alert('Please select a page to delete');
        return;
    }

    console.log('Selected Page ID:', selectedId);

    const formUrl = `https://docs.google.com/forms/d/e/${formId}mHm9Q/formResponse`;
    const formData = new FormData();
    formData.append(config.deletionEntryId, selectedId);

    try {
        const response = await fetch(formUrl, {
            method: 'POST',
            body: formData,
            mode: 'no-cors'
        });

        alert(`Page with ID ${selectedId} deleted successfully!`);
        fetchValidPages(); // Re-fetch pages to update the dropdown
    } catch (error) {
        console.error('Error submitting form:', error);
        alert('Error deleting page: ' + error.message);
    }
}

function editPage() {
    const pagesDropdown = document.getElementById('pagesDropdown');
    const selectedId = pagesDropdown.value;

    if (!selectedId) {
        alert('Please select a page to edit');
        return;
    }

    window.open(`./create-page.html?id=${selectedId}`, '_self');
}

// Initialize the page
fetchValidPages();

// Add event listeners
document.querySelector('#deleteBtn').addEventListener('click', deletePage);
document.querySelector('#editBtn').addEventListener('click', editPage);
