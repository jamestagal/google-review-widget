<script lang="ts">
    export let rating: number = 0;
    export let max: number = 5;
    export let size: 'small' | 'medium' | 'large' = 'medium';
    
    // Calculate the percentage for the fill
    $: fillPercentage = (rating / max) * 100;
    
    // Determine size classes
    $: sizeClass = {
      small: 'h-3 w-3',
      medium: 'h-4 w-4',
      large: 'h-5 w-5'
    }[size];
  </script>
  
  <div class="flex items-center">
    <div class="relative inline-flex">
      {#each Array(max) as _, i}
        <!-- Grey background stars -->
        <svg xmlns="http://www.w3.org/2000/svg" class={`${sizeClass} text-gray-300`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      {/each}
      
      <!-- Colored stars overlay with clipping -->
      <div class="absolute top-0 left-0 overflow-hidden" style="width: {fillPercentage}%">
        <div class="flex">
          {#each Array(max) as _, i}
            <svg xmlns="http://www.w3.org/2000/svg" class={`${sizeClass} text-yellow-400`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          {/each}
        </div>
      </div>
    </div>
  </div>