<script lang="ts">
    import { onMount } from 'svelte';
    import CopyButton from '../ui/copy-button.svelte';
    
    export let widget: {
      api_key: string;
      name: string;
      display_type: string;
      theme: string;
      filters: {
        minRating: number;
        maxAge: number;
      }
    };
    
    let snippetCode: string;
    let attributeCode: string;
    
    onMount(() => {
      updateEmbedCodes();
    });
    
    function updateEmbedCodes() {
      // JavaScript snippet approach
      snippetCode = `<script>
    window.__gr = window.__gr || {};
    window.__gr.apiKey = "${widget.api_key}";
    window.__gr.displayMode = "${widget.display_type}";
    window.__gr.theme = "${widget.theme}";
    window.__gr.minRating = ${widget.filters.minRating};
    (function(w,d,s,o){
      var j=d.createElement(s);j.async=true;j.src='${window.location.origin}/widget/widget.min.js';
      d.head.appendChild(j);
      if(!w.__gr.asyncInit) j.onload = function(){ w.GoogleReviews.init() };
    })(window,document,'script');
  <\/script>
  <div id="google-reviews"></div>`;
      
      // HTML attribute approach
      attributeCode = `<div 
    data-googlereviews="${widget.api_key}"
    data-display="${widget.display_type}" 
    data-theme="${widget.theme}"
    data-min-rating="${widget.filters.minRating}"
  ></div>
  <script src="${window.location.origin}/widget/widget.min.js"><\/script>`;
    }
  </script>
  
  <div class="space-y-4">
    <h3 class="text-lg font-semibold">Embed Your Widget</h3>
    <p class="text-muted-foreground">Copy one of these snippets to embed your Google Reviews widget on your website.</p>
    
    <div class="space-y-4">
      <div>
        <h4 class="text-sm font-medium mb-2">JavaScript Snippet (Recommended)</h4>
        <div class="relative">
          <pre class="p-4 bg-slate-100 rounded-md text-xs overflow-x-auto">{snippetCode}</pre>
          <div class="absolute top-2 right-2">
            <CopyButton text={snippetCode} />
          </div>
        </div>
      </div>
      
      <div>
        <h4 class="text-sm font-medium mb-2">HTML Attributes</h4>
        <div class="relative">
          <pre class="p-4 bg-slate-100 rounded-md text-xs overflow-x-auto">{attributeCode}</pre>
          <div class="absolute top-2 right-2">
            <CopyButton text={attributeCode} />
          </div>
        </div>
      </div>
    </div>
    
    <div class="bg-amber-50 border-l-4 border-amber-500 p-4 text-sm text-amber-700">
      <p><strong>Important:</strong> The widget will only work on domains you've authorized in your widget settings.</p>
    </div>
  </div>