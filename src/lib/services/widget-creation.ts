/**
 * Widget creation service - client-side types
 * 
 * Provides types for widget creation operations. All actual database operations
 * are now handled in the server-side implementation.
 */

/**
 * Error types for widget creation failures
 */
type PostgresError = {
    code: string;
    message: string;
    details?: string;
    hint?: string;
    constraint?: string;
  };
  
  type ErrorDetails = PostgresError | Error | Record<string, unknown> | null;
  
  export class WidgetCreationError extends Error {
    public readonly code: string;
    public readonly details: ErrorDetails;
    public readonly step: string;
    
    constructor(message: string, code: string, step: string, details?: ErrorDetails) {
      super(message);
      this.name = 'WidgetCreationError';
      this.code = code;
      this.step = step;
      this.details = details || null;
    }
  }
  
  /**
   * Widget Creation Input Data Types
   */
  export interface BusinessProfileInput {
    user_id: string;
    google_place_id: string;
    business_name: string;
    business_address?: string | null;
  }
  
  interface FilterSettings {
    minRating: number;
    maxAge: number;
    sortBy: string;
  }
  
  interface DisplaySettings {
    showHeader: boolean;
    showRating: boolean;
    showPhotos: boolean;
    reviewLimit: number;
    width: string;
    height: string;
  }
  
  interface ColorSettings {
    background: string;
    text: string;
    stars: string;
    links: string;
    buttons: string;
  }
  
  interface FontSettings {
    family: string;
    titleSize: string;
    bodySize: string;
    weight: string;
  }
  
  export interface WidgetProjectInput {
    user_id: string;
    business_profile_id?: string; // Optional as it will be set during transaction
    name: string;
    display_type: string;
    theme: string;
    filters?: FilterSettings;
    display?: DisplaySettings;
    colors?: ColorSettings;
    fonts?: FontSettings;
    api_key?: string | null; // Typically null to trigger auto-generation
  }
  
  interface CustomSettings {
    theme?: string;
    displayMode?: string;
    maxReviews?: number;
    minRating?: number;
    showRatings?: boolean;
    showDates?: boolean;
    showPhotos?: boolean;
    autoplaySpeed?: number;
  }
  
  export interface WidgetApiKeyInput {
    user_id: string;
    subscription_tier: string;
    allowed_domains?: string[] | null;
    custom_settings?: CustomSettings | null;
  }
  
  export interface WidgetCreationInput {
    businessProfile: BusinessProfileInput;
    widgetProject: Omit<WidgetProjectInput, 'business_profile_id'>;
    widgetApiKey?: Partial<WidgetApiKeyInput>;
  }
  
  export interface WidgetCreationResult {
    businessProfile: BusinessProfileInput & { id: string };
    widgetProject: WidgetProjectInput & { id: string };
    apiKey: string;
  }
  
  /**
   * Generate a unique API key for a widget
   * 
   * @param tier The subscription tier
   * @returns A unique API key
   */
  export function generateApiKey(tier = 'FREE') {
    // Convert tier to lowercase and keep only letters
    const tierPrefix = tier.toLowerCase().replace(/[^a-z]/g, '');
    // Create random part
    const randomPart = Math.random().toString(36).substring(2, 15);
    // Create a timestamp part
    const timestampPart = Date.now().toString(36);
    
    // Format: grw_tier_random_timestamp
    return `grw_${tierPrefix}_${randomPart}_${timestampPart}`;
  }