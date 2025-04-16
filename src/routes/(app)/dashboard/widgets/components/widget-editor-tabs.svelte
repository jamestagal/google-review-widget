<script lang="ts">
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import GeneralSettingsTab from '$lib/components/widget-editor/general-settings-tab.svelte';
  import AppearanceSettingsTab from '$lib/components/widget-editor/appearance-settings-tab.svelte';
  import DisplaySettingsTab from '$lib/components/widget-editor/display-settings-tab.svelte';
  import EmbedCodeTab from '$lib/components/widget-editor/embed-code-tab.svelte';
  import type { WidgetStore } from '$lib/stores/widget-editor-store';
  import { onMount } from 'svelte';
  
  // The widget store is now a proper Svelte store
  export let widgetStore: WidgetStore;
  
  // Reference to embed code tab
  let embedCodeTabComponent: EmbedCodeTab;
  
  // Track which tab is selected
  let activeTab = 'general';
  
  // Handle tab change to optimize component loading
  function handleTabChange(event: CustomEvent<string>) {
    const newTab = event.detail;
    activeTab = newTab;
    
    // If switching to embed code tab, notify it
    if (newTab === 'embed' && embedCodeTabComponent?.onTabShow) {
      embedCodeTabComponent.onTabShow();
    }
  }
</script>

<Card>
  <CardHeader>
    <CardTitle>Widget Settings</CardTitle>
    <CardDescription>Customize how your widget appears and behaves</CardDescription>
  </CardHeader>
  <CardContent>
    <Tabs defaultValue="general" class="w-full" onValueChange={handleTabChange}>
      <TabsList class="mb-4">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="appearance">Appearance</TabsTrigger>
        <TabsTrigger value="display">Display</TabsTrigger>
        <TabsTrigger value="embed">Embed Code</TabsTrigger>
      </TabsList>
      
      <TabsContent value="general">
        <GeneralSettingsTab {widgetStore} />
      </TabsContent>
      
      <TabsContent value="appearance">
        <AppearanceSettingsTab {widgetStore} />
      </TabsContent>
      
      <TabsContent value="display">
        <DisplaySettingsTab {widgetStore} />
      </TabsContent>
      
      <TabsContent value="embed">
        <EmbedCodeTab {widgetStore} bind:this={embedCodeTabComponent} />
      </TabsContent>
    </Tabs>
  </CardContent>
</Card>