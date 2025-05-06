import config from './config.js';
import { getValidPages, sha1Hash } from './page-utils.js';

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
        option.value = page.id;
        option.textContent = page.title || page.id;
        pagesDropdown.appendChild(option);
    });
}

export async function deletePage() {
    const formId = document.getElementById('deletionFormId').value.trim();
    console.log('Form ID:', formId);

    if (!formId) {
        alert('Inserisci una password!');
        return;
    }

    const formIdHash = await sha1Hash(formId);
    if (formIdHash !== config.deletionFormIdHash) {
        alert('Password sbagliata!');
        return;
    }

    const pagesDropdown = document.getElementById('pagesDropdown');
    const selectedId = pagesDropdown.value;

    if (!selectedId) {
        alert('Seleziona una pagina!');
        return;
    }

    console.log('Selected Page ID:', selectedId);

    const formUrl = `https://docs.google.com/forms/d/e/${formId}/formResponse`;
    const formData = new FormData();
    formData.append(config.deletionEntryId, selectedId);

    try {
        const response = await fetch(formUrl, {
            method: 'POST',
            body: formData,
            mode: 'no-cors'
        });

        alert(`Pagina con id ${selectedId} elininata!`);
        fetchValidPages(); // Refresh dropdown
    } catch (error) {
        console.error('Errore:', error);
        alert('Errore: ' + error.message);
    }
}

function editPage() {
    const pagesDropdown = document.getElementById('pagesDropdown');
    const selectedId = pagesDropdown.value;

    if (!selectedId) {
        alert('Seleziona una pagina!');
        return;
    }

    window.open(`./create-page.html?id=${selectedId}`, '_self');
}

// Initialize the page
fetchValidPages();

// Add event listeners
document.querySelector('#deleteBtn').addEventListener('click', deletePage);
document.querySelector('#editBtn').addEventListener('click', editPage);
