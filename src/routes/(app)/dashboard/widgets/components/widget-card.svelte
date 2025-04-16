<script lang="ts">
    import * as Card from '$lib/components/ui/card';
    import * as Button from '$lib/components/ui/button';
    import { Badge } from '$lib/components/ui/badge';
    import { Settings, Copy, Eye, Globe } from 'lucide-svelte';
    
    // Define an interface for our API key
    interface ApiKey {
        id: string;
        api_key: string;
        subscription_tier: string;
        created_at: string;
        is_active: boolean;
        allowed_domains: string[];
        cache_duration: number;
        max_reviews: number;
        rate_limit: number;
        place_id: string;
        custom_settings?: {
            theme?: string;
            displayMode?: string;
        };
    }
    
    export let apiKey: ApiKey;

    // Format date in a readable format
    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Function to copy embed code to clipboard
    function copyEmbedCode() {
        // Need to handle the script tag carefully to avoid syntax errors
        const firstPart = `<div class="gr-widget" data-gr-place-id="${apiKey.place_id}" data-gr-api-key="${apiKey.api_key}"></div>`;
        const secondPart = '<script src="https://cdn.example.com/google-reviews-widget.min.js" async><' + '/script>';
        const embedCode = firstPart + '\n' + secondPart;
        
        navigator.clipboard.writeText(embedCode)
            .then(() => {
                alert('Embed code copied to clipboard');
            })
            .catch((err) => {
                console.error('Could not copy text: ', err);
                alert('Failed to copy embed code');
            });
    }

    // Get tier badge color
    function getTierColor(tier: string): string {
        switch (tier) {
            case 'PREMIUM':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
            case 'PRO':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'BASIC':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
        }
    }
</script>

<Card.Root class="overflow-hidden">
    <Card.Header class="pb-2">
        <div class="flex justify-between items-start">
            <div>
                <Card.Title class="truncate text-xl mb-1">
                    {apiKey.api_key}
                </Card.Title>
                <Card.Description>
                    Created {formatDate(apiKey.created_at)}
                </Card.Description>
            </div>
            <Badge class={getTierColor(apiKey.subscription_tier)}>
                {apiKey.subscription_tier}
            </Badge>
        </div>
    </Card.Header>
    
    <Card.Content class="pb-2">
        <div class="space-y-3">
            <div class="flex items-center">
                <Globe class="h-4 w-4 mr-2 text-muted-foreground" />
                <span class="text-sm">
                    {apiKey.allowed_domains.length > 0 
                        ? apiKey.allowed_domains.join(', ') 
                        : 'All domains allowed'}
                </span>
            </div>
            
            <div class="grid grid-cols-2 gap-2 text-sm">
                <div>
                    <span class="text-muted-foreground">Max Reviews:</span>
                    <span class="font-medium ml-1">{apiKey.max_reviews}</span>
                </div>
                <div>
                    <span class="text-muted-foreground">Cache:</span>
                    <span class="font-medium ml-1">{apiKey.cache_duration / 3600}h</span>
                </div>
                <div>
                    <span class="text-muted-foreground">Rate Limit:</span>
                    <span class="font-medium ml-1">{apiKey.rate_limit}/min</span>
                </div>
                <div>
                    <span class="text-muted-foreground">Status:</span>
                    <span class="font-medium ml-1">
                        {apiKey.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>
            </div>
            
            <div>
                <span class="text-muted-foreground text-sm">Display:</span>
                <span class="font-medium text-sm ml-1 capitalize">
                    {apiKey.custom_settings?.displayMode || 'carousel'} / 
                    {apiKey.custom_settings?.theme || 'light'}
                </span>
            </div>
        </div>
    </Card.Content>
    
    <Card.Footer class="flex flex-col space-y-2 pt-2">
        <div class="grid grid-cols-2 gap-2 w-full">
            <Button.Root variant="outline" class="w-full" href={`/dashboard/widgets/${apiKey.id}`}>
                <Settings class="mr-2 h-4 w-4" />
                Configure
            </Button.Root>
            <Button.Root variant="outline" class="w-full" on:click={copyEmbedCode}>
                <Copy class="mr-2 h-4 w-4" />
                Get Code
            </Button.Root>
        </div>
        <Button.Root variant="ghost" class="w-full" href={`/dashboard/widgets/${apiKey.id}/preview`}>
            <Eye class="mr-2 h-4 w-4" />
            Preview Widget
        </Button.Root>
    </Card.Footer>
</Card.Root>
