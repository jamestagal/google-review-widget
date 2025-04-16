# Google Reviews Widget Component Architecture

This document provides an overview of the component architecture used in the Google Reviews Widget project. The application uses a modular approach with well-organized components and state management.

## Core Components Structure

### Widget Editor Components

- **`widget-editor.svelte`** - The main editor component that handles the entire editing experience, including form submission, data binding, and layout structure.
- **`widget-editor-header.svelte`** - Provides the header with back button, title, and save/delete actions for easy navigation.
- **`widget-editor-tabs.svelte`** - Manages the tab navigation structure for different editing sections, improving organization of the configuration interface.

### Tab-Based Settings

- **`general-settings-tab.svelte`** - Basic widget info, business details, domain restrictions.
- **`appearance-settings-tab.svelte`** - Colors, fonts, and visual styling options.
- **`display-settings-tab.svelte`** - Layout types, display options, dimensions.
- **`embed-code-tab.svelte`** - Generates and displays the code for embedding the widget on websites.

### Preview Components

- **`widget-preview.svelte`** - Renders a live preview of the widget with sample reviews that updates as settings change.
- **`widget-preview-panel.svelte`** - Wraps the preview in a card with title and context for better UI integration.

### List Components

- **`widget-card.svelte`** - Displays a widget in a list/grid view with actions for quick management.
- **`widget-empty-state.svelte`** - Shows a placeholder when no widgets exist with a button to create a new one.

## State Management

The application uses a well-structured Svelte store system:

- **`widget-editor-store.ts`** - Central store for widget data with:
  - Main widget state (writable store)
  - Derived stores for appearance, display, filters
  - Helper functions for updating specific parts of the widget
  - Proper typing for all widget properties
  - Default values and fallbacks for missing properties

## Key Architectural Patterns

1. **Micro-Component Approach**:
   Each responsibility is isolated to its own component, making the code modular and maintainable. This allows easier testing, debugging, and future enhancements.

2. **Store-Based State Management**:
   The widget configuration is managed through a Svelte store with derived states for specific sections. This centralizes state logic and reduces prop drilling.

3. **Real-Time Preview**:
   The widget-preview component updates dynamically as configuration changes, providing immediate visual feedback to users.

4. **Defensive Programming**:
   The code handles missing or undefined values well with defaults and fallbacks, preventing UI errors from incomplete data.

5. **Type Safety**:
   TypeScript interfaces are used throughout to ensure type safety and provide better development experience.

## Widget Configuration Features

The widget system supports numerous configuration options:

### Display Types
- Grid
- Carousel
- List
- Badge
- Slider
- Floating Badge
- Review Wall

### Visual Styling
- Theme selection (light/dark)
- Color customization (background, text, stars, links, buttons)
- Font selection and sizing
- Container dimensions and spacing

### Content Controls
- Show/hide business header
- Show/hide reviewer photos
- Show/hide star ratings
- Show/hide review dates

### Filtering and Sorting
- Minimum rating filter
- Maximum review age
- Sort order (newest, highest rating, etc.)
- Review limit control

### Embedding Controls
- Domain restrictions
- Generated embed code (script and div tags)
- Copy-to-clipboard functionality

## Technical Implementation

The components use:
- **ShadCN UI components** (Button, Card, Select, etc.) for consistent UI elements
- **Tailwind CSS** for styling and responsive design
- **SvelteKit** for routing and application structure
- **Cloudflare** for hosting and content delivery
- **Supabase** for database storage and authentication

## Data Flow

1. User edits widget settings through tab-based interface
2. Changes update the central widget store
3. Derived stores trigger UI updates in relevant components
4. Preview component automatically reflects changes
5. When saved, data is sent to Supabase
6. Embed code is generated based on current configuration

## Best Practices Implemented

- **Separation of concerns** between display, logic, and state
- **Progressive enhancement** with browser environment checks
- **Responsive design** for both the editor and the widget itself
- **Accessibility** considerations with proper labels and ARIA attributes
- **Error handling** with validation and fallbacks
- **Loading states** for asynchronous operations

This architecture provides a flexible, maintainable foundation for the Google Reviews Widget, allowing for easy expansion of features and customization options.
