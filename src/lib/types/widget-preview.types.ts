/**
 * Types for the widget preview component
 */
import type { DisplayType } from './database.types';

/**
 * Color configuration for widget preview
 */
export interface WidgetColors {
    background: string;
    text: string;
    stars: string;
    links: string;
    buttons: string;
    border: string;
    shadow: string;
}

/**
 * Font configuration for widget preview
 */
export interface WidgetFonts {
    family: string;
    titleSize: string;
    textSize: string;
    weight: string;
}

/**
 * Layout configuration for widget preview
 */
export interface WidgetLayout {
    padding: string;
    borderRadius: string;
    spacing: string;
    maxHeight: string;
    width: string;
}

/**
 * Base configuration for widget preview component
 */
export interface WidgetPreviewConfig {
    // Core display properties
    placeId: string;
    displayMode: DisplayType | string; // Allow string for backward compatibility
    theme: 'light' | 'dark' | string; // Allow string for backward compatibility
    
    // Content filtering options
    maxReviews: number;
    minRating: number;
    
    // Display options
    showRatings: boolean;
    showDates: boolean;
    showPhotos: boolean;
    autoplaySpeed: number;
    
    // Appearance settings
    colors?: WidgetColors;
    fonts?: WidgetFonts;
    layout?: WidgetLayout;
    
    // Sorting options
    sortBy?: 'newest' | 'highest' | 'lowest' | string;
    maxReviewAge?: number; // in days
    
    // Optional properties used by dashboard components
    allowedDomains?: string; 
    isActive?: boolean;
}
