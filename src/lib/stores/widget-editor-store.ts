import { writable, derived, get, type Writable, type Readable } from 'svelte/store';

// Types for the widget configuration
export interface WidgetColors {
  background: string;
  text: string;
  stars: string;
  links: string;
  buttons: string;
  border?: string;
  shadow?: string;
}

export interface WidgetFonts {
  family: string;
  titleSize: string;
  bodySize?: string;
  textSize?: string;
  weight: string;
}

export interface WidgetDisplay {
  showHeader: boolean;
  showRating: boolean;
  showPhotos: boolean;
  reviewLimit: number;
  width: string;
  height: string;
  padding?: string;
  borderRadius?: string;
  spacing?: string;
  maxHeight?: string;
}

export interface WidgetFilters {
  minRating: number;
  maxAge: number;
  sortBy: string;
}

export interface WidgetData {
  id?: string;
  name: string;
  display_type: string;
  theme: string;
  colors: WidgetColors;
  fonts: WidgetFonts;
  filters: WidgetFilters;
  display: WidgetDisplay;
  business_profile_id?: string | null;
  business_profiles?: {
    business_name?: string;
    google_place_id?: string;
  };
  api_key?: string;
  subscription_tier?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string | null;
}

export interface WidgetPreviewConfig {
  placeId: string;
  displayMode: string;
  theme: string;
  maxReviews: number;
  minRating: number;
  showRatings?: boolean;
  showDates?: boolean;
  showPhotos?: boolean;
  autoplaySpeed?: number;
  colors: WidgetColors;
  fonts: {
    family: string;
    titleSize: string;
    textSize?: string;
    weight: string;
  };
  layout: {
    padding: string;
    borderRadius: string;
    spacing: string;
    maxHeight: string;
    width: string;
  };
  sortBy: string;
  maxReviewAge: number;
}

// Define appearance store type
export interface WidgetAppearance {
  theme: string;
  colors: WidgetColors;
  fonts: WidgetFonts;
}

// Define display store type
export interface WidgetDisplaySettings {
  type: string;
  settings: WidgetDisplay;
}

// Define the widget store type
export interface WidgetStore {
  subscribe: (run: (value: WidgetData) => void) => () => void;
  set: (value: WidgetData) => void;
  update: (updater: (value: WidgetData) => WidgetData) => void;
  isLoading: Writable<boolean>;
  isSaving: Writable<boolean>;
  error: Writable<string | null>;
  appearance: Readable<WidgetAppearance>;
  display: Readable<WidgetDisplaySettings>;
  filters: Readable<WidgetFilters>;
  previewConfig: Readable<WidgetPreviewConfig>;
  updateAppearance: (values: Partial<{ theme: string; colors: Partial<WidgetColors>; fonts: Partial<WidgetFonts> }>) => void;
  updateDisplay: (values: { type?: string; settings?: Partial<WidgetDisplay> }) => void;
  updateFilters: (values: Partial<WidgetFilters>) => void;
  updateBasicInfo: (values: Partial<{ name: string; business_profile_id?: string | null }>) => void;
  reset: (data?: Partial<WidgetData>) => void;
  getValue: () => WidgetData;
}

// Default values for a new widget
const defaultWidgetData: WidgetData = {
  name: '',
  display_type: 'grid',
  theme: 'light',
  colors: {
    background: '#ffffff',
    text: '#333333',
    stars: '#FFD700',
    links: '#0070f3',
    buttons: '#0070f3',
    border: '#e5e7eb',
    shadow: 'rgba(0, 0, 0, 0.1)'
  },
  fonts: {
    family: 'inherit',
    titleSize: '1.25rem',
    bodySize: '1rem',
    weight: 'normal'
  },
  display: {
    showHeader: true,
    showRating: true,
    showPhotos: true,
    reviewLimit: 10,
    width: '100%',
    height: 'auto',
    padding: '16px',
    borderRadius: '8px',
    spacing: '16px',
    maxHeight: '600px'
  },
  filters: {
    minRating: 1,
    maxAge: 365,
    sortBy: 'newest'
  },
  business_profile_id: null,
  subscription_tier: 'free'
};

/**
 * Helper function to ensure widget data is complete with all required fields
 * This prevents errors when accessing nested properties
 */
function ensureCompleteWidgetData(data?: Partial<WidgetData> | null): WidgetData {
  if (!data) return { ...defaultWidgetData };
  
  // Create a deep copy to avoid mutating the original data
  const result: WidgetData = {
    ...defaultWidgetData,
    ...data,
    // Ensure nested objects are properly merged
    colors: {
      ...defaultWidgetData.colors,
      ...(data.colors || {})
    },
    fonts: {
      ...defaultWidgetData.fonts,
      ...(data.fonts || {})
    },
    filters: {
      ...defaultWidgetData.filters,
      ...(data.filters || {})
    },
    display: {
      ...defaultWidgetData.display,
      ...(data.display || {})
    }
  };
  
  return result;
}

// Create a function that returns a widget store
export function createWidgetStore(initialData?: Partial<WidgetData> | null): WidgetStore {
  // Create the main widget data store with complete data
  const validatedData = ensureCompleteWidgetData(initialData);
  const { subscribe, set, update } = writable<WidgetData>(validatedData);
  
  // Create UI state stores - start with loading false to avoid unnecessary loading indicators
  const isLoading = writable<boolean>(false);
  const isSaving = writable<boolean>(false);
  const error = writable<string | null>(null);
  
  // Derived stores for specific sections with safe fallbacks
  const appearance = derived({ subscribe }, $widget => ({
    theme: $widget?.theme || defaultWidgetData.theme,
    colors: $widget?.colors || defaultWidgetData.colors,
    fonts: $widget?.fonts || defaultWidgetData.fonts
  }));
  
  const display = derived({ subscribe }, $widget => ({
    type: $widget?.display_type || defaultWidgetData.display_type,
    settings: $widget?.display || defaultWidgetData.display
  }));
  
  const filters = derived({ subscribe }, $widget => $widget?.filters || defaultWidgetData.filters);
  
  // Create a preview configuration derived from the widget data with safe fallbacks
  const previewConfig = derived({ subscribe }, $widget => {
    // Ensure we have valid objects for nested properties to prevent "cannot read property of undefined" errors
    const colors = $widget?.colors || defaultWidgetData.colors;
    const fonts = $widget?.fonts || defaultWidgetData.fonts;
    const display = $widget?.display || defaultWidgetData.display;
    const filters = $widget?.filters || defaultWidgetData.filters;
    const businessProfiles = $widget?.business_profiles || {};
    
    return {
      placeId: businessProfiles.google_place_id || '',
      displayMode: $widget?.display_type || defaultWidgetData.display_type,
      theme: $widget?.theme || defaultWidgetData.theme,
      maxReviews: display.reviewLimit || defaultWidgetData.display.reviewLimit,
      minRating: filters.minRating || defaultWidgetData.filters.minRating,
      showRatings: display.showRating !== undefined ? display.showRating : true,
      showDates: true,
      showPhotos: display.showPhotos !== undefined ? display.showPhotos : true,
      autoplaySpeed: 5000, // Default value for carousel
      colors: {
        background: colors.background || defaultWidgetData.colors.background,
        text: colors.text || defaultWidgetData.colors.text,
        stars: colors.stars || defaultWidgetData.colors.stars,
        links: colors.links || defaultWidgetData.colors.links,
        buttons: colors.buttons || defaultWidgetData.colors.buttons,
        border: colors.border || defaultWidgetData.colors.border,
        shadow: colors.shadow || defaultWidgetData.colors.shadow
      },
      fonts: {
        family: fonts.family || defaultWidgetData.fonts.family,
        titleSize: fonts.titleSize || defaultWidgetData.fonts.titleSize,
        textSize: fonts.bodySize || fonts.textSize || defaultWidgetData.fonts.bodySize || '1rem',
        weight: fonts.weight || defaultWidgetData.fonts.weight
      },
      layout: {
        padding: display.padding || defaultWidgetData.display.padding || '16px',
        borderRadius: display.borderRadius || defaultWidgetData.display.borderRadius || '8px',
        spacing: display.spacing || defaultWidgetData.display.spacing || '16px',
        maxHeight: display.maxHeight || defaultWidgetData.display.maxHeight || '600px',
        width: display.width || defaultWidgetData.display.width
      },
      sortBy: filters.sortBy || defaultWidgetData.filters.sortBy,
      maxReviewAge: filters.maxAge || defaultWidgetData.filters.maxAge
    };
  });
  
  // Actions to update widget data with optimized deep copying
  function updateAppearance(values: Partial<{ theme: string; colors: Partial<WidgetColors>; fonts: Partial<WidgetFonts> }>) {
    update(widget => {
      const updatedWidget = { ...widget };
      
      if (values.theme !== undefined) {
        updatedWidget.theme = values.theme;
      }
      
      if (values.colors) {
        updatedWidget.colors = { ...updatedWidget.colors, ...values.colors };
      }
      
      if (values.fonts) {
        updatedWidget.fonts = { ...updatedWidget.fonts, ...values.fonts };
      }
      
      return updatedWidget;
    });
  }
  
  function updateDisplay(values: { type?: string; settings?: Partial<WidgetDisplay> }) {
    update(widget => {
      const updatedWidget = { ...widget };
      
      if (values.type !== undefined) {
        updatedWidget.display_type = values.type;
      }
      
      if (values.settings) {
        updatedWidget.display = { ...updatedWidget.display, ...values.settings };
      }
      
      return updatedWidget;
    });
  }
  
  function updateFilters(values: Partial<WidgetFilters>) {
    update(widget => {
      const updatedWidget = { ...widget };
      updatedWidget.filters = { ...updatedWidget.filters, ...values };
      return updatedWidget;
    });
  }
  
  function updateBasicInfo(values: Partial<{ name: string; business_profile_id?: string | null }>) {
    update(widget => {
      const updatedWidget = { ...widget };
      
      if (values.name !== undefined) {
        updatedWidget.name = values.name;
      }
      
      if (values.business_profile_id !== undefined) {
        updatedWidget.business_profile_id = values.business_profile_id;
      }
      
      return updatedWidget;
    });
  }
  
  function reset(data?: Partial<WidgetData>) {
    // Ensure data is complete when resetting
    const completeData = ensureCompleteWidgetData(data);
    set(completeData);
  }
  
  function getValue(): WidgetData {
    return get({ subscribe });
  }
  
  return {
    subscribe,
    set,
    update,
    isLoading,
    isSaving,
    error,
    appearance,
    display,
    filters,
    previewConfig,
    updateAppearance,
    updateDisplay,
    updateFilters,
    updateBasicInfo,
    reset,
    getValue
  };
}
