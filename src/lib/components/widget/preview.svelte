<!-- src/lib/components/widget/preview.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import StarRating from '../ui/star-rating.svelte';
    
    export let placeData = {
      name: 'Business Name',
      rating: 4.5,
      user_ratings_total: 123,
      url: '#'
    };
    
    export let reviews = [];
    export let settings = {
      displayMode: 'carousel',
      theme: 'light',
      maxReviews: 5,
      minRating: 0
    };
    
    let container;
    let currentIndex = 0;
    
    $: filteredReviews = reviews.filter(review => review.rating >= settings.minRating)
      .slice(0, settings.maxReviews);
    
    function nextReview() {
      if (currentIndex < filteredReviews.length - 1) {
        currentIndex++;
      } else {
        currentIndex = 0;
      }
    }
    
    function prevReview() {
      if (currentIndex > 0) {
        currentIndex--;
      } else {
        currentIndex = filteredReviews.length - 1;
      }
    }
    
    function formatDate(timestamp) {
      if (!timestamp) return '';
      const date = new Date(typeof timestamp === 'number' ? timestamp * 1000 : timestamp);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    }
    
    onMount(() => {
      // Set up auto-scroll for carousel if needed
      if (settings.displayMode === 'carousel' && filteredReviews.length > 1) {
        const interval = setInterval(() => {
          nextReview();
        }, 5000);
        
        return () => clearInterval(interval);
      }
    });
  </script>
  
  <div 
    class="gr-widget w-full overflow-hidden rounded-lg shadow-sm border"
    class:gr-dark={settings.theme === 'dark'}
    bind:this={container}
  >
    <!-- Header -->
    <div class="gr-header p-4 bg-slate-50 dark:bg-slate-800 border-b">
      <div class="gr-business-info">
        <h3 class="text-lg font-semibold">{placeData.name}</h3>
        <div class="gr-rating flex items-center gap-2">
          <StarRating rating={placeData.rating} />
          <span class="text-sm">{placeData.rating.toFixed(1)} stars from {placeData.user_ratings_total} reviews</span>
        </div>
      </div>
    </div>
    
    <!-- Reviews -->
    {#if filteredReviews.length === 0}
      <div class="p-4 text-center text-slate-500">
        No reviews match your criteria.
      </div>
    {:else}
      <div class="gr-reviews p-4" class:bg-white={settings.theme === 'light'} class:bg-slate-900={settings.theme === 'dark'}>
        {#if settings.displayMode === 'carousel'}
          <div class="relative">
            <div class="gr-carousel">
              {#if filteredReviews[currentIndex]}
                <div class="gr-review p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                  <div class="gr-review-header flex items-center gap-3 mb-3">
                    <img 
                      src={filteredReviews[currentIndex].profile_photo_url || '/widget/assets/default-profile.png'} 
                      alt={filteredReviews[currentIndex].author_name} 
                      class="gr-author-image w-10 h-10 rounded-full"
                    />
                    <div class="gr-reviewer-info">
                      <h4 class="font-medium">{filteredReviews[currentIndex].author_name}</h4>
                      <div class="flex items-center">
                        <StarRating rating={filteredReviews[currentIndex].rating} size="small" />
                        <span class="text-xs ml-2 text-slate-500">{formatDate(filteredReviews[currentIndex].time)}</span>
                      </div>
                    </div>
                  </div>
                  <div class="gr-review-content">
                    <p class="text-sm">{filteredReviews[currentIndex].text}</p>
                  </div>
                </div>
              {/if}
            </div>
            
            <!-- Carousel Controls -->
            {#if filteredReviews.length > 1}
              <div class="flex justify-between w-full">
                <button 
                  class="gr-nav gr-prev absolute left-0 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-slate-800/80 rounded-full w-8 h-8 flex items-center justify-center shadow-sm"
                  on:click={prevReview}
                  aria-label="Previous review"
                >
                  &lsaquo;
                </button>
                <button 
                  class="gr-nav gr-next absolute right-0 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-slate-800/80 rounded-full w-8 h-8 flex items-center justify-center shadow-sm"
                  on:click={nextReview}
                  aria-label="Next review"
                >
                  &rsaquo;
                </button>
              </div>
              
              <!-- Dots -->
              <div class="flex justify-center gap-1 mt-3">
                {#each filteredReviews as _, i}
                  <button 
                    class="w-2 h-2 rounded-full" 
                    class:bg-primary={i === currentIndex}
                    class:bg-slate-300={i !== currentIndex}
                    on:click={() => currentIndex = i}
                    aria-label={`Go to review ${i + 1}`}
                  ></button>
                {/each}
              </div>
            {/if}
          </div>
        {:else if settings.displayMode === 'list'}
          <div class="gr-list space-y-4">
            {#each filteredReviews as review}
              <div class="gr-review p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                <div class="gr-review-header flex items-center gap-3 mb-3">
                  <img 
                    src={review.profile_photo_url || '/widget/assets/default-profile.png'} 
                    alt={review.author_name} 
                    class="gr-author-image w-10 h-10 rounded-full"
                  />
                  <div class="gr-reviewer-info">
                    <h4 class="font-medium">{review.author_name}</h4>
                    <div class="flex items-center">
                      <StarRating rating={review.rating} size="small" />
                      <span class="text-xs ml-2 text-slate-500">{formatDate(review.time)}</span>
                    </div>
                  </div>
                </div>
                <div class="gr-review-content">
                  <p class="text-sm">{review.text}</p>
                </div>
              </div>
            {/each}
          </div>
        {:else if settings.displayMode === 'grid'}
          <div class="gr-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {#each filteredReviews as review}
              <div class="gr-review p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm h-full flex flex-col">
                <div class="gr-review-header flex items-center gap-3 mb-3">
                  <img 
                    src={review.profile_photo_url || '/widget/assets/default-profile.png'} 
                    alt={review.author_name} 
                    class="gr-author-image w-10 h-10 rounded-full"
                  />
                  <div class="gr-reviewer-info">
                    <h4 class="font-medium">{review.author_name}</h4>
                    <div class="flex items-center">
                      <StarRating rating={review.rating} size="small" />
                      <span class="text-xs ml-2 text-slate-500">{formatDate(review.time)}</span>
                    </div>
                  </div>
                </div>
                <div class="gr-review-content flex-grow">
                  <p class="text-sm">{review.text}</p>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
    
    <!-- Footer -->
    <div class="gr-footer p-3 bg-slate-50 dark:bg-slate-800 border-t flex justify-between text-xs">
      <a href={placeData.url} target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">
        See all reviews on Google
      </a>
      <div class="gr-powered-by">
        Powered by <a href="/" class="text-primary hover:underline">GoogleReviews</a>
      </div>
    </div>
  </div>
  
  <style>
    .gr-dark {
      --gr-text-color: #f5f5f5;
      --gr-bg-color: #1e293b;
      color: var(--gr-text-color);
      background-color: var(--gr-bg-color);
    }
  </style>