let allOffers = [];

async function loadOffers() {
    try {
        const response = await fetch('offers.json');
        const data = await response.json();
        allOffers = data.offers || [];

        const date = new Date(data.last_updated);
        date.setHours(date.getHours() + 1);

        document.getElementById('lastUpdate').textContent =
            date.toLocaleString('pl-PL');

        updateStats();
        displayOffers(allOffers);

    } catch (error) {
        console.error('Błąd ładowania ofert:', error);
        document.getElementById('offersContainer').innerHTML = 
            '<div class="loading">Błąd ładowania danych. Sprawdź czy plik offers.json istnieje.</div>';
    }
}

function updateStats() {
    const totalOffers = allOffers.length;
    const offersWithPrice = allOffers.filter(o => o.price).length;
    const avgPrice = offersWithPrice > 0 
        ? Math.round(allOffers.filter(o => o.price).reduce((sum, o) => sum + o.price, 0) / offersWithPrice)
        : 0;
    
    document.getElementById('totalOffers').textContent = totalOffers;
    document.getElementById('avgPrice').textContent = avgPrice > 0 ? `${avgPrice} zł` : 'N/A';
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
    
    container.innerHTML = offers.map(offer => {
        const hasImages = offer.images && offer.images.length > 0;
        const mainImage = hasImages ? offer.images[0] : null;
        const imageGallery = hasImages && offer.images.length > 1 
            ? `<div class="image-gallery-indicator">+${offer.images.length - 1} zdjęć</div>`
            : '';
        
        return `
        <div class="offer-card" onclick="openOfferModal('${offer.id}')">
            ${mainImage ? `
                <div class="offer-image">
                    <img src="${mainImage}" alt="Zdjęcie oferty" loading="lazy">
                    ${imageGallery}
                </div>
            ` : ''}
            <div class="offer-header">
                <img src="${offer.avatar_url || ''}" alt="${escapeHtml(offer.author)}" class="offer-avatar" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="offer-avatar-fallback" style="display: none;">
                    ${offer.author.charAt(0).toUpperCase()}
                </div>
                <div class="offer-author">
                    <div class="author-name">${escapeHtml(offer.author)}</div>
                    <div class="offer-date">${formatDate(offer.timestamp)}</div>
                </div>
            </div>
            <div class="offer-content">
                ${escapeHtml(offer.content).substring(0, 150)}${offer.content.length > 150 ? '...' : ''}
            </div>
            <div class="offer-footer">
                ${offer.price ? `<div class="price-tag">💰 ${offer.price.toLocaleString('pl-PL')} zł</div>` : '<div class="price-tag-empty">Cena do ustalenia</div>'}
                ${offer.location ? `<div class="location-tag">📍 ${escapeHtml(offer.location)}</div>` : ''}
            </div>
        </div>
    `}).join('');
}

function openOfferModal(offerId) {
    const offer = allOffers.find(o => o.id === offerId);
    if (!offer) return;
    
    const modal = document.getElementById('offerModal');
    const modalContent = document.getElementById('modalContent');
    
    const imagesHTML = offer.images && offer.images.length > 0 
        ? `<div class="modal-images">
            ${offer.images.map(img => `<img src="${img}" alt="Zdjęcie" class="modal-image">`).join('')}
           </div>`
        : '';
    
    modalContent.innerHTML = `
        <div class="modal-header">
            <img src="${offer.avatar_url || ''}" alt="${escapeHtml(offer.author)}" class="modal-avatar">
            <div>
                <div class="modal-author">${escapeHtml(offer.author)}</div>
                <div class="modal-date">${formatDate(offer.timestamp)}</div>
            </div>
        </div>
        ${imagesHTML}
        <div class="modal-body">
            <div class="modal-text">${escapeHtml(offer.content).replace(/\n/g, '<br>')}</div>
        </div>
        <div class="modal-footer">
            ${offer.price ? `<div class="modal-price">💰 ${offer.price.toLocaleString('pl-PL')} zł</div>` : ''}
            ${offer.location ? `<div class="modal-location">📍 ${escapeHtml(offer.location)}</div>` : ''}
            <a href="${offer.url}" target="_blank" class="view-discord-btn">Otwórz na Discord</a>
        </div>
    `;
    
    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('offerModal').style.display = 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById('offerModal');
    if (event.target === modal) {
        closeModal();
    }
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins} min temu`;
    if (diffHours < 24) return `${diffHours}h temu`;
    if (diffDays < 7) return `${diffDays} dni temu`;
    return date.toLocaleDateString('pl-PL');
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
    const priceFilter = document.getElementById('priceFilter').value;
    
    let filtered = allOffers.filter(offer => 
        offer.content.toLowerCase().includes(searchTerm) ||
        offer.author.toLowerCase().includes(searchTerm) ||
        (offer.location && offer.location.toLowerCase().includes(searchTerm))
    );
    
    // Filtruj po cenie
    if (priceFilter === 'with-price') {
        filtered = filtered.filter(o => o.price);
    } else if (priceFilter === 'no-price') {
        filtered = filtered.filter(o => !o.price);
    }
    
    // Sortowanie
    if (sortBy === 'newest') {
        filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else if (sortBy === 'oldest') {
        filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } else if (sortBy === 'price-low') {
        filtered.sort((a, b) => (a.price || Infinity) - (b.price || Infinity));
    } else if (sortBy === 'price-high') {
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
    }
    
    displayOffers(filtered);
}

document.getElementById('searchInput').addEventListener('input', filterAndSortOffers);
document.getElementById('sortSelect').addEventListener('change', filterAndSortOffers);
document.getElementById('priceFilter').addEventListener('change', filterAndSortOffers);

loadOffers();