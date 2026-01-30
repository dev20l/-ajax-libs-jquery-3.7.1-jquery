/* 
/*! This website is protected by copyright.
Developed by Victor Abdo.
To get the source code, please contact on WhatsApp: +212682497757
*/
const OFFER_TIMER_DURATION = 180000;
const PROCESSING_DURATION = 180000;

let apiOffersData = [];
let currentApiOffer = null;
let pendingTimerOffers = {};
let offerCheckInterval = null;

function loadApiOffers() {
    const apiOffersContainer = document.getElementById('api-offers-container');
    apiOffersContainer.innerHTML = '<div class="loading will-change"><div class="spinner"></div><p>Loading amazing offers for you...</p></div>';
    
    const apiUrl = "https://d1y3y09sav47f5.cloudfront.net/public/offers/feed.php?user_id=511022&api_key=3197b8ec5712836c30c668f82c8c6e4a&s1=&s2=&callback=?";
    
    $.getJSON(apiUrl, function(offers) {
        if (offers && offers.length > 0) {
            apiOffersData = processApiOffers(offers.slice(0, 10));
            renderApiOffers();
        } else {
            showToast("No offers available at the moment. Please try again later.", "info");
            apiOffersContainer.innerHTML = '<div class="offer-card will-change" style="text-align: center; padding: 40px 20px;"><i class="fas fa-exclamation-circle" style="font-size: 2rem; color: var(--text-muted); margin-bottom: 16px;"></i><p style="color: var(--text-secondary);">No offers available at the moment. Please check back later!</p></div>';
        }
    }).fail(function() {
        showToast("Failed to load offers. Please try again.", "error");
        apiOffersContainer.innerHTML = '<div class="offer-card will-change" style="text-align: center; padding: 40px 20px;"><i class="fas fa-exclamation-circle" style="font-size: 2rem; color: var(--text-muted); margin-bottom: 16px;"></i><p style="color: var(--text-secondary);">Failed to load offers. Please check your connection and try again.</p></div>';
    });
}

function processApiOffers(offers) {
    const robuxValues = [];
    for (let i = 0; i < offers.length; i++) {
        robuxValues.push(Math.floor(Math.random() * (220 - 90 + 1)) + 90);
    }
    
    return offers.map((offer, index) => {
        const robux = robuxValues[index] || 100;
        const cleanAnchor = (offer.anchor || offer.name || `Offer ${index + 1}`)
            .replace(/&nbsp;/g, ' ')
            .replace(/<[^>]*>/g, '')
            .trim()
            .substring(0, 100);
        const conversion = offer.conversion || "Complete the task to earn Robux";
        const thumbnailUrl = getThumbnailUrl(offer);
        
        return {
            id: offer.id,
            anchor: cleanAnchor,
            conversion: conversion,
            url: offer.url || "#",
            robux: robux,
            thumbnail: thumbnailUrl,
            pendingTimer: pendingTimerOffers[offer.id] || null,
            startedAt: null,
            isProcessing: false
        };
    });
}

function getThumbnailUrl(offer) {
    if (offer.network_icon) return offer.network_icon;
    else if (offer.thumbnail) return offer.thumbnail;
    else if (offer.icon) return offer.icon;
    else if (offer.image_url) return offer.image_url;
    else return "https://via.placeholder.com/100/6A11CB/FFFFFF?text=Offer";
}

function renderApiOffers() {
    const apiOffersContainer = document.getElementById('api-offers-container');
    apiOffersContainer.innerHTML = '';
    
    if (apiOffersData.length === 0) {
        apiOffersContainer.innerHTML = '<div class="offer-card will-change" style="text-align: center; padding: 40px 20px;"><i class="fas fa-exclamation-circle" style="font-size: 2rem; color: var(--text-muted); margin-bottom: 16px;"></i><p style="color: var(--text-secondary);">No offers available at the moment. Check back later!</p></div>';
        return;
    }
    
    apiOffersData.forEach((offer, index) => {
        const isCompleted = window.userData && window.userData.completedApiOffers ? window.userData.completedApiOffers.includes(offer.id) : false;
        const hasPendingTimer = offer.pendingTimer && offer.pendingTimer > Date.now();
        const isProcessing = offer.isProcessing;
        
        let offerButtonText, offerButtonIcon, buttonClass = '';
        
        if (isCompleted) {
            offerButtonText = 'Completed';
            offerButtonIcon = 'check';
            buttonClass = 'btn-disabled';
        } else if (isProcessing) {
            offerButtonText = 'Processing...';
            offerButtonIcon = 'clock';
            buttonClass = 'processing';
        } else if (hasPendingTimer) {
            offerButtonText = 'Try Again';
            offerButtonIcon = 'redo';
        } else {
            offerButtonText = 'Start Task';
            offerButtonIcon = 'play';
        }
        
        const offerCard = document.createElement('div');
        offerCard.className = `offer-card will-change ${index < 3 ? 'highlight' : ''}`;
        offerCard.innerHTML = `
            <div class="offer-header">
                <div class="offer-image">
                    <img src="${offer.thumbnail}" alt="${offer.anchor}" onerror="this.onerror=null; this.src='https://via.placeholder.com/100/6A11CB/FFFFFF?text=Offer';">
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
            <button class="btn-offer ${buttonClass} will-change" 
                    data-offer-id="${offer.id}"
                    data-offer-index="${index}">
                <i class="fas fa-${offerButtonIcon}"></i>
                ${offerButtonText}
            </button>
        `;
        
        const button = offerCard.querySelector('.btn-offer');
        button.addEventListener('click', () => handleOfferButtonClick(offer, index));
        
        apiOffersContainer.appendChild(offerCard);
    });
    
    updateApiOffersStatus();
}

function handleOfferButtonClick(offer, index) {
    if (window.userData && window.userData.completedApiOffers && window.userData.completedApiOffers.includes(offer.id)) {
        showToast("This offer is already completed!", "info");
        return;
    }
    
    if (offer.isProcessing) {
        if (offer.url && offer.url !== "#") {
            window.open(offer.url, '_blank');
            showToast("Redirected to the task. Please complete it to earn Robux!", "info", 3000);
        }
        return;
    }
    
    if (offer.pendingTimer && offer.pendingTimer <= Date.now()) {
        apiOffersData[index].isProcessing = false;
        apiOffersData[index].pendingTimer = null;
        renderApiOffers();
        
        currentApiOffer = { ...offer, index: index };
        document.getElementById('api-ad-description').textContent = `Complete this task to earn ${offer.robux} Robux: ${offer.conversion}`;
        document.getElementById('api-ad-modal').classList.add('active');
        
        setTimeout(() => {
            setupModalEventListeners();
        }, 100);
        
        return;
    }
    
    currentApiOffer = { ...offer, index: index };
    document.getElementById('api-ad-description').textContent = `Complete this task to earn ${offer.robux} Robux: ${offer.conversion}`;
    document.getElementById('api-ad-modal').classList.add('active');
    
    setTimeout(() => {
        setupModalEventListeners();
    }, 100);
}

function setupModalEventListeners() {
    const openApiAdBtn = document.getElementById('open-api-ad-btn');
    const cancelApiAdBtn = document.getElementById('cancel-api-ad-btn');
    
    if (openApiAdBtn) {
        openApiAdBtn.replaceWith(openApiAdBtn.cloneNode(true));
    }
    if (cancelApiAdBtn) {
        cancelApiAdBtn.replaceWith(cancelApiAdBtn.cloneNode(true));
    }
    
    const newOpenBtn = document.getElementById('open-api-ad-btn');
    const newCancelBtn = document.getElementById('cancel-api-ad-btn');
    
    if (newOpenBtn) {
        newOpenBtn.addEventListener('click', startApiOffer);
    }
    
    if (newCancelBtn) {
        newCancelBtn.addEventListener('click', () => {
            document.getElementById('api-ad-modal').classList.remove('active');
            currentApiOffer = null;
        });
    }
}

function startApiOffer() {
    if (!currentApiOffer) return;
    
    const offer = currentApiOffer;
    const index = currentApiOffer.index;
    
    if (offer.url && offer.url !== "#") {
        window.open(offer.url, '_blank');
    }
    
    startOfferTask(offer, index);
    
    document.getElementById('api-ad-modal').classList.remove('active');
    currentApiOffer = null;
}

function startOfferTask(offer, index) {
    if (apiOffersData[index].isProcessing) {
        showToast("This offer is already in progress!", "info");
        return;
    }
    
    apiOffersData[index].startedAt = Date.now();
    apiOffersData[index].isProcessing = true;
    apiOffersData[index].pendingTimer = Date.now() + PROCESSING_DURATION;
    pendingTimerOffers[offer.id] = apiOffersData[index].pendingTimer;
    
    if (window.userData) {
        window.userData.totalOffersAttempted = (window.userData.totalOffersAttempted || 0) + 1;
        if (window.saveUserToLocalStorage) {
            window.saveUserToLocalStorage();
        }
    }
    
    showToast(`Offer started! Complete the task in the new tab to earn ${offer.robux} Robux.`, 'success', 4000);
    
    renderApiOffers();
    
    setTimeout(() => {
        checkAndCompleteOffer(offer, index);
    }, PROCESSING_DURATION);
    
    if (!offerCheckInterval) {
        offerCheckInterval = setInterval(() => {
            checkAllPendingOffers();
        }, 30000);
    }
}

function checkAndCompleteOffer(offer, index) {
    if (window.userData && window.userData.completedApiOffers && !window.userData.completedApiOffers.includes(offer.id)) {
        apiOffersData[index].isProcessing = false;
        
        if (window.addPoints) {
            window.addPoints(offer.robux, "api");
        }
        
        if (window.userData) {
            window.userData.apiOffersEarnings += offer.robux;
            window.userData.completedApiOffers.push(offer.id);
        }
        
        delete pendingTimerOffers[offer.id];
        
        renderApiOffers();
        
        if (window.saveUserToLocalStorage) {
            window.saveUserToLocalStorage();
        }
        
        if (window.updateAllDisplays) {
            window.updateAllDisplays();
        }
        
        showToast(`🎉 Congratulations! +${offer.robux} Robux earned from completed offer!`, 'success', 6000);
    } else {
        apiOffersData[index].isProcessing = false;
        renderApiOffers();
    }
}

function checkAllPendingOffers() {
    const now = Date.now();
    let hasPending = false;
    
    apiOffersData.forEach((offer, index) => {
        if (offer.pendingTimer && offer.pendingTimer <= now && offer.isProcessing) {
            checkAndCompleteOffer(offer, index);
        }
        if (offer.isProcessing) {
            hasPending = true;
        }
    });
    
    if (!hasPending && offerCheckInterval) {
        clearInterval(offerCheckInterval);
        offerCheckInterval = null;
    }
}

function updateApiOffersStatus() {
    if (!window.userData) return;
    
    const completedOffers = window.userData.completedApiOffers ? window.userData.completedApiOffers.length : 0;
    const completedEl = document.getElementById('completed-offers-count');
    const earningsEl = document.getElementById('api-total-earnings');
    const progressFill = document.getElementById('progress-fill');
    
    if (completedEl) completedEl.textContent = completedOffers;
    if (earningsEl) earningsEl.textContent = window.userData.apiOffersEarnings || 0;
    
    if (progressFill && apiOffersData.length > 0) {
        const progressPercent = Math.min((completedOffers / apiOffersData.length) * 100, 100);
        progressFill.style.width = `${progressPercent}%`;
    }
}

function showToast(message, type = 'info', duration = 3000) {
    const toastEl = document.getElementById('toast-notification');
    const toastMessageEl = document.getElementById('toast-message');
    
    if (!toastEl || !toastMessageEl) return;
    
    toastMessageEl.textContent = message;
    toastEl.className = 'toast will-change';
    if (type) toastEl.classList.add(type);
    
    const icon = toastEl.querySelector('i');
    icon.className = type === 'success' ? 'fas fa-check-circle' : 
                   type === 'error' ? 'fas fa-exclamation-circle' : 
                   type === 'warning' ? 'fas fa-exclamation-triangle' :
                   'fas fa-info-circle';
    
    toastEl.classList.add('show');
    
    if (toastEl.hideTimeout) clearTimeout(toastEl.hideTimeout);
    toastEl.hideTimeout = setTimeout(() => {
        toastEl.classList.remove('show');
    }, duration);
}

function initOffersSystem() {
    loadApiOffers();
}

window.loadApiOffers = loadApiOffers;
window.initOffersSystem = initOffersSystem;
window.apiOffersData = apiOffersData;
window.renderApiOffers = renderApiOffers;
