<script lang="ts">
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Switch } from '$lib/components/ui/switch';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Separator } from '$lib/components/ui/separator';
  import { AlertCircle } from 'lucide-svelte';
  
  // Accept the widget store as a prop
  export let widgetStore;
  
  // Get allowed domains as a string
  $: allowedDomains = Array.isArray($widgetStore.allowed_domains) ? 
    $widgetStore.allowed_domains.join(',') : 
    $widgetStore.allowed_domains || '*';
  
  // Update widget name
  function updateName(event: Event) {
    const input = event.target as HTMLInputElement;
    widgetStore.updateBasicInfo({ name: input.value });
  }
  
  // Update active status
  function updateActiveStatus(checked: boolean) {
    widgetStore.updateBasicInfo({ is_active: checked });
  }
  
  // Update allowed domains
  function updateAllowedDomains(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    // We'll handle the conversion to array during save
    widgetStore.update(widget => ({
      ...widget,
      allowed_domains: textarea.value
    }));
  }
</script>

<div class="space-y-6">
  <div class="space-y-2">
    <Label for="widget-name">Widget Name</Label>
    <Input 
      id="widget-name" 
      value={$widgetStore.name} 
      on:input={updateName} 
      placeholder="My Google Reviews Widget"
    />
  </div>
  
  <div class="flex items-center space-x-2">
    <Switch 
      id="active-status" 
      checked={$widgetStore.is_active} 
      on:checkedChange={updateActiveStatus}
    />
    <Label for="active-status">Widget Active</Label>
  </div>
  
  <Separator />
  
  <div class="space-y-2">
    <Label for="business-name">Business Name</Label>
    <Input 
      id="business-name" 
      value={$widgetStore.business_profiles?.business_name || ''} 
      readonly 
      disabled
    />
    <p class="text-xs text-muted-foreground">
      Business information cannot be changed after widget creation
    </p>
  </div>
  
  <div class="space-y-2">
    <Label for="place-id">Google Place ID</Label>
    <Input 
      id="place-id" 
      value={$widgetStore.business_profiles?.google_place_id || ''} 
      readonly 
      disabled
    />
  </div>
  
  <Separator />
  
  <div class="space-y-2">
    <Label for="allowed-domains">Domain Restrictions</Label>
    <Textarea 
      id="allowed-domains" 
      value={allowedDomains} 
      on:input={updateAllowedDomains}
      placeholder="example.com, sub.example.com"
      rows="3"
    />
    <div class="text-sm text-muted-foreground flex items-start gap-2">
      <AlertCircle class="h-4 w-4 flex-shrink-0 mt-0.5" />
      <span>
        Enter domains where this widget can be embedded, one per line or comma-separated.
        Use <code class="bg-muted px-1 rounded">*</code> to allow all domains, or <code class="bg-muted px-1 rounded">*.example.com</code> to allow all subdomains of example.com.
      </span>
    </div>
  </div>
</div>
