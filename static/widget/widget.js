// widget.js - the main loader script
(function (window, document) {
	// Configuration from global variable or data attributes
	window.__gr = window.__gr || {};

	// Core widget class
	class GoogleReviewsWidget {
		constructor(config) {
			this.config = {
				apiKey: config.apiKey || null,
				theme: config.theme || 'light',
				displayMode: config.displayMode || 'carousel',
				target: config.target || null,
				maxReviews: config.maxReviews || 5,
				minRating: config.minRating || 0,
				...config,
			};

			this.initialized = false;
		}

		async init() {
			if (this.initialized) return;

			try {
				console.log('Initializing Google Reviews Widget');

				// Create container if target specified
				if (this.config.target) {
					console.log('Looking for target element:', this.config.target);
					this.container = document.querySelector(this.config.target);
					if (!this.container) {
						console.error(
							`GoogleReviews: Target element "${this.config.target}" not found`,
						);
						return;
					}
				} else {
					// First check for gr-widget class with data attributes
					const grWidgets = document.querySelectorAll('.gr-widget');
					console.log(
						'Found',
						grWidgets.length,
						'elements with gr-widget class',
					);

					if (grWidgets.length > 0) {
						this.container = grWidgets[0];

						// Get configuration from data attributes
						if (!this.config.apiKey) {
							this.config.apiKey =
								this.container.getAttribute('data-gr-api-key');
						}
						this.config.placeId =
							this.container.getAttribute('data-gr-place-id') ||
							this.config.placeId;
						this.config.theme =
							this.container.getAttribute('data-gr-theme') || this.config.theme;
						this.config.displayMode =
							this.container.getAttribute('data-gr-display-mode') ||
							this.config.displayMode;
						this.config.maxReviews = parseInt(
							this.container.getAttribute('data-gr-max-reviews') ||
								this.config.maxReviews,
							10,
						);
						this.config.minRating = parseInt(
							this.container.getAttribute('data-gr-min-rating') ||
								this.config.minRating,
							10,
						);

						console.log('Found gr-widget with config:', {
							apiKey: this.config.apiKey,
							placeId: this.config.placeId,
							theme: this.config.theme,
							displayMode: this.config.displayMode,
							maxReviews: this.config.maxReviews,
							minRating: this.config.minRating,
						});
					} else {
						// Otherwise, look for legacy data-googlereviews attributes
						const containers = document.querySelectorAll(
							'[data-googlereviews]',
						);
						console.log(
							'Found',
							containers.length,
							'elements with data-googlereviews attribute',
						);

						if (containers.length === 0) {
							console.error('GoogleReviews: No container elements found');
							return;
						}
						this.container = containers[0];

						// Get config from data attributes if not set
						if (!this.config.apiKey) {
							this.config.apiKey =
								this.container.getAttribute('data-googlereviews');
						}

						this.config.theme =
							this.container.getAttribute('data-theme') || this.config.theme;
						this.config.displayMode =
							this.container.getAttribute('data-display') ||
							this.config.displayMode;
						this.config.maxReviews = parseInt(
							this.container.getAttribute('data-max-reviews') ||
								this.config.maxReviews,
							10,
						);
						this.config.minRating = parseInt(
							this.container.getAttribute('data-min-rating') ||
								this.config.minRating,
							10,
						);
					}
				}

				// Show loading state
				this.showLoading();

				// Fetch widget data and reviews
				const widgetData = await this.fetchWidgetData();

				// Render the widget
				this.render(widgetData);

				this.initialized = true;

				// Set up event listeners
				this.setupEventListeners();
			} catch (error) {
				this.showError(error);
			}
		}

		async fetchWidgetData() {
			if (!this.config.apiKey) {
				throw new Error('GoogleReviews: API key is required');
			}

			// Get base URL from script source or fall back to window.location.origin
			const baseUrl = this.getBaseUrl();

			// Add place ID to query if available
			let queryParams = `apiKey=${this.config.apiKey}`;
			if (this.config.placeId) {
				queryParams += `&placeId=${this.config.placeId}`;
			}

			const url = `${baseUrl}/api/reviews/widget?${queryParams}`;
			console.log('Fetching widget data from:', url);

			try {
				// Update debug status if element exists
				const debugStatus = document.getElementById('widget-debug-status');
				if (debugStatus) {
					debugStatus.textContent = `Widget status: Fetching from ${url}`;
				}

				const response = await fetch(url);
				console.log('API response status:', response.status);

				if (!response.ok) {
					// Try to get error details from response
					const errorText = await response.text();
					console.error(`API error (${response.status}):`, errorText);

					if (debugStatus) {
						debugStatus.textContent = `Error ${response.status}: ${errorText.substring(0, 100)}`;
					}

					throw new Error(
						`GoogleReviews: Failed to load widget data (${response.status}): ${errorText}`,
					);
				}

				const data = await response.json();
				console.log('Widget data received:', data);

				if (debugStatus) {
					debugStatus.textContent = 'Widget status: Data received successfully';
				}

				return data;
			} catch (error) {
				console.error('Error fetching widget data:', error);

				// Update debug status if element exists
				const debugStatus = document.getElementById('widget-debug-status');
				if (debugStatus) {
					debugStatus.textContent = `Error: ${error.message}`;
				}

				throw error;
			}
		}

		showLoading() {
			this.container.innerHTML = `
          <div class="gr-loading">
            <div class="gr-spinner"></div>
            <p>Loading reviews...</p>
          </div>
        `;

			// Add base styles
			this.addStyles();
		}

		showError(error) {
			console.error('GoogleReviews widget error:', error);

			this.container.innerHTML = `
          <div class="gr-error">
            <p>Sorry, we couldn't load the reviews at this time.</p>
          </div>
        `;

			// Add base styles
			this.addStyles();
		}

		addStyles() {
			// Only add styles once
			if (document.getElementById('gr-styles')) return;

			const style = document.createElement('style');
			style.id = 'gr-styles';
			style.textContent = `
          .gr-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
            text-align: center;
          }
          
          .gr-spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #3498db;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: gr-spin 1s linear infinite;
            margin-bottom: 10px;
          }
          
          @keyframes gr-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .gr-error {
            padding: 15px;
            color: #721c24;
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            border-radius: 4px;
          }
          
          /* Base widget styles */
          .gr-widget {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.5;
            color: #333;
            background-color: #fff;
            max-width: 100%;
          }
          
          .gr-widget.theme-dark {
            color: #f5f5f5;
            background-color: #222;
          }
          
          /* Review item styling */
          .gr-review-item {
            background-color: #f9f9f9;
            color: #333;
            padding: 12px;
            margin: 8px 0;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          
          .gr-widget.theme-dark .gr-review-item {
            background-color: #333;
            color: #f5f5f5;
            box-shadow: 0 1px 3px rgba(0,0,0,0.5);
          }
          
          /* Additional widget styles based on display mode */
          .gr-carousel {
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
          }
          
          .gr-carousel .gr-review {
            scroll-snap-align: start;
            flex-shrink: 0;
            width: 300px;
            margin-right: 16px;
            border-radius: 8px;
            overflow: hidden;
          }
          
          .gr-list .gr-review {
            margin-bottom: 16px;
            padding: 16px;
            border-radius: 8px;
          }
          
          .gr-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 16px;
          }
        `;

			document.head.appendChild(style);
		}

		render(data) {
			const { reviews, placeData } = data;

			// Filter reviews by rating if needed
			const filteredReviews = reviews.filter(
				(review) => review.rating >= this.config.minRating,
			);

			// Limit number of reviews
			const limitedReviews = filteredReviews.slice(0, this.config.maxReviews);

			// Prepare container
			this.container.innerHTML = '';
			this.container.className = `gr-widget mode-${this.config.displayMode} theme-${this.config.theme}`;

			// Add header
			const header = document.createElement('div');
			header.className = 'gr-header';
			header.innerHTML = `
          <div class="gr-business-info">
            <h3>${placeData.name}</h3>
            <div class="gr-rating">
              <div class="gr-stars" style="--rating: ${placeData.rating};"></div>
              <span>${placeData.rating.toFixed(1)} stars from ${placeData.user_ratings_total} reviews</span>
            </div>
          </div>
        `;
			this.container.appendChild(header);

			// Create reviews container based on display mode
			const reviewsContainer = document.createElement('div');
			reviewsContainer.className = `gr-${this.config.displayMode}`;

			// Add reviews
			limitedReviews.forEach((review) => {
				const reviewEl = document.createElement('div');
				reviewEl.className = 'gr-review';
				reviewEl.innerHTML = `
            <div class="gr-review-header">
              <img 
                src="${review.profile_photo_url || 'https://your-api.example.com/default-profile.png'}" 
                alt="${review.author_name}" 
                class="gr-author-image"
              />
              <div class="gr-reviewer-info">
                <h4>${review.author_name}</h4>
                <div class="gr-stars" style="--rating: ${review.rating};"></div>
                <span class="gr-time">${this.formatDate(review.time)}</span>
              </div>
            </div>
            <div class="gr-review-content">
              <p>${review.text}</p>
            </div>
          `;
				reviewsContainer.appendChild(reviewEl);
			});

			this.container.appendChild(reviewsContainer);

			// Add footer with attribution
			const footer = document.createElement('div');
			footer.className = 'gr-footer';
			footer.innerHTML = `
          <a href="${placeData.url}" target="_blank" rel="noopener noreferrer">
            See all reviews on Google
          </a>
          <div class="gr-powered-by">
            Powered by <a href="https://your-site.example.com" target="_blank">GoogleReviews</a>
          </div>
        `;
			this.container.appendChild(footer);
		}

		formatDate(timestamp) {
			const date = new Date(timestamp * 1000);
			return date.toLocaleDateString(undefined, {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
			});
		}

		// Helper method to get the base URL from the script's location
		getBaseUrl() {
			// Try to get the base URL from the script source
			const scripts = document.getElementsByTagName('script');
			console.log('Looking for widget script among', scripts.length, 'scripts');

			for (let i = 0; i < scripts.length; i++) {
				const src = scripts[i].src;
				if (
					src &&
					(src.includes('widget.js') || src.includes('widget.min.js'))
				) {
					const url = new URL(src);
					console.log('Found widget script at:', src);
					console.log('Using base URL:', `${url.protocol}//${url.host}`);
					return `${url.protocol}//${url.host}`;
				}
			}

			// Special case for local development with demo.html
			if (
				window.location.pathname.includes('/widget/demo.html') ||
				window.location.pathname.includes('/src/widget/demo.html')
			) {
				console.log('Detected demo environment, using localhost:5173');
				return 'http://localhost:5173';
			}

			// Fallback to current page origin
			console.log('Falling back to page origin:', window.location.origin);
			return window.location.origin;
		}

		setupEventListeners() {
			// Navigation for carousel mode
			if (this.config.displayMode === 'carousel') {
				const carousel = this.container.querySelector('.gr-carousel');
				if (!carousel) return;

				// Add navigation buttons
				const navPrev = document.createElement('button');
				navPrev.className = 'gr-nav gr-prev';
				navPrev.innerHTML = '&lsaquo;';
				navPrev.addEventListener('click', () => {
					carousel.scrollBy({ left: -330, behavior: 'smooth' });
				});

				const navNext = document.createElement('button');
				navNext.className = 'gr-nav gr-next';
				navNext.innerHTML = '&rsaquo;';
				navNext.addEventListener('click', () => {
					carousel.scrollBy({ left: 330, behavior: 'smooth' });
				});

				this.container.appendChild(navPrev);
				this.container.appendChild(navNext);
			}
		}

		// Public API methods
		call(method, ...args) {
			switch (method) {
				case 'refresh':
					this.init();
					break;
				case 'setTheme':
					this.config.theme = args[0];
					this.container.className = `gr-widget mode-${this.config.displayMode} theme-${this.config.theme}`;
					break;
				case 'setDisplayMode':
					this.config.displayMode = args[0];
					// Requires full re-render
					this.init();
					break;
				default:
					console.error(`GoogleReviews: Unknown method "${method}"`);
			}
		}
	}

	// Initialize the global object
	window.GoogleReviews = window.GoogleReviews || {
		init: function () {
			const widget = new GoogleReviewsWidget(window.__gr);
			window.GoogleReviews.instance = widget;

			widget.init();
		},
		call: function (method, ...args) {
			if (!window.GoogleReviews.instance) {
				console.error(
					'GoogleReviews: Widget not initialized. Call GoogleReviews.init() first.',
				);
				return;
			}
			window.GoogleReviews.instance.call(method, ...args);
		},
	};

	// Auto initialize if not async
	if (!window.__gr.asyncInit) {
		window.GoogleReviews.init();
	}
})(window, document);
