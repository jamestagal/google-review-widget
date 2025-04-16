<script lang="ts">
    import { onMount, afterUpdate } from 'svelte';
    import { browser } from '$app/environment';
    import type { WidgetPreviewConfig } from '$lib/types/widget-preview.types';
    
    // Accept widget configuration as a prop
    export let config: WidgetPreviewConfig = {
        placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4', // Default sample place ID
        displayMode: 'carousel',
        theme: 'light',
        maxReviews: 3,
        minRating: 0,
        showRatings: true,
        showDates: true,
        showPhotos: true,
        autoplaySpeed: 5000,
        colors: {
            background: '#ffffff',
            text: '#333333',
            stars: '#FFD700',
            links: '#0070f3',
            buttons: '#0070f3',
            border: '#e5e7eb',
            shadow: 'rgba(0, 0, 0, 0.1)'
        },
        fonts: {
            family: 'system-ui, -apple-system, sans-serif',
            titleSize: '18px',
            textSize: '14px',
            weight: 'normal'
        },
        layout: {
            padding: '16px',
            borderRadius: '8px',
            spacing: '16px',
            maxHeight: '600px',
            width: '100%'
        },
        sortBy: 'newest', // Add sortBy configuration
        maxReviewAge: 0 // Add maxReviewAge configuration
    };
    
    // Store business details if provided
    export let businessName = '';
    
    // Sample review data for preview - make it reactive to config changes
    $: sampleData = {
        businessName: businessName || 'Sample Business',
        rating: 4.7,
        totalReviews: 142,
        reviews: [
            {
                authorName: 'John Smith',
                authorPhotoUrl: 'https://ui-avatars.com/api/?name=John+Smith&background=0D8ABC&color=fff',
                rating: 5,
                text: 'Absolutely love this place! The service is excellent and the staff are always friendly. Would highly recommend to anyone looking for quality service.',
                relativeTime: '2 weeks ago',
                timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).getTime() // 2 weeks ago
            },
            {
                authorName: 'Emma Johnson',
                authorPhotoUrl: 'https://ui-avatars.com/api/?name=Emma+Johnson&background=FF5722&color=fff',
                rating: 4,
                text: 'Great experience overall. Had a minor issue with my order but the staff resolved it quickly and professionally. Would visit again.',
                relativeTime: '1 month ago',
                timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).getTime() // 1 month ago
            },
            {
                authorName: 'Michael Brown',
                authorPhotoUrl: 'https://ui-avatars.com/api/?name=Michael+Brown&background=4CAF50&color=fff',
                rating: 5,
                text: 'Top notch service and quality. This place exceeds expectations every time I visit. The attention to detail is remarkable.',
                relativeTime: '3 months ago',
                timestamp: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).getTime() // 3 months ago
            },
            {
                authorName: 'Sarah Wilson',
                authorPhotoUrl: 'https://ui-avatars.com/api/?name=Sarah+Wilson&background=9C27B0&color=fff',
                rating: 4,
                text: 'Very satisfied with my experience. The only reason I\'m not giving 5 stars is because of the wait time, but everything else was perfect.',
                relativeTime: '2 months ago',
                timestamp: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).getTime() // 2 months ago
            },
            {
                authorName: 'David Lee',
                authorPhotoUrl: 'https://ui-avatars.com/api/?name=David+Lee&background=3F51B5&color=fff',
                rating: 3,
                text: 'Decent service but room for improvement. The product quality is good but customer service could be better.',
                relativeTime: '1 week ago',
                timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime() // 1 week ago
            }
        ]
    };
    
    // Track component initialization state
    let isInitialized = false;
    let styleTag: HTMLStyleElement | null = null;
    
    // Apply filtering and sorting based on configuration
    $: filteredReviews = sampleData.reviews
        // Filter by minimum rating
        .filter(review => review.rating >= config.minRating)
        // Filter by maximum age if specified
        .filter(review => {
            if (!config.maxReviewAge) return true;
            const maxAgeMs = config.maxReviewAge * 24 * 60 * 60 * 1000;
            return (Date.now() - review.timestamp) <= maxAgeMs;
        })
        // Sort based on sortBy configuration
        .sort((a, b) => {
            if (config.sortBy === 'newest') {
                return b.timestamp - a.timestamp; // Newest first
            } else if (config.sortBy === 'highest') {
                return b.rating - a.rating || b.timestamp - a.timestamp; // Highest rating first, then newest
            } else if (config.sortBy === 'lowest') {
                return a.rating - b.rating || b.timestamp - a.timestamp; // Lowest rating first, then newest
            }
            return b.timestamp - a.timestamp; // Default to newest
        })
        // Limit to maximum number of reviews
        .slice(0, config.maxReviews);
    
    // Apply styles when component mounts and when config changes
    onMount(() => {
        if (browser) {
            // Defer style application to next tick to improve initial loading
            setTimeout(() => {
                applyStyles();
                isInitialized = true;
            }, 0);
        }
        
        return () => {
            // Cleanup function to remove styles when component unmounts
            if (styleTag && browser) {
                styleTag.remove();
            }
        };
    });
    
    // Only update styles after initial mount to avoid unnecessary work during SSR
    afterUpdate(() => {
        if (browser && isInitialized) {
            applyStyles();
        }
    });
    
    function applyStyles() {
        // Remove old style tag if it exists
        if (styleTag) {
            styleTag.remove();
        }
        
        // Add widget styles dynamically
        styleTag = document.createElement('style');
        styleTag.textContent = generateWidgetStyles(config);
        document.head.appendChild(styleTag);
    }
    
    function generateWidgetStyles(config: WidgetPreviewConfig): string {
        // Use default values if appearance settings are not provided
        const colors = config.colors || {
            background: '#ffffff',
            text: '#333333',
            stars: '#FFD700',
            links: '#0070f3',
            buttons: '#0070f3',
            border: '#e5e7eb',
            shadow: 'rgba(0, 0, 0, 0.1)'
        };
        
        const fonts = config.fonts || {
            family: 'system-ui, -apple-system, sans-serif',
            titleSize: '18px',
            textSize: '14px',
            weight: 'normal'
        };
        
        const layout = config.layout || {
            padding: '16px',
            borderRadius: '8px',
            spacing: '16px',
            maxHeight: '600px',
            width: '100%'
        };
        
        return `
            .gr-widget-container {
                font-family: ${fonts.family};
                max-width: ${layout.width};
                border-radius: ${layout.borderRadius};
                overflow: hidden;
                box-shadow: 0 2px 8px ${colors.shadow};
                background-color: ${config.theme === 'dark' ? '#333' : colors.background};
                color: ${config.theme === 'dark' ? '#fff' : colors.text};
                padding: ${layout.padding};
                border: 1px solid ${colors.border};
            }
            
            .gr-header {
                margin-bottom: ${layout.spacing};
                padding-bottom: ${layout.spacing};
                border-bottom: 1px solid ${config.theme === 'dark' ? '#444' : colors.border};
            }
            
            .gr-business-name {
                font-size: ${fonts.titleSize};
                font-weight: ${fonts.weight === 'bold' ? 'bold' : 'normal'};
                margin: 0 0 8px 0;
            }
            
            .gr-rating-summary {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .gr-stars {
                display: flex;
                align-items: center;
            }
            
            .gr-star {
                color: ${colors.stars};
                margin-right: 2px;
            }
            
            .gr-star-empty {
                color: ${config.theme === 'dark' ? '#555' : '#ddd'};
            }
            
            .gr-carousel {
                position: relative;
                max-height: ${layout.maxHeight};
                overflow: hidden;
            }
            
            .gr-carousel-container {
                overflow: hidden;
            }
            
            .gr-review {
                padding: ${layout.spacing};
                border-bottom: 1px solid ${config.theme === 'dark' ? '#444' : colors.border};
                margin-bottom: ${layout.spacing};
            }
            
            .gr-review-header {
                display: flex;
                align-items: flex-start;
                margin-bottom: 8px;
            }
            
            .gr-author-photo {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                margin-right: 12px;
                object-fit: cover;
            }
            
            .gr-review-meta {
                flex: 1;
            }
            
            .gr-author-name {
                font-weight: ${fonts.weight === 'bold' ? 'bold' : '500'};
                margin-bottom: 2px;
            }
            
            .gr-review-date {
                font-size: 12px;
                color: ${config.theme === 'dark' ? '#aaa' : '#666'};
                margin-bottom: 4px;
            }
            
            .gr-review-text {
                font-size: ${fonts.textSize};
                line-height: 1.5;
            }
            
            .gr-controls {
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 12px;
            }
            
            .gr-prev, .gr-next {
                background: none;
                border: none;
                font-size: 24px;
                color: ${config.theme === 'dark' ? '#fff' : colors.buttons};
                cursor: pointer;
                padding: 4px 8px;
                border-radius: 4px;
            }
            
            .gr-prev:hover, .gr-next:hover {
                background-color: ${config.theme === 'dark' ? '#444' : '#f0f0f0'};
            }
            
            .gr-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: ${layout.spacing};
                max-height: ${layout.maxHeight};
                overflow-y: auto;
            }
            
            .gr-list {
                display: flex;
                flex-direction: column;
                gap: ${layout.spacing};
                max-height: ${layout.maxHeight};
                overflow-y: auto;
                padding: ${layout.spacing};
            }
            
            .gr-list .gr-review {
                margin-bottom: ${layout.spacing};
                border: 1px solid ${colors.border};
                border-radius: 4px;
            }
            
            /* Badge style */
            .gr-badge {
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                padding: ${layout.spacing};
                border-radius: ${layout.borderRadius};
                border: 1px solid ${colors.border};
                max-width: 200px;
            }
            
            .gr-badge .gr-business-name {
                font-size: 16px;
                margin-bottom: 8px;
            }
            
            .gr-badge .gr-stars {
                margin-bottom: 8px;
                font-size: 20px;
            }
            
            .gr-badge .gr-rating-summary {
                flex-direction: column;
            }
            
            /* Slider style */
            .gr-slider {
                position: relative;
                overflow: hidden;
                max-height: ${layout.maxHeight};
            }
            
            .gr-slider .gr-review {
                padding: 20px;
                text-align: center;
            }
            
            /* Floating badge style */
            .gr-floating-badge {
                position: relative;
                bottom: 20px;
                right: 20px;
                max-width: 180px;
                border-radius: ${layout.borderRadius};
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                padding: 12px;
                background-color: ${config.theme === 'dark' ? '#333' : colors.background};
                border: 1px solid ${colors.border};
            }
            
            /* Review wall style */
            .gr-wall {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 10px;
                max-height: ${layout.maxHeight};
                overflow-y: auto;
            }
            
            .gr-wall .gr-review {
                height: 100%;
                border-radius: 4px;
                border: 1px solid ${colors.border};
                padding: 12px;
                display: flex;
                flex-direction: column;
            }
            
            .gr-footer {
                padding: 12px 16px;
                font-size: 12px;
                text-align: center;
                border-top: 1px solid ${config.theme === 'dark' ? '#444' : colors.border};
                color: ${config.theme === 'dark' ? '#aaa' : '#666'};
                margin-top: ${layout.spacing};
            }
            
            .gr-powered-by a {
                color: ${config.theme === 'dark' ? '#4dabf7' : colors.links};
                text-decoration: none;
            }
        `;
    }
    
    // Helper function to calculate star ratings
    function getStars(rating: number): { full: number; half: boolean; empty: number; } {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        
        return { full: fullStars, half: halfStar, empty: emptyStars };
    }
</script>

<div class="gr-widget-container gr-theme-{config.theme}">
    <!-- Header with business info -->
    <div class="gr-header">
        <h3 class="gr-business-name">{sampleData.businessName}</h3>
        <div class="gr-rating-summary">
            <div class="gr-stars">
                {#each Array(getStars(sampleData.rating).full) as _}
                    <span class="gr-star gr-star-full">★</span>
                {/each}
                
                {#if getStars(sampleData.rating).half}
                    <span class="gr-star gr-star-half">★</span>
                {/if}
                
                {#each Array(getStars(sampleData.rating).empty) as _}
                    <span class="gr-star gr-star-empty">☆</span>
                {/each}
            </div>
            <div class="gr-rating-text">
                {sampleData.rating.toFixed(1)} / 5 from {sampleData.totalReviews} review{sampleData.totalReviews !== 1 ? 's' : ''}
            </div>
        </div>
    </div>
    
    <!-- Reviews display based on selected mode -->
    {#if config.displayMode === 'carousel'}
        <div class="gr-carousel">
            <div class="gr-carousel-container">
                {#each filteredReviews as review, index}
                    <div class="gr-review" class:gr-active={index === 0} data-index={index}>
                        <div class="gr-review-header">
                            {#if config.showPhotos && review.authorPhotoUrl}
                                <img src={review.authorPhotoUrl} alt={review.authorName} class="gr-author-photo">
                            {/if}
                            <div class="gr-review-meta">
                                <div class="gr-author-name">{review.authorName}</div>
                                {#if config.showDates}
                                    <div class="gr-review-date">{review.relativeTime}</div>
                                {/if}
                                {#if config.showRatings}
                                    <div class="gr-stars">
                                        {#each Array(getStars(review.rating).full) as _}
                                            <span class="gr-star gr-star-full">★</span>
                                        {/each}
                                        
                                        {#if getStars(review.rating).half}
                                            <span class="gr-star gr-star-half">★</span>
                                        {/if}
                                        
                                        {#each Array(getStars(review.rating).empty) as _}
                                            <span class="gr-star gr-star-empty">☆</span>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        </div>
                        <div class="gr-review-text">{review.text}</div>
                    </div>
                {/each}
            </div>
            <div class="gr-controls">
                <button class="gr-prev" aria-label="Previous review">‹</button>
                <div class="gr-dots">
                    {#each filteredReviews as _, i}
                        <button class="gr-dot{i === 0 ? ' gr-active' : ''}" 
                                data-index={i} aria-label="Go to review {i+1}"></button>
                    {/each}
                </div>
                <button class="gr-next" aria-label="Next review">›</button>
            </div>
        </div>
    {:else if config.displayMode === 'grid'}
        <div class="gr-grid">
            {#each filteredReviews as review}
                <div class="gr-review">
                    <div class="gr-review-header">
                        {#if config.showPhotos && review.authorPhotoUrl}
                            <img src={review.authorPhotoUrl} alt={review.authorName} class="gr-author-photo">
                        {/if}
                        <div class="gr-review-meta">
                            <div class="gr-author-name">{review.authorName}</div>
                            {#if config.showDates}
                                <div class="gr-review-date">{review.relativeTime}</div>
                            {/if}
                            {#if config.showRatings}
                                <div class="gr-stars">
                                    {#each Array(getStars(review.rating).full) as _}
                                        <span class="gr-star gr-star-full">★</span>
                                    {/each}
                                    
                                    {#if getStars(review.rating).half}
                                        <span class="gr-star gr-star-half">★</span>
                                    {/if}
                                    
                                    {#each Array(getStars(review.rating).empty) as _}
                                        <span class="gr-star gr-star-empty">☆</span>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    </div>
                    
                    <div class="gr-review-text">{review.text}</div>
                </div>
            {/each}
        </div>
    {:else if config.displayMode === 'list'}
        <div class="gr-list">
            {#each filteredReviews as review}
                <div class="gr-review">
                    <div class="gr-review-header">
                        {#if config.showPhotos && review.authorPhotoUrl}
                            <img src={review.authorPhotoUrl} alt={review.authorName} class="gr-author-photo">
                        {/if}
                        <div class="gr-review-meta">
                            <div class="gr-author-name">{review.authorName}</div>
                            {#if config.showDates}
                                <div class="gr-review-date">{review.relativeTime}</div>
                            {/if}
                            {#if config.showRatings}
                                <div class="gr-stars">
                                    {#each Array(getStars(review.rating).full) as _}
                                        <span class="gr-star gr-star-full">★</span>
                                    {/each}
                                    
                                    {#if getStars(review.rating).half}
                                        <span class="gr-star gr-star-half">★</span>
                                    {/if}
                                    
                                    {#each Array(getStars(review.rating).empty) as _}
                                        <span class="gr-star gr-star-empty">☆</span>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    </div>
                    <div class="gr-review-text">{review.text}</div>
                </div>
            {/each}
        </div>
    {:else if config.displayMode === 'badge'}
        <div class="gr-badge">
            <h3 class="gr-business-name">{sampleData.businessName}</h3>
            <div class="gr-rating-summary">
                <div class="gr-stars">
                    {#each Array(getStars(sampleData.rating).full) as _}
                        <span class="gr-star gr-star-full">★</span>
                    {/each}
                    
                    {#if getStars(sampleData.rating).half}
                        <span class="gr-star gr-star-half">★</span>
                    {/if}
                    
                    {#each Array(getStars(sampleData.rating).empty) as _}
                        <span class="gr-star gr-star-empty">☆</span>
                    {/each}
                </div>
                <div class="gr-rating-text">
                    {sampleData.rating.toFixed(1)} / 5 from {sampleData.totalReviews} review{sampleData.totalReviews !== 1 ? 's' : ''}
                </div>
            </div>
        </div>
    {:else if config.displayMode === 'slider'}
        <div class="gr-slider">
            {#each filteredReviews as review}
                <div class="gr-review">
                    {#if config.showRatings}
                        <div class="gr-stars">
                            {#each Array(getStars(review.rating).full) as _}
                                <span class="gr-star gr-star-full">★</span>
                            {/each}
                            
                            {#if getStars(review.rating).half}
                                <span class="gr-star gr-star-half">★</span>
                            {/if}
                            
                            {#each Array(getStars(review.rating).empty) as _}
                                <span class="gr-star gr-star-empty">☆</span>
                            {/each}
                        </div>
                    {/if}
                    <div class="gr-review-text">"{review.text}"</div>
                    <div class="gr-author-name">- {review.authorName}</div>
                    {#if config.showDates}
                        <div class="gr-review-date">{review.relativeTime}</div>
                    {/if}
                </div>
            {/each}
        </div>
    {:else if config.displayMode === 'floating-badge'}
        <div class="gr-floating-badge">
            <h3 class="gr-business-name">{sampleData.businessName}</h3>
            <div class="gr-rating-summary">
                <div class="gr-stars">
                    {#each Array(getStars(sampleData.rating).full) as _}
                        <span class="gr-star gr-star-full">★</span>
                    {/each}
                    
                    {#if getStars(sampleData.rating).half}
                        <span class="gr-star gr-star-half">★</span>
                    {/if}
                    
                    {#each Array(getStars(sampleData.rating).empty) as _}
                        <span class="gr-star gr-star-empty">☆</span>
                    {/each}
                </div>
                <div class="gr-rating-text">
                    {sampleData.rating.toFixed(1)} / 5
                </div>
            </div>
        </div>
    {:else if config.displayMode === 'wall'}
        <div class="gr-wall">
            {#each filteredReviews as review}
                <div class="gr-review">
                    <div class="gr-review-header">
                        {#if config.showPhotos && review.authorPhotoUrl}
                            <img src={review.authorPhotoUrl} alt={review.authorName} class="gr-author-photo">
                        {/if}
                        <div class="gr-review-meta">
                            <div class="gr-author-name">{review.authorName}</div>
                            {#if config.showDates}
                                <div class="gr-review-date">{review.relativeTime}</div>
                            {/if}
                            {#if config.showRatings}
                                <div class="gr-stars">
                                    {#each Array(getStars(review.rating).full) as _}
                                        <span class="gr-star gr-star-full">★</span>
                                    {/each}
                                    
                                    {#if getStars(review.rating).half}
                                        <span class="gr-star gr-star-half">★</span>
                                    {/if}
                                    
                                    {#each Array(getStars(review.rating).empty) as _}
                                        <span class="gr-star gr-star-empty">☆</span>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    </div>
                    <div class="gr-review-text">{review.text}</div>
                </div>
            {/each}
        </div>
    {/if}
    
    <!-- Footer with attribution -->
    <div class="gr-footer">
        <div class="gr-powered-by">
            Powered by <a href="https://example.com" target="_blank" rel="noopener">Google Reviews Widget</a>
        </div>
    </div>
</div>

<style>
    /* Base styles only - dynamic styles are applied via JS */
    .gr-widget-container {
        width: 100%;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
</style>
