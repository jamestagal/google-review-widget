<script lang="ts">
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import WidgetPreview from './widget-preview.svelte';
  import type { WidgetPreviewConfig } from '$lib/stores/widget-editor-store';
  
  export let config: WidgetPreviewConfig;
  export let businessName: string = '';
  export let isLoading: boolean = false;
</script>

<Card>
  <CardHeader>
    <CardTitle>Widget Preview</CardTitle>
    <CardDescription>
      This is how your widget will appear on your website
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div class="p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
      {#if isLoading}
        <div class="flex items-center justify-center h-[400px]">
          <div class="flex flex-col items-center space-y-4">
            <div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            <p class="text-muted-foreground">Loading preview...</p>
          </div>
        </div>
      {:else}
        <WidgetPreview {config} {businessName} />
      {/if}
    </div>
  </CardContent>
</Card>
