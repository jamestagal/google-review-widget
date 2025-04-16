<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { PlusCircle } from 'lucide-svelte';
</script>

<div class="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
    <div class="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
        <div class="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <PlusCircle class="h-10 w-10 text-muted-foreground" />
        </div>
        
        <h3 class="mt-4 text-lg font-semibold">No widgets created</h3>
        <p class="mb-4 mt-2 text-sm text-muted-foreground">
            You haven't created any review widgets yet. Create your first widget to start displaying Google reviews on your website.
        </p>
        
        <Button href="/dashboard/widgets/new">
            <PlusCircle class="mr-2 h-4 w-4" />
            New Widget
        </Button>
    </div>
</div>
