<script lang="ts">
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { toast } from 'svelte-sonner';
    import { 
        Card, 
        CardHeader, 
        CardTitle, 
        CardDescription, 
        CardContent,
        CardFooter
    } from '$lib/components/ui/card';
    import { Button } from '$lib/components/ui/button';

    // Type declarations for Chart.js
    interface ChartInstance {
        destroy: () => void;
    }

    interface ChartConfig {
        type: string;
        data: {
            labels: string[];
            datasets: Array<{
                label?: string;
                data: number[];
                borderColor?: string;
                backgroundColor?: string | string[];
                tension?: number;
                fill?: boolean;
                borderWidth?: number;
            }>;
        };
        options: Record<string, unknown>;
    }

    // Use a safer approach with type assertions
    let Chart: { new(ctx: CanvasRenderingContext2D, config: ChartConfig): ChartInstance } | null = null;
    let timeChart: ChartInstance | null = null;
    let domainChart: ChartInstance | null = null;

    // Function to safely access Chart.js from window
    function getChartFromWindow(): { new(ctx: CanvasRenderingContext2D, config: ChartConfig): ChartInstance } | null {
        if (browser && typeof window !== 'undefined') {
            // Using a two-step type assertion for safety
            return (window as unknown as { Chart: typeof Chart }).Chart;
        }
        return null;
    }

    // Define interface for analytics data
    interface AnalyticsData {
        totalViews: number;
        uniqueVisitors: number;
        interactions: number;
        viewsChange: number;
        visitorsChange: number;
        interactionsChange: number;
        timeData: Array<{
            date: string;
            views: number;
            visitors: number;
            interactions: number;
        }>;
        domainData: Array<{
            name: string;
            value: number;
            percentage: number;
        }>;
        widgetComparison: Array<{
            id: string;
            name: string;
            views: number;
            visitors: number;
            interactions: number;
            errors: number;
            avgLoadTime: number;
        }>;
        errorData: Array<{
            date: string;
            widgetId: string;
            widgetName: string;
            domain: string;
            count: number;
            details: string;
        }>;
    }

    // Variables for analytics state
    let selectedPeriod = '7d';
    let selectedWidget = 'all';
    let analyticsData: AnalyticsData | null = null;
    let _isLoadingAnalytics = false;
    let _analyticsError: Error | null = null;

    // Import widgets from the parent component's props
    export let data;
    const { widgets = [] } = data;

    // Initialize component
    onMount(async () => {
        // Initialize Chart.js
        if (browser) {
            Chart = getChartFromWindow();
        }

        // Initialize analytics data
        const hasWidgets = widgets.length > 0;
        if (hasWidgets) {
            await fetchAnalyticsData();
            
            // Render charts after data is loaded
            setTimeout(() => {
                const timeCanvas = document.getElementById('time-chart') as HTMLCanvasElement | null;
                const domainCanvas = document.getElementById('domain-chart') as HTMLCanvasElement | null;

                if (timeCanvas && analyticsData?.timeData) {
                    renderTimeChart(timeCanvas, analyticsData.timeData);
                }

                if (domainCanvas && analyticsData?.domainData) {
                    renderDomainChart(domainCanvas, analyticsData.domainData);
                }
            }, 500);
        }
    });

    // Function to fetch analytics data
    async function fetchAnalyticsData() {
        try {
            _isLoadingAnalytics = true;
            _analyticsError = null;

            const response = await fetch('/api/analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    period: selectedPeriod,
                    widgetId: selectedWidget !== 'all' ? selectedWidget : undefined
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch analytics data');
            }

            analyticsData = await response.json();
            console.log('Analytics data loaded:', analyticsData);

            // Initialize charts if data is available
            if (analyticsData && browser && Chart) {
                // Use setTimeout to ensure DOM is ready
                setTimeout(() => {
                    const timeCanvas = document.getElementById('time-chart') as HTMLCanvasElement | null;
                    const domainCanvas = document.getElementById('domain-chart') as HTMLCanvasElement | null;

                    if (timeCanvas && analyticsData?.timeData && analyticsData.timeData.length > 0) {
                        console.log('Rendering time chart with data:', analyticsData.timeData);
                        renderTimeChart(timeCanvas, analyticsData.timeData);
                    } else {
                        console.warn('Could not render time chart - canvas or data missing', { 
                            canvasExists: !!timeCanvas, 
                            dataExists: !!analyticsData?.timeData, 
                            dataLength: analyticsData?.timeData?.length 
                        });
                    }

                    if (domainCanvas && analyticsData?.domainData && analyticsData.domainData.length > 0) {
                        console.log('Rendering domain chart with data:', analyticsData.domainData);
                        renderDomainChart(domainCanvas, analyticsData.domainData);
                    } else {
                        console.warn('Could not render domain chart - canvas or data missing', { 
                            canvasExists: !!domainCanvas, 
                            dataExists: !!analyticsData?.domainData, 
                            dataLength: analyticsData?.domainData?.length 
                        });
                    }
                }, 500);
            }
        } catch (err) {
            console.error('Error fetching analytics data:', err);
            _analyticsError = err instanceof Error ? err : new Error('Unknown error occurred');
            toast.error(`Failed to load analytics: ${_analyticsError.message}`);
        } finally {
            _isLoadingAnalytics = false;
        }
    }

    // Function to render time chart
    function renderTimeChart(canvas: HTMLCanvasElement, data: Array<{date: string; views: number; visitors: number; interactions: number}>) {
        if (!browser || !Chart) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (timeChart) {
            timeChart.destroy();
        }

        timeChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(item => new Date(item.date).toLocaleDateString()),
                datasets: [
                    {
                        label: 'Views',
                        data: data.map(item => item.views),
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: 'Unique Visitors',
                        data: data.map(item => item.visitors),
                        borderColor: 'rgb(16, 185, 129)',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: 'Interactions',
                        data: data.map(item => item.interactions),
                        borderColor: 'rgb(249, 115, 22)',
                        backgroundColor: 'rgba(249, 115, 22, 0.1)',
                        tension: 0.3,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    }
                }
            }
        });
    }

    // Function to render domain chart
    function renderDomainChart(canvas: HTMLCanvasElement, data: Array<{name: string; value: number; percentage: number}>) {
        if (!browser || !Chart) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (domainChart) {
            domainChart.destroy();
        }

        // Limit to top 5 domains for clarity
        const chartData = data.slice(0, 5);

        // Add "Other" category if there are more than 5 domains
        if (data.length > 5) {
            const otherValue = data.slice(5).reduce((sum, item) => sum + item.value, 0);
            chartData.push({
                name: 'Other',
                value: otherValue,
                percentage: Math.round((otherValue / data.reduce((sum, item) => sum + item.value, 0)) * 100)
            });
        }

        domainChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: chartData.map(item => item.name),
                datasets: [{
                    data: chartData.map(item => item.value),
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(249, 115, 22, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                        'rgba(236, 72, 153, 0.8)',
                        'rgba(107, 114, 128, 0.8)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 12
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context: { dataIndex: number }) {
                                const item = chartData[context.dataIndex];
                                return `${item.name}: ${item.value.toLocaleString()} views (${item.percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Function to show error details
    function showErrorDetails(error: {
        details?: string;
        date: string;
        domain: string;
        count: number;
        widgetName: string;
    }) {
        // Create a more detailed error modal with actionable information
        const errorMessage = `
Error: ${error.details || 'Unknown error'}
Date: ${new Date(error.date).toLocaleString()}
Domain: ${error.domain}
Occurrences: ${error.count}

Possible solutions:
1. Check if the widget script is properly loaded on ${error.domain}
2. Verify that the domain has proper CORS permissions
3. Check for any JavaScript errors in the browser console
4. Ensure the widget configuration is correct
`;
        
        toast.info(errorMessage, {
            duration: 10000,
            position: 'top-center',
            style: {
                maxWidth: '500px',
                whiteSpace: 'pre-wrap'
            } as Record<string, string>
        });
    }
</script>

<svelte:head>
    <title>Analytics Dashboard - Google Review Widget</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js" defer></script>
</svelte:head>

<div class="container mx-auto py-6 px-4 max-w-7xl">
    <div class="flex items-center justify-between mb-6">
        <h1 class="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
    </div>

    <div class="w-full space-y-6 max-w-none">
        <!-- Analytics controls -->
        <div class="flex flex-wrap items-center justify-between gap-4 w-full">
            <div class="flex flex-wrap items-center gap-2">
                <span class="text-sm font-medium">Period:</span>
                <div class="flex items-center rounded-md border">
                    <button 
                        class="px-3 py-1.5 text-sm {selectedPeriod === '7d' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}" 
                        on:click={() => { selectedPeriod = '7d'; fetchAnalyticsData(); }}
                    >
                        7d
                    </button>
                    <button 
                        class="px-3 py-1.5 text-sm {selectedPeriod === '30d' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}" 
                        on:click={() => { selectedPeriod = '30d'; fetchAnalyticsData(); }}
                    >
                        30d
                    </button>
                    <button 
                        class="px-3 py-1.5 text-sm {selectedPeriod === '90d' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}" 
                        on:click={() => { selectedPeriod = '90d'; fetchAnalyticsData(); }}
                    >
                        90d
                    </button>
                    <button 
                        class="px-3 py-1.5 text-sm {selectedPeriod === 'all' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}" 
                        on:click={() => { selectedPeriod = 'all'; fetchAnalyticsData(); }}
                    >
                        All
                    </button>
                </div>
            </div>
            
            <div class="flex items-center gap-2">
                <span class="text-sm font-medium">Widget:</span>
                <select 
                    class="h-9 w-[180px] rounded-md border border-input bg-background px-3 py-1 text-sm"
                    bind:value={selectedWidget}
                    on:change={() => fetchAnalyticsData()}
                >
                    <option value="all">All widgets</option>
                    {#each widgets as widget}
                        <option value={widget.id}>{widget.name}</option>
                    {/each}
                </select>
            </div>
        </div>
        
        <!-- Key metrics -->
        {#if _isLoadingAnalytics}
            <div class="grid gap-4 md:grid-cols-3 w-full">
                {#each Array(3) as _}
                    <Card class="w-full">
                        <CardContent class="p-6">
                            <div class="h-[80px] animate-pulse rounded-md bg-muted"></div>
                        </CardContent>
                    </Card>
                {/each}
            </div>
        {:else if analyticsData}
            <div class="grid gap-4 md:grid-cols-3 w-full">
                <!-- Total Views -->
                <Card class="w-full">
                    <CardContent class="p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-muted-foreground">Total Views</p>
                                <p class="text-3xl font-bold">{analyticsData.totalViews.toLocaleString()}</p>
                            </div>
                            <div class="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-500"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                            </div>
                        </div>
                        <div class="mt-4 flex items-center">
                            {#if analyticsData.viewsChange > 0}
                                <span class="flex items-center text-sm font-medium text-green-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="m6 9 6-6 6 6"/><path d="M6 12h12"/><path d="m6 15 6 6 6-6"/></svg>
                                    {analyticsData.viewsChange}%
                                </span>
                            {:else if analyticsData.viewsChange < 0}
                                <span class="flex items-center text-sm font-medium text-red-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="m6 9 6-6 6 6"/><path d="M6 12h12"/><path d="m6 15 6 6 6-6"/></svg>
                                    {Math.abs(analyticsData.viewsChange)}%
                                </span>
                            {:else}
                                <span class="flex items-center text-sm font-medium text-gray-600">
                                    No change
                                </span>
                            {/if}
                            <span class="ml-2 text-xs text-muted-foreground">vs previous period</span>
                        </div>
                    </CardContent>
                </Card>
                
                <!-- Unique Visitors -->
                <Card class="w-full">
                    <CardContent class="p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-muted-foreground">Unique Visitors</p>
                                <p class="text-3xl font-bold">{analyticsData.uniqueVisitors.toLocaleString()}</p>
                            </div>
                            <div class="flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-500"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            </div>
                        </div>
                        <div class="mt-4 flex items-center">
                            {#if analyticsData.visitorsChange > 0}
                                <span class="flex items-center text-sm font-medium text-green-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="m6 9 6-6 6 6"/><path d="M6 12h12"/><path d="m6 15 6 6 6-6"/></svg>
                                    {analyticsData.visitorsChange}%
                                </span>
                            {:else if analyticsData.visitorsChange < 0}
                                <span class="flex items-center text-sm font-medium text-red-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="m6 9 6-6 6 6"/><path d="M6 12h12"/><path d="m6 15 6 6 6-6"/></svg>
                                    {Math.abs(analyticsData.visitorsChange)}%
                                </span>
                            {:else}
                                <span class="flex items-center text-sm font-medium text-gray-600">
                                    No change
                                </span>
                            {/if}
                            <span class="ml-2 text-xs text-muted-foreground">vs previous period</span>
                        </div>
                    </CardContent>
                </Card>
                
                <!-- Interactions -->
                <Card class="w-full">
                    <CardContent class="p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-muted-foreground">Interactions</p>
                                <p class="text-3xl font-bold">{analyticsData.interactions.toLocaleString()}</p>
                            </div>
                            <div class="flex h-14 w-14 items-center justify-center rounded-full bg-orange-50">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-orange-500"><path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/></svg>
                            </div>
                        </div>
                        <div class="mt-4 flex items-center">
                            {#if analyticsData.interactionsChange > 0}
                                <span class="flex items-center text-sm font-medium text-green-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="m6 9 6-6 6 6"/><path d="M6 12h12"/><path d="m6 15 6 6 6-6"/></svg>
                                    {analyticsData.interactionsChange}%
                                </span>
                            {:else if analyticsData.interactionsChange < 0}
                                <span class="flex items-center text-sm font-medium text-red-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="m6 9 6-6 6 6"/><path d="M6 12h12"/><path d="m6 15 6 6 6-6"/></svg>
                                    {Math.abs(analyticsData.interactionsChange)}%
                                </span>
                            {:else}
                                <span class="flex items-center text-sm font-medium text-gray-600">
                                    No change
                                </span>
                            {/if}
                            <span class="ml-2 text-xs text-muted-foreground">vs previous period</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        {/if}
        
        <!-- Charts -->
        <div class="grid gap-4 md:grid-cols-2 w-full">
            <!-- Time-based analytics -->
            <Card class="w-full">
                <CardHeader>
                    <CardTitle>Widget Performance</CardTitle>
                    <CardDescription>Views, visitors, and interactions over time</CardDescription>
                </CardHeader>
                <CardContent>
                    <div id="time-chart-container" class="h-[300px]">
                        <canvas id="time-chart" height="300"></canvas>
                    </div>
                </CardContent>
            </Card>
            
            <!-- Domain distribution -->
            <Card class="w-full">
                <CardHeader>
                    <CardTitle>Domain Distribution</CardTitle>
                    <CardDescription>Where your widgets are being viewed</CardDescription>
                </CardHeader>
                <CardContent>
                    <div id="domain-chart-container" class="h-[300px]">
                        <canvas id="domain-chart" height="300"></canvas>
                    </div>
                </CardContent>
            </Card>
        </div>
        
        <!-- Widget comparison -->
        {#if analyticsData?.widgetComparison && analyticsData.widgetComparison.length > 0}
        <Card class="w-full">
            <CardHeader>
                <CardTitle>Widget Performance Comparison</CardTitle>
                <CardDescription>How your widgets are performing relative to each other</CardDescription>
            </CardHeader>
            <CardContent>
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead>
                            <tr class="border-b">
                                <th class="pb-2 text-left font-medium">Widget</th>
                                <th class="pb-2 text-right font-medium">Views</th>
                                <th class="pb-2 text-right font-medium">Visitors</th>
                                <th class="pb-2 text-right font-medium">Interactions</th>
                                <th class="pb-2 text-right font-medium">Errors</th>
                                <th class="pb-2 text-right font-medium">Avg. Load Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each analyticsData.widgetComparison as widget}
                                <tr class="border-b">
                                    <td class="py-3 text-left">{widget.name}</td>
                                    <td class="py-3 text-right">{widget.views.toLocaleString()}</td>
                                    <td class="py-3 text-right">{widget.visitors.toLocaleString()}</td>
                                    <td class="py-3 text-right">{widget.interactions.toLocaleString()}</td>
                                    <td class="py-3 text-right">{widget.errors}</td>
                                    <td class="py-3 text-right">{widget.avgLoadTime.toFixed(0)}ms</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
        {/if}
        
        <!-- Error section -->
        {#if analyticsData?.errorData && analyticsData.errorData.length > 0}
        <Card class="w-full">
            <CardHeader>
                <CardTitle>Error Tracking</CardTitle>
                <CardDescription>Recent errors detected in your widgets</CardDescription>
            </CardHeader>
            <CardContent>
                <div class="space-y-4">
                    {#each analyticsData.errorData as error}
                        <div class="flex items-start justify-between p-4 bg-red-50 rounded-md border border-red-100">
                            <div>
                                <p class="font-medium text-red-800">{error.widgetName}</p>
                                <p class="text-sm text-red-600">{new Date(error.date).toLocaleDateString()} {new Date(error.date).toLocaleTimeString()} on {error.domain}</p>
                                <p class="text-sm mt-1">{error.count} {error.count === 1 ? 'occurrence' : 'occurrences'}</p>
                                <div class="mt-2">
                                    <p class="text-xs text-red-700">Impact: {error.count > 5 ? 'High' : error.count > 2 ? 'Medium' : 'Low'}</p>
                                    <p class="text-xs text-red-700">Status: Unresolved</p>
                                </div>
                            </div>
                            <div class="flex flex-col gap-2">
                                <Button variant="outline" size="sm" on:click={() => showErrorDetails(error)}>
                                    Details
                                </Button>
                                <Button variant="ghost" size="sm" class="text-xs">
                                    Mark Resolved
                                </Button>
                            </div>
                        </div>
                    {/each}
                </div>
            </CardContent>
            <CardFooter class="flex justify-between border-t pt-4">
                <p class="text-sm text-muted-foreground">Showing {analyticsData.errorData.length} {analyticsData.errorData.length === 1 ? 'error' : 'errors'}</p>
                <Button variant="outline" size="sm">View All Errors</Button>
            </CardFooter>
        </Card>
        {/if}
    </div>
</div>
