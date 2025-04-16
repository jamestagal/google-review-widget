<script lang="ts">
  import { ArrowLeft, Save, Trash2 } from 'lucide-svelte';
  import { Button } from '$lib/components/ui/button';
  
  export let widgetName: string = '';
  export let onSave: () => void;
  export let onDelete: () => void;
  export let isSaving: boolean = false;
</script>

<div class="mb-8">
  <a href="/dashboard/widgets" class="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
    <ArrowLeft class="mr-2 h-4 w-4" />
    Back to Widgets
  </a>
  <div class="flex items-center justify-between mt-2">
    <h1 class="text-3xl font-bold">Edit {widgetName}</h1>
    <div class="flex gap-2">
      <Button variant="outline" class="flex items-center gap-2" on:click={onDelete}>
        <Trash2 class="h-4 w-4" />
        Delete
      </Button>
      <Button class="flex items-center gap-2" on:click={onSave} disabled={isSaving}>
        {#if isSaving}
          <div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
          Saving...
        {:else}
          <Save class="h-4 w-4" />
          Save Changes
        {/if}
      </Button>
    </div>
  </div>
</div>
