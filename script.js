let allOffers = [];

async function loadOffers() {
    try {
        const response = await fetch('offers.json');
        const data = await response.json();
        allOffers = data.offers || [];
        
        document.getElementById('lastUpdate').textContent = 
            new Date(data.last_updated).toLocaleString('pl-PL');
        
        displayOffers(allOffers);
    } catch (error) {
        console.error('Błąd ładowania ofert:', error);
        document.getElementById('offersContainer').innerHTML = 
            '<div class="loading">Błąd ładowania danych. Sprawdź czy plik offers.json istnieje.</div>';
    }
}

function displayOffers(offers) {
    const container = document.getElementById('offersContainer');
    const noResults = document.getElementById('noResults');
    
    if (offers.length === 0) {
        container.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }
    
    container.style.display = 'grid';
    noResults.style.display = 'none';
    
    container.innerHTML = offers.map(offer => `
        <div class="offer-card">
            <div class="offer-header">
                <div class="offer-avatar">
                    ${offer.author.charAt(0).toUpperCase()}
                </div>
                <div class="offer-author">
                    <div class="author-name">${escapeHtml(offer.author)}</div>
                    <div class="offer-date">${new Date(offer.timestamp).toLocaleDateString('pl-PL')}</div>
                </div>
            </div>
            <div class="offer-content">
                ${escapeHtml(offer.content).substring(0, 200)}${offer.content.length > 200 ? '...' : ''}
            </div>
            <div class="offer-footer">
                <a href="${offer.url}" target="_blank" class="view-discord-btn">
                    Zobacz na Discord
                </a>
            </div>
        </div>
    `).join('');
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function filterAndSortOffers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const sortBy = document.getElementById('sortSelect').value;
    
    let filtered = allOffers.filter(offer => 
        offer.content.toLowerCase().includes(searchTerm) ||
        offer.author.toLowerCase().includes(searchTerm)
    );
    
    if (sortBy === 'newest') {
        filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else {
        filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }
    
    displayOffers(filtered);
}

document.getElementById('searchInput').addEventListener('input', filterAndSortOffers);
document.getElementById('sortSelect').addEventListener('change', filterAndSortOffers);

loadOffers();