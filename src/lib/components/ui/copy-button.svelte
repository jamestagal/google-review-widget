<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Copy, Check } from "lucide-svelte";
    import { tick } from "svelte";
    
    export let text: string;
    export let size: "sm" | "default" | "lg" = "default";
    
    let copied = false;
    
    async function copyToClipboard() {
      try {
        await navigator.clipboard.writeText(text);
        copied = true;
        setTimeout(() => {
          copied = false;
        }, 2000);
      } catch (err) {
        console.error("Failed to copy: ", err);
      }
    }
  </script>
  
  <Button 
    variant="outline" 
    size={size} 
    on:click={copyToClipboard} 
    aria-label={copied ? "Copied" : "Copy to clipboard"}
  >
    {#if copied}
      <Check class="h-4 w-4" />
    {:else}
      <Copy class="h-4 w-4" />
    {/if}
  </Button>