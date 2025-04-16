/**
 * Google Reviews Widget Loader
 * 
 * A lightweight, asynchronous script for loading and displaying Google reviews
 * Supports various display modes: carousel, grid, and list
 */

(function() {
    'use strict';

    // Store the current script tag for reference
    const currentScript = document.currentScript;
    
    // Default configuration
    const defaultConfig = {
        apiKey: '',
        placeId: '',
        widgetId: 'gr-widget-' + Math.random().toString(36).substring(2, 9),
        theme: 'light',
        displayMode: 'carousel',
        maxReviews: 3,
        minRating: 0,
        showRatings: true,
        showDates: true,
        showPhotos: true,
        autoplaySpeed: 5000,
        customStyles: null,
        apiEndpoint: 'https://reviews-api.example.com/api/google-reviews',
        language: 'en',
        loadingText: 'Loading reviews...',
        errorText: 'Could not load reviews.'
    };

    // Main widget class
    class GoogleReviewsWidget {
        constructor(config) {
            this.config = { ...defaultConfig, ...config };
            this.container = null;
            this.reviews = [];
            this.isLoaded = false;
            this.currentIndex = 0;
            this.reviewsInterval = null;
        }

        /**
         * Initialize the widget
         * @param {string|Element} targetEl - Target element or selector
         */
        async init(targetEl) {
            // Find the container
            if (typeof targetEl === 'string') {
                this.container = document.querySelector(targetEl);
            } else {
                this.container = targetEl;
            }

            if (!this.container) {
                console.error('Google Reviews Widget: Target container not found');
                return;
            }

            // Add widget ID to container
            this.container.id = this.config.widgetId;
            this.container.classList.add('gr-widget-container', `gr-theme-${this.config.theme}`);

            // Add loading indicator
            this.showLoading();

            // Fetch reviews
            try {
                await this.fetchReviews();
                this.renderWidget();
            } catch (error) {
                this.showError(error);
            }
        }

        /**
         * Show loading indicator
         */
        showLoading() {
            this.container.innerHTML = `
                <div class="gr-loading">
                    <div class="gr-loading-spinner"></div>
                    <p>${this.config.loadingText}</p>
                </div>
            `;
        }

        /**
         * Show error message
         * @param {Error} error - Error object
         */
        showError(error) {
            console.error('Google Reviews Widget error:', error);
            this.container.innerHTML = `
                <div class="gr-error">
                    <p>${this.config.errorText}</p>
                </div>
            `;
        }

        /**
         * Fetch reviews from the API
         */
        async fetchReviews() {
            const { apiEndpoint, placeId, apiKey } = this.config;
            
            if (!placeId) {
                throw new Error('Missing Place ID');
            }

            const url = `${apiEndpoint}/${placeId}`;
            const headers = {};
            
            if (apiKey) {
                headers['X-Widget-API-Key'] = apiKey;
            }

            try {
                const response = await fetch(url, { headers });
                
                if (!response.ok) {
                    throw new Error(`API Error: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.status === 'error') {
                    throw new Error(data.message || 'Unknown error');
                }
                
                this.reviews = data.data.reviews || [];
                
                // Filter out reviews by minimum rating if specified
                if (this.config.minRating > 0) {
                    this.reviews = this.reviews.filter(review => 
                        review.rating >= this.config.minRating);
                }
                
                // Limit the number of reviews to display
                this.reviews = this.reviews.slice(0, this.config.maxReviews);
                
                this.businessInfo = {
                    name: data.data.businessName || '',
                    rating: data.data.rating || 0,
                    totalReviews: data.data.totalReviews || 0
                };
                
                this.isLoaded = true;
            } catch (error) {
                console.error('Failed to fetch reviews:', error);
                throw error;
            }
        }

        /**
         * Render the widget based on displayMode
         */
        renderWidget() {
            if (!this.isLoaded || this.reviews.length === 0) {
                this.container.innerHTML = `
                    <div class="gr-no-reviews">
                        <p>No reviews available.</p>
                    </div>
                `;
                return;
            }

            // Add widget CSS
            this.injectStyles();

            // Render header with business info
            const header = this.renderHeader();
            
            // Render reviews based on display mode
            let reviewsContent;
            switch (this.config.displayMode) {
                case 'carousel':
                    reviewsContent = this.renderCarousel();
                    break;
                case 'grid':
                    reviewsContent = this.renderGrid();
                    break;
                case 'list':
                default:
                    reviewsContent = this.renderList();
                    break;
            }
            
            // Render footer with attribution
            const footer = this.renderFooter();
            
            // Combine all parts
            this.container.innerHTML = header + reviewsContent + footer;
            
            // Initialize interactivity
            this.initInteractivity();
        }

        /**
         * Render the header section with business info
         * @returns {string} Header HTML
         */
        renderHeader() {
            const { name, rating, totalReviews } = this.businessInfo;
            const stars = this.renderStars(rating);
            
            return `
                <div class="gr-header">
                    <h3 class="gr-business-name">${name}</h3>
                    <div class="gr-overall">
                        <div class="gr-stars">${stars}</div>
                        <div class="gr-rating-text">
                            ${rating.toFixed(1)} / 5 from ${totalReviews} review${totalReviews !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>
            `;
        }

        /**
         * Render a carousel of reviews
         * @returns {string} Carousel HTML
         */
        renderCarousel() {
            const reviewsHtml = this.reviews.map((review, index) => 
                this.renderReviewCard(review, index)
            ).join('');
            
            return `
                <div class="gr-carousel">
                    <div class="gr-carousel-container">
                        ${reviewsHtml}
                    </div>
                    <div class="gr-controls">
                        <button class="gr-prev" aria-label="Previous review">&lsaquo;</button>
                        <div class="gr-dots">
                            ${this.reviews.map((_, i) => 
                                `<button class="gr-dot${i === 0 ? ' gr-active' : ''}" 
                                 data-index="${i}" aria-label="Go to review ${i+1}"></button>`
                            ).join('')}
                        </div>
                        <button class="gr-next" aria-label="Next review">&rsaquo;</button>
                    </div>
                </div>
            `;
        }

        /**
         * Render a grid of reviews
         * @returns {string} Grid HTML
         */
        renderGrid() {
            const reviewsHtml = this.reviews.map((review) => 
                this.renderReviewCard(review)
            ).join('');
            
            return `
                <div class="gr-grid">
                    ${reviewsHtml}
                </div>
            `;
        }

        /**
         * Render a list of reviews
         * @returns {string} List HTML
         */
        renderList() {
            const reviewsHtml = this.reviews.map((review) => 
                this.renderReviewCard(review)
            ).join('');
            
            return `
                <div class="gr-list">
                    ${reviewsHtml}
                </div>
            `;
        }

        /**
         * Render a single review card
         * @param {Object} review - Review data
         * @param {number} index - Review index
         * @returns {string} Review card HTML
         */
        renderReviewCard(review, index = 0) {
            const { authorName, authorPhotoUrl, rating, text, relativeTime } = review;
            const stars = this.renderStars(rating);
            const visibilityClass = index === 0 ? ' gr-active' : '';
            
            return `
                <div class="gr-review${visibilityClass}" data-index="${index}">
                    <div class="gr-review-header">
                        ${this.config.showPhotos && authorPhotoUrl ? 
                            `<div class="gr-author-img">
                                <img src="${authorPhotoUrl}" alt="${authorName}" loading="lazy" />
                            </div>` : 
                            `<div class="gr-author-initial">${authorName.charAt(0)}</div>`
                        }
                        <div class="gr-author-info">
                            <div class="gr-author-name">${authorName}</div>
                            ${this.config.showDates ? 
                                `<div class="gr-review-date">${relativeTime}</div>` : 
                                ''
                            }
                        </div>
                    </div>
                    ${this.config.showRatings ? 
                        `<div class="gr-review-rating">${stars}</div>` : 
                        ''
                    }
                    <div class="gr-review-text">${text}</div>
                </div>
            `;
        }

        /**
         * Render star rating
         * @param {number} rating - Rating value (0-5)
         * @returns {string} Stars HTML
         */
        renderStars(rating) {
            const fullStars = Math.floor(rating);
            const halfStar = rating % 1 >= 0.5;
            const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
            
            let starsHtml = '';
            
            // Full stars
            for (let i = 0; i < fullStars; i++) {
                starsHtml += '<span class="gr-star gr-star-full">★</span>';
            }
            
            // Half star
            if (halfStar) {
                starsHtml += '<span class="gr-star gr-star-half">★</span>';
            }
            
            // Empty stars
            for (let i = 0; i < emptyStars; i++) {
                starsHtml += '<span class="gr-star gr-star-empty">☆</span>';
            }
            
            return starsHtml;
        }

        /**
         * Render the footer with attribution
         * @returns {string} Footer HTML
         */
        renderFooter() {
            return `
                <div class="gr-footer">
                    <a href="https://www.google.com/maps/place/?q=place_id:${this.config.placeId}" 
                       target="_blank" rel="noopener noreferrer" class="gr-attribution">
                        Powered by Google Reviews
                    </a>
                </div>
            `;
        }

        /**
         * Initialize interactivity for carousel
         */
        initInteractivity() {
            if (this.config.displayMode !== 'carousel') return;
            
            const container = document.getElementById(this.config.widgetId);
            if (!container) return;
            
            const prevBtn = container.querySelector('.gr-prev');
            const nextBtn = container.querySelector('.gr-next');
            const dots = container.querySelectorAll('.gr-dot');
            
            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    this.showPreviousReview();
                });
            }
            
            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    this.showNextReview();
                });
            }
            
            dots.forEach(dot => {
                dot.addEventListener('click', (e) => {
                    const index = parseInt(e.target.dataset.index, 10);
                    this.showReview(index);
                });
            });
            
            // Set up autoplay if enabled
            if (this.config.autoplaySpeed > 0) {
                this.startAutoplay();
                
                // Pause autoplay on hover
                container.addEventListener('mouseenter', () => {
                    this.stopAutoplay();
                });
                
                container.addEventListener('mouseleave', () => {
                    this.startAutoplay();
                });
            }
        }

        /**
         * Show a specific review in carousel
         * @param {number} index - Review index
         */
        showReview(index) {
            const container = document.getElementById(this.config.widgetId);
            if (!container) return;
            
            const reviews = container.querySelectorAll('.gr-review');
            const dots = container.querySelectorAll('.gr-dot');
            
            // Update current index
            this.currentIndex = index;
            
            // Show only the current review
            reviews.forEach((review, i) => {
                review.classList.toggle('gr-active', i === index);
            });
            
            // Update active dot
            dots.forEach((dot, i) => {
                dot.classList.toggle('gr-active', i === index);
            });
        }

        /**
         * Show the next review in carousel
         */
        showNextReview() {
            const nextIndex = (this.currentIndex + 1) % this.reviews.length;
            this.showReview(nextIndex);
        }

        /**
         * Show the previous review in carousel
         */
        showPreviousReview() {
            const prevIndex = (this.currentIndex - 1 + this.reviews.length) % this.reviews.length;
            this.showReview(prevIndex);
        }

        /**
         * Start autoplay for carousel
         */
        startAutoplay() {
            if (this.reviewsInterval) {
                clearInterval(this.reviewsInterval);
            }
            
            this.reviewsInterval = setInterval(() => {
                this.showNextReview();
            }, this.config.autoplaySpeed);
        }

        /**
         * Stop autoplay for carousel
         */
        stopAutoplay() {
            if (this.reviewsInterval) {
                clearInterval(this.reviewsInterval);
                this.reviewsInterval = null;
            }
        }

        /**
         * Inject CSS styles for the widget
         */
        injectStyles() {
            if (document.getElementById('gr-widget-styles')) return;
            
            const styleEl = document.createElement('style');
            styleEl.id = 'gr-widget-styles';
            styleEl.textContent = this.getStyles();
            document.head.appendChild(styleEl);
            
            // Add custom styles if provided
            if (this.config.customStyles) {
                const customStyleEl = document.createElement('style');
                customStyleEl.id = 'gr-widget-custom-styles';
                customStyleEl.textContent = this.config.customStyles;
                document.head.appendChild(customStyleEl);
            }
        }

        /**
         * Get the default CSS styles for the widget
         * @returns {string} CSS styles
         */
        getStyles() {
            return `
                .gr-widget-container {
                    --gr-primary-color: #4285F4;
                    --gr-text-color: #333;
                    --gr-bg-color: #fff;
                    --gr-border-color: #e0e0e0;
                    --gr-star-color: #F9AB00;
                    --gr-card-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    --gr-border-radius: 8px;
                    
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    color: var(--gr-text-color);
                    background: var(--gr-bg-color);
                    padding: 16px;
                    border-radius: var(--gr-border-radius);
                    border: 1px solid var(--gr-border-color);
                    max-width: 100%;
                    box-sizing: border-box;
                }

                .gr-theme-dark {
                    --gr-text-color: #f0f0f0;
                    --gr-bg-color: #2c2c2c;
                    --gr-border-color: #444;
                }

                .gr-loading, .gr-error, .gr-no-reviews {
                    text-align: center;
                    padding: 20px;
                }

                .gr-loading-spinner {
                    border: 3px solid rgba(0,0,0,0.1);
                    border-top: 3px solid var(--gr-primary-color);
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    margin: 0 auto 10px;
                    animation: gr-spin 1s linear infinite;
                }

                @keyframes gr-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .gr-header {
                    margin-bottom: 16px;
                    text-align: center;
                }

                .gr-business-name {
                    margin: 0 0 8px;
                    font-size: 1.2em;
                }

                .gr-overall {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }

                .gr-rating-text {
                    font-size: 0.9em;
                }

                /* Star styles */
                .gr-stars {
                    display: inline-flex;
                }

                .gr-star {
                    color: var(--gr-star-color);
                    margin-right: 2px;
                    font-size: 1.2em;
                    line-height: 1;
                }

                .gr-star-half {
                    position: relative;
                    overflow: hidden;
                }

                .gr-star-empty {
                    opacity: 0.5;
                }

                /* Review card styles */
                .gr-review {
                    background: var(--gr-bg-color);
                    border: 1px solid var(--gr-border-color);
                    border-radius: var(--gr-border-radius);
                    padding: 16px;
                    margin-bottom: 16px;
                    box-shadow: var(--gr-card-shadow);
                }

                .gr-review-header {
                    display: flex;
                    align-items: center;
                    margin-bottom: 8px;
                }

                .gr-author-img, .gr-author-initial {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    margin-right: 10px;
                    overflow: hidden;
                }

                .gr-author-img img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .gr-author-initial {
                    background: var(--gr-primary-color);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                }

                .gr-author-info {
                    flex: 1;
                }

                .gr-author-name {
                    font-weight: bold;
                    margin-bottom: 2px;
                }

                .gr-review-date {
                    font-size: 0.8em;
                    opacity: 0.8;
                }

                .gr-review-rating {
                    margin: 8px 0;
                }

                .gr-review-text {
                    font-size: 0.95em;
                    line-height: 1.5;
                }

                /* Carousel styles */
                .gr-carousel {
                    position: relative;
                }

                .gr-carousel-container {
                    position: relative;
                    min-height: 180px;
                }

                .gr-carousel .gr-review {
                    display: none;
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .gr-carousel .gr-review.gr-active {
                    display: block;
                    opacity: 1;
                    position: relative;
                }

                .gr-controls {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin-top: 16px;
                }

                .gr-prev, .gr-next {
                    background: var(--gr-primary-color);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    font-size: 20px;
                    line-height: 1;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0;
                }

                .gr-dots {
                    display: flex;
                    justify-content: center;
                    margin: 0 10px;
                }

                .gr-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: var(--gr-border-color);
                    margin: 0 5px;
                    padding: 0;
                    border: none;
                    cursor: pointer;
                    transition: background-color 0.3s;
                }

                .gr-dot.gr-active {
                    background: var(--gr-primary-color);
                }

                /* Grid styles */
                .gr-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 16px;
                }

                /* List styles */
                .gr-list .gr-review {
                    margin-bottom: 16px;
                }

                /* Footer styles */
                .gr-footer {
                    text-align: center;
                    margin-top: 16px;
                    font-size: 0.8em;
                }

                .gr-attribution {
                    color: var(--gr-text-color);
                    opacity: 0.8;
                    text-decoration: none;
                }

                .gr-attribution:hover {
                    text-decoration: underline;
                    opacity: 1;
                }

                /* Responsive styles */
                @media (max-width: 480px) {
                    .gr-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .gr-author-name, .gr-review-text {
                        font-size: 0.9em;
                    }
                }
            `;
        }
    }

    /**
     * Parse configuration from data attributes
     * @param {Element} element - Script element
     * @returns {Object} Configuration object
     */
    function parseDataAttributes(element) {
        if (!element) return {};
        
        const config = {};
        const prefix = 'data-gr-';
        
        for (const attr of element.attributes) {
            if (attr.name.startsWith(prefix)) {
                const key = attr.name.substring(prefix.length).replace(/-([a-z])/g, 
                    (match, letter) => letter.toUpperCase());
                
                if (attr.value === 'true') {
                    config[key] = true;
                } else if (attr.value === 'false') {
                    config[key] = false;
                } else if (!isNaN(attr.value) && attr.value.trim() !== '') {
                    config[key] = Number(attr.value);
                } else {
                    config[key] = attr.value;
                }
            }
        }
        
        return config;
    }

    /**
     * Initialize the widget
     */
    function init() {
        // Get config from the script tag's data attributes
        const scriptConfig = parseDataAttributes(currentScript);
        
        // Get config from global object if available
        const globalConfig = window.__grConfig || {};
        
        // Merge configs, with priority: data attributes > global > default
        const config = { ...globalConfig, ...scriptConfig };
        
        // Create widget instance
        const widget = new GoogleReviewsWidget(config);
        
        // Find target element(s)
        const targetSelector = config.target || '.gr-widget';
        const targets = document.querySelectorAll(targetSelector);
        
        if (targets.length === 0) {
            // If no targets found, create one
            const target = document.createElement('div');
            target.className = 'gr-widget';
            document.body.appendChild(target);
            widget.init(target);
        } else {
            // Initialize each target found
            targets.forEach(target => {
                // Create a new instance for each target with merged configs
                const targetConfig = { ...config, ...parseDataAttributes(target) };
                const targetWidget = new GoogleReviewsWidget(targetConfig);
                targetWidget.init(target);
            });
        }
        
        // Store widget in global scope for API access
        window.GoogleReviewsWidget = widget;
    }

    // Check if the DOM is already loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM is already loaded
        init();
    }
})();
