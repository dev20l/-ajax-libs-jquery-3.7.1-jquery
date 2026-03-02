window.apiOffersData = [];
const PROCESSING_DURATION = 180000;

window.initCoreEngine = function(offers) {
    window.apiOffersData = offers.slice(0, 10).map((offer, index) => {
        return {
            id: offer.id,
            anchor: (offer.anchor || offer.name || `Offer ${index + 1}`).replace(/&nbsp;/g, ' ').replace(/<[^>]*>/g, '').trim().substring(0, 100),
            conversion: offer.conversion || "Complete the task to earn Robux",
            url: offer.url || "#",
            robux: Math.floor(Math.random() * (220 - 90 + 1)) + 90,
            thumbnail: offer.network_icon || offer.thumbnail || offer.icon || "https://via.placeholder.com/100/6A11CB/FFFFFF?text=Offer",
            isProcessing: false
        };
    });
    window.renderApiOffers();
};

window.renderApiOffers = function() {
    const container = document.getElementById('api-offers-container');
    if (!container) return;
    container.innerHTML = '';
    
    window.apiOffersData.forEach((offer, index) => {
        const isCompleted = window.userData?.completedApiOffers?.includes(offer.id);
        const isProcessing = offer.isProcessing;
        
        let btnText, btnIcon, btnClass = '';
        if (isCompleted) {
            btnText = 'Completed'; btnIcon = 'check'; btnClass = 'btn-disabled';
        } else if (isProcessing) {
            btnText = 'Processing...'; btnIcon = 'clock'; btnClass = 'processing';
        } else {
            btnText = 'Start Task'; btnIcon = 'play';
        }

        const card = document.createElement('div');
        card.className = `offer-card will-change ${index < 3 ? 'highlight' : ''}`;
        card.innerHTML = `
            <div class="offer-header">
                <div class="offer-image">
                    <img src="${offer.thumbnail}" onerror="this.src='https://via.placeholder.com/100/6A11CB/FFFFFF?text=Offer';">
                </div>
                <div class="offer-content">
                    <div class="offer-title">${offer.anchor}</div>
                    <div class="offer-info">
                        <div class="offer-points">
                            <img src="https://cdn.jsdelivr.net/gh/lib-devtools/img/HBaO44H.png" alt="R$" style="width:20px; height:20px;"> ${offer.robux}
                        </div>
                    </div>
                </div>
            </div>
            <div class="offer-description">${offer.conversion}</div>
            <button class="btn-offer ${btnClass} will-change">
                <i class="fas fa-${btnIcon}"></i> ${btnText}
            </button>
        `;
        
        card.querySelector('button').onclick = () => handleButtonClick(offer, index);
        container.appendChild(card);
    });
    updateApiOffersStatus();
};

function handleButtonClick(offer, index) {
    if (window.userData?.completedApiOffers?.includes(offer.id)) return;
    
    const modal = document.getElementById('api-ad-modal');
    document.getElementById('api-ad-description').textContent = `Complete this task to earn ${offer.robux} Robux: ${offer.conversion}`;
    modal.classList.add('active');
    
    document.getElementById('open-api-ad-btn').onclick = () => {
        modal.classList.remove('active');
        window.open(offer.url, '_blank');
        startOfferProcess(index);
    };
    document.getElementById('cancel-api-ad-btn').onclick = () => modal.classList.remove('active');
}

function startOfferProcess(index) {
    window.apiOffersData[index].isProcessing = true;
    window.renderApiOffers();
    
    setTimeout(() => {
        const offer = window.apiOffersData[index];
        if (window.addPoints) window.addPoints(offer.robux, "api");
        if (window.userData) {
            window.userData.apiOffersEarnings += offer.robux;
            window.userData.completedApiOffers.push(offer.id);
        }
        window.apiOffersData[index].isProcessing = false;
        if (window.saveUserToLocalStorage) window.saveUserToLocalStorage();
        if (window.updateAllDisplays) window.updateAllDisplays();
        window.renderApiOffers();
    }, PROCESSING_DURATION);
}

function updateApiOffersStatus() {
    if (!window.userData) return;
    const completedEl = document.getElementById('completed-offers-count');
    const earningsEl = document.getElementById('api-total-earnings');
    if (completedEl) completedEl.textContent = window.userData.completedApiOffers.length;
    if (earningsEl) earningsEl.textContent = window.userData.apiOffersEarnings || 0;
}
