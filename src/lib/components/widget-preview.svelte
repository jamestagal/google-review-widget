<script lang="ts">
  import { onMount } from 'svelte';
  import type { GoogleReview } from '$lib/services/reviews';
  import StarRating from './star-rating.svelte';
  
  // Widget configuration props
  export let config: any = {}; // Accept config object from editor
  export let businessName: string = 'Your Business';
  export let editorMode: boolean = false; // Flag to indicate if we're in editor mode
  
  // For backward compatibility with direct props
  export let placeId: string = config?.placeId || '';
  export let apiKey: string = config?.apiKey || '';
  export let theme: 'light' | 'dark' = config?.theme || 'light';
  export let displayMode: 'carousel' | 'grid' | 'list' = config?.displayMode || 'carousel';
  export let maxReviews: number = config?.maxReviews || 5;
  export let minRating: number = config?.minRating || 0;
  
  // Widget state
  let loading = true;
  let error: string | null = null;
  let reviews: GoogleReview[] = [];
  let overallRating: number = 0;
  let totalReviews: number = 0;
  let currentReviewIndex: number = 0;
  
  // Carousel timer
  let carouselInterval: number;
  
  // Mock data for editor mode
  const mockReviews: GoogleReview[] = [
    {
      id: 'mock-review-1',
      author_name: 'John Smith',
      author_url: '#',
      profile_photo_url: 'https://ui-avatars.com/api/?name=John+Smith&background=random',
      rating: 5,
      relative_time_description: '2 days ago',
      text: 'Great service! I highly recommend this business to anyone looking for quality work.',
      time: Date.now() - 2 * 24 * 60 * 60 * 1000
    },
    {
      id: 'mock-review-2',
      author_name: 'Sarah Johnson',
      author_url: '#',
      profile_photo_url: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=random',
      rating: 4,
      relative_time_description: '1 week ago',
      text: 'Very professional and responsive. Would use their services again.',
      time: Date.now() - 7 * 24 * 60 * 60 * 1000
    },
    {
      id: 'mock-review-3',
      author_name: 'Michael Brown',
      author_url: '#',
      profile_photo_url: 'https://ui-avatars.com/api/?name=Michael+Brown&background=random',
      rating: 5,
      relative_time_description: '3 weeks ago',
      text: 'Excellent experience from start to finish. The team was knowledgeable and helpful.',
      time: Date.now() - 21 * 24 * 60 * 60 * 1000
    }
  ];
  
  onMount(async () => {
    try {
      // If in editor mode, use mock data
      if (editorMode) {
        setTimeout(() => {
          reviews = mockReviews;
          overallRating = 4.7;
          totalReviews = 27;
          loading = false;
          
          // Start carousel if in carousel mode
          if (displayMode === 'carousel' && reviews.length > 1) {
            setupCarousel();
          }
        }, 500); // Add a small delay to simulate loading
      } else if (placeId && apiKey) {
        // Only fetch from API if not in editor mode and we have required params
        fetchReviews();
      } else {
        // No place ID or API key provided
        error = 'Missing required parameters';
        loading = false;
      }
      
      // Clean up interval on component destruction
      return () => {
        if (carouselInterval) clearInterval(carouselInterval);
      };
    } catch (err) {
      console.error('Error in widget-preview:', err);
      error = err instanceof Error ? err.message : 'Unknown error';
      loading = false;
    }
  });
  
  // Update when config changes
  $: if (config) {
    theme = config.theme || theme;
    displayMode = config.displayMode || displayMode;
    maxReviews = config.maxReviews || maxReviews;
    minRating = config.minRating || minRating;
    
    // If in carousel mode, reset carousel
    if (displayMode === 'carousel' && reviews.length > 1) {
      setupCarousel();
    }
  }
  
  // Carousel control functions
  function setupCarousel() {
    if (carouselInterval) clearInterval(carouselInterval);
    
    // Start the carousel with 5 second intervals
    carouselInterval = setInterval(() => {
      currentReviewIndex = (currentReviewIndex + 1) % reviews.length;
    }, 5000) as unknown as number; // Type assertion needed due to Node vs Browser setTimeout return types
  }
  
  function prevReview() {
    currentReviewIndex = currentReviewIndex === 0 
      ? reviews.length - 1 
      : currentReviewIndex - 1;
    
    // Reset the carousel interval when manually changing reviews
    if (displayMode === 'carousel') setupCarousel();
  }
  
  function nextReview() {
    currentReviewIndex = (currentReviewIndex + 1) % reviews.length;
    
    // Reset the carousel interval when manually changing reviews
    if (displayMode === 'carousel') setupCarousel();
  }
  
  // Fetch reviews from the API
  async function fetchReviews() {
    loading = true;
    error = null;
    
    try {
      const response = await fetch(`/api/reviews/${placeId}?apiKey=${apiKey}&maxResults=${maxReviews}&minRating=${minRating}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load reviews');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load reviews');
      }
      
      // Set the reviews data
      reviews = data.reviews || [];
      overallRating = data.rating || 0;
      totalReviews = data.total || 0;
      
      // If we have reviews, start at the first one
      if (reviews.length > 0) {
        currentReviewIndex = 0;
        
        // Start carousel if in carousel mode
        if (displayMode === 'carousel') {
          setupCarousel();
        }
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      error = err instanceof Error ? err.message : 'Failed to load reviews';
    } finally {
      loading = false;
    }
  }
  
  // Helper to get styles based on config
  function getContainerStyles() {
    const styles = [];
    
    if (config?.colors?.background) {
      styles.push(`background-color: ${config.colors.background}`);
    }
    
    if (config?.colors?.text) {
      styles.push(`color: ${config.colors.text}`);
    }
    
    if (config?.layout?.padding) {
      styles.push(`padding: ${config.layout.padding}`);
    }
    
    if (config?.layout?.borderRadius) {
      styles.push(`border-radius: ${config.layout.borderRadius}`);
    }
    
    if (config?.layout?.width) {
      styles.push(`width: ${config.layout.width}`);
    }
    
    return styles.join(';');
  }
  
  function getReviewsContainerStyles() {
    const styles = [];
    
    if (config?.layout?.maxHeight) {
      styles.push(`max-height: ${config.layout.maxHeight}`);
    }
    
    if (displayMode === 'grid' && config?.layout?.spacing) {
      styles.push(`gap: ${config.layout.spacing}`);
    }
    
    return styles.join(';');
  }
  
  function getFontStyles() {
    const styles = [];
    
    if (config?.fonts?.family) {
      styles.push(`font-family: ${config.fonts.family}`);
    }
    
    if (config?.fonts?.weight) {
      styles.push(`font-weight: ${config.fonts.weight}`);
    }
    
    return styles.join(';');
  }
  
  function getTitleStyles() {
    const styles = [getFontStyles()];
    
    if (config?.fonts?.titleSize) {
      styles.push(`font-size: ${config.fonts.titleSize}`);
    }
    
    return styles.join(';');
  }
  
  function getTextStyles() {
    const styles = [getFontStyles()];
    
    if (config?.fonts?.textSize) {
      styles.push(`font-size: ${config.fonts.textSize}`);
    }
    
    return styles.join(';');
  }
</script>

<div 
  class="google-reviews-widget"
  class:light={theme === 'light'}
  class:dark={theme === 'dark'}
  style={getContainerStyles()}
>
  {#if loading}
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading reviews...</p>
    </div>
  {:else if error}
    <div class="error-container">
      <p class="error-message">{error}</p>
    </div>
  {:else if reviews.length === 0}
    <div class="no-reviews-container">
      <p>No reviews available.</p>
    </div>
  {:else}
    <!-- Widget Header -->
    {#if config?.showRatings !== false}
      <div class="widget-header" style={getTitleStyles()}>
        <div class="business-info">
          <h3 class="business-name">{businessName}</h3>
          <div class="rating-summary">
            <StarRating rating={overallRating} starColor={config?.colors?.stars || '#FFD700'} />
            <span class="rating-text">{overallRating.toFixed(1)} out of 5 ({totalReviews} reviews)</span>
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Reviews Container -->
    <div 
      class="reviews-container" 
      class:grid={displayMode === 'grid'} 
      class:carousel={displayMode === 'carousel'} 
      class:list={displayMode === 'list'}
      style={getReviewsContainerStyles()}
    >
      {#if displayMode === 'carousel'}
        <!-- Carousel Navigation -->
        <div class="carousel-controls">
          <button class="carousel-control prev" on:click={prevReview}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          
          <!-- Only show the current review in carousel mode -->
          <div class="review-card" style="margin: 0 auto;">
            <div class="review-header">
              {#if config?.showPhotos !== false && reviews[currentReviewIndex].profile_photo_url}
                <img 
                  class="reviewer-photo" 
                  src={reviews[currentReviewIndex].profile_photo_url} 
                  alt={reviews[currentReviewIndex].author_name} 
                />
              {/if}
              <div class="reviewer-info">
                <h4 class="reviewer-name" style={getTitleStyles()}>{reviews[currentReviewIndex].author_name}</h4>
                <div class="review-rating">
                  <StarRating rating={reviews[currentReviewIndex].rating} starColor={config?.colors?.stars || '#FFD700'} />
                  <span class="review-date" style={getTextStyles()}>{reviews[currentReviewIndex].relative_time_description}</span>
                </div>
              </div>
            </div>
            <p class="review-text" style={getTextStyles()}>{reviews[currentReviewIndex].text}</p>
          </div>
          
          <button class="carousel-control next" on:click={nextReview}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
        
        <!-- Carousel Indicators -->
        <div class="carousel-indicators">
          {#each reviews as _, index}
            <button 
              class="carousel-indicator" 
              class:active={index === currentReviewIndex}
              on:click={() => {
                currentReviewIndex = index;
                if (displayMode === 'carousel') setupCarousel();
              }}
            ></button>
          {/each}
        </div>
      {:else}
        <!-- Grid or List View -->
        {#each reviews as review}
          <div class="review-card">
            <div class="review-header">
              {#if config?.showPhotos !== false && review.profile_photo_url}
                <img class="reviewer-photo" src={review.profile_photo_url} alt={review.author_name} />
              {/if}
              <div class="reviewer-info">
                <h4 class="reviewer-name" style={getTitleStyles()}>{review.author_name}</h4>
                <div class="review-rating">
                  <StarRating rating={review.rating} starColor={config?.colors?.stars || '#FFD700'} />
                  <span class="review-date" style={getTextStyles()}>{review.relative_time_description}</span>
                </div>
              </div>
            </div>
            <p class="review-text" style={getTextStyles()}>{review.text}</p>
          </div>
        {/each}
      {/if}
    </div>
    
    <!-- Widget Footer -->
    <div class="widget-footer" style={getTextStyles()}>
      <a 
        href={`https://search.google.com/local/reviews?placeid=${placeId}`} 
        target="_blank" 
        rel="noopener noreferrer"
        style={`color: ${config?.colors?.links || '#0070f3'}`}
      >
        View all reviews on Google
      </a>
    </div>
  {/if}
</div>

<style>
  .google-reviews-widget {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    color: #333;
    background-color: #fff;
    border-radius: 8px;
    padding: 16px;
    width: 100%;
    box-sizing: border-box;
    overflow: hidden;
  }
  
  .google-reviews-widget.dark {
    background-color: #1a1a1a;
    color: #f5f5f5;
  }
  
  .loading-container, .error-container, .no-reviews-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    text-align: center;
  }
  
  .loading-spinner {
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-top: 4px solid #0070f3;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .dark .loading-spinner {
    border-color: rgba(255, 255, 255, 0.1);
    border-top-color: #0070f3;
  }
  
  .error-message {
    color: #e53e3e;
  }
  
  .widget-header {
    margin-bottom: 16px;
  }
  
  .business-name {
    margin: 0 0 8px 0;
    font-size: 1.25rem;
  }
  
  .rating-summary {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .rating-text {
    font-size: 0.875rem;
  }
  
  .reviews-container {
    margin: 16px 0;
    overflow-y: auto;
  }
  
  .reviews-container.grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }
  
  .reviews-container.list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .review-card {
    background-color: rgba(0, 0, 0, 0.03);
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .dark .review-card {
    background-color: rgba(255, 255, 255, 0.05);
  }
  
  .review-header {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    gap: 12px;
  }
  
  .reviewer-photo {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
  }
  
  .reviewer-info {
    flex: 1;
  }
  
  .reviewer-name {
    margin: 0 0 4px 0;
    font-size: 1rem;
  }
  
  .review-rating {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .review-date {
    font-size: 0.75rem;
    color: #666;
  }
  
  .dark .review-date {
    color: #aaa;
  }
  
  .review-text {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.5;
  }
  
  .carousel-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }
  
  .carousel-control {
    background: none;
    border: none;
    cursor: pointer;
    color: inherit;
    padding: 8px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
  }
  
  .carousel-control:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  .dark .carousel-control:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  .carousel-indicators {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-top: 16px;
  }
  
  .carousel-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: rgba(0, 0, 0, 0.2);
    border: none;
    padding: 0;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .dark .carousel-indicator {
    background-color: rgba(255, 255, 255, 0.2);
  }
  
  .carousel-indicator.active {
    background-color: #0070f3;
  }
  
  .widget-footer {
    margin-top: 16px;
    text-align: center;
    font-size: 0.875rem;
  }
  
  .widget-footer a {
    text-decoration: none;
  }
  
  .widget-footer a:hover {
    text-decoration: underline;
  }
</style>
