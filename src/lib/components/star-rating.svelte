<script lang="ts">
  export let rating: number = 0;
  export let maxStars: number = 5;
  export let color: string = '#FBBC05'; // Google's yellow star color
  
  // Calculate the percentage filled for each star
  $: stars = Array.from({ length: maxStars }, (_, i) => {
    const starIndex = i + 1;
    
    if (rating >= starIndex) {
      // Full star
      return 1;
    } else if (rating > i && rating < starIndex) {
      // Partial star
      return rating - i;
    } else {
      // Empty star
      return 0;
    }
  });
</script>

<div class="star-rating" aria-label="{rating} out of {maxStars} stars">
  {#each stars as starFill, i}
    <div class="star">
      <svg 
        viewBox="0 0 24 24" 
        width="16" 
        height="16" 
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="star-fill-{i}">
            <stop offset="{starFill * 100}%" stop-color="{color}" />
            <stop offset="{starFill * 100}%" stop-color="#e0e0e0" />
          </linearGradient>
        </defs>
        <path 
          d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" 
          fill="url(#star-fill-{i})"
        />
      </svg>
    </div>
  {/each}
</div>

<style>
  .star-rating {
    display: inline-flex;
    align-items: center;
  }
  
  .star {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
</style>
