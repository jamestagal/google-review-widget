# Google Reviews Widget

A lightweight, asynchronous script for embedding Google reviews on your website.

## Features

- **Lightweight**: Less than 5KB gzipped
- **Asynchronous**: Loads without blocking the page
- **Responsive**: Works on all devices and screen sizes
- **Customizable**: Multiple display modes and themes
- **Flexible Configuration**: Via data attributes or JavaScript object

## Installation

### Quick Install (CDN)

Add this script to your HTML:

```html
<script src="https://cdn.example.com/google-reviews-widget.min.js" 
    data-gr-place-id="YOUR_GOOGLE_PLACE_ID"
    data-gr-api-key="YOUR_WIDGET_API_KEY"></script>
```

Then add a container element where you want the widget to appear:

```html
<div class="gr-widget"></div>
```

### Self-Hosted

1. Download the latest `google-reviews-widget.min.js` file
2. Add it to your website
3. Include the script in your HTML

```html
<script src="/path/to/google-reviews-widget.min.js" 
    data-gr-place-id="YOUR_GOOGLE_PLACE_ID"
    data-gr-api-key="YOUR_WIDGET_API_KEY"></script>
```

## Configuration

The widget can be configured in three ways:

### 1. Via Data Attributes on Script Tag

```html
<script src="/path/to/google-reviews-widget.min.js" 
    data-gr-place-id="YOUR_GOOGLE_PLACE_ID"
    data-gr-api-key="YOUR_WIDGET_API_KEY"
    data-gr-theme="dark"
    data-gr-display-mode="carousel"
    data-gr-max-reviews="5"></script>
```

### 2. Via Data Attributes on Container

```html
<div class="gr-widget" 
    data-gr-place-id="YOUR_GOOGLE_PLACE_ID"
    data-gr-api-key="YOUR_WIDGET_API_KEY"
    data-gr-theme="dark"
    data-gr-display-mode="grid"></div>
```

### 3. Via Global Configuration Object

```html
<script>
    window.__grConfig = {
        placeId: "YOUR_GOOGLE_PLACE_ID",
        apiKey: "YOUR_WIDGET_API_KEY",
        theme: "light",
        displayMode: "list",
        maxReviews: 5
    };
</script>
<script src="/path/to/google-reviews-widget.min.js"></script>
```

## Configuration Options

| Option          | Data Attribute          | Default      | Description                                        |
|-----------------|-------------------------|--------------|----------------------------------------------------|
| `placeId`       | `data-gr-place-id`     | `''`         | Your Google Place ID                               |
| `apiKey`        | `data-gr-api-key`      | `''`         | Your widget API key                                |
| `theme`         | `data-gr-theme`        | `'light'`    | Widget theme (`'light'` or `'dark'`)               |
| `displayMode`   | `data-gr-display-mode` | `'carousel'` | Display mode (`'carousel'`, `'grid'`, or `'list'`) |
| `maxReviews`    | `data-gr-max-reviews`  | `3`          | Maximum number of reviews to display               |
| `minRating`     | `data-gr-min-rating`   | `0`          | Minimum rating (1-5) for reviews to display        |
| `showRatings`   | `data-gr-show-ratings` | `true`       | Show rating stars                                  |
| `showDates`     | `data-gr-show-dates`   | `true`       | Show review dates                                  |
| `showPhotos`    | `data-gr-show-photos`  | `true`       | Show reviewer photos                               |
| `autoplaySpeed` | `data-gr-autoplay-speed` | `5000`     | Carousel autoplay speed in ms (0 to disable)       |
| `apiEndpoint`   | `data-gr-api-endpoint` | `'https://reviews-api.example.com/api/google-reviews'` | API endpoint URL |
| `customStyles`  | N/A                    | `null`       | Custom CSS as string (Global config only)          |

## Display Modes

### Carousel

The default mode, shows one review at a time with navigation controls.

```html
<div class="gr-widget" data-gr-display-mode="carousel"></div>
```

### Grid

Displays reviews in a responsive grid layout.

```html
<div class="gr-widget" data-gr-display-mode="grid"></div>
```

### List

Shows reviews in a vertical list.

```html
<div class="gr-widget" data-gr-display-mode="list"></div>
```

## Themes

### Light Theme (Default)

```html
<div class="gr-widget" data-gr-theme="light"></div>
```

### Dark Theme

```html
<div class="gr-widget" data-gr-theme="dark"></div>
```

## Custom Styling

You can add custom CSS to override the default styles:

```html
<script>
    window.__grConfig = {
        // ... other options
        customStyles: `
            .gr-widget-container {
                --gr-primary-color: #FF5722;
                --gr-star-color: #FF9800;
                --gr-border-radius: 4px;
            }
            
            .gr-review {
                background-color: #f9f9f9;
            }
        `
    };
</script>
```

## CSS Variables

The widget uses CSS variables for easy customization:

| Variable              | Default     | Description                 |
|-----------------------|-------------|-----------------------------|
| `--gr-primary-color`  | `#4285F4`   | Primary accent color        |
| `--gr-text-color`     | `#333`      | Text color                  |
| `--gr-bg-color`       | `#fff`      | Background color            |
| `--gr-border-color`   | `#e0e0e0`   | Border color                |
| `--gr-star-color`     | `#F9AB00`   | Star rating color           |
| `--gr-card-shadow`    | `0 2px 5px rgba(0,0,0,0.1)` | Card shadow |
| `--gr-border-radius`  | `8px`       | Border radius               |

## API Requirements

The widget expects the API to return data in this format:

```json
{
  "status": "success",
  "data": {
    "businessName": "Business Name",
    "rating": 4.5,
    "totalReviews": 100,
    "reviews": [
      {
        "authorName": "Reviewer Name",
        "authorPhotoUrl": "https://example.com/photo.jpg",
        "rating": 5,
        "text": "Review text here",
        "relativeTime": "2 months ago"
      }
    ]
  }
}
```

## Browser Support

The widget supports all modern browsers:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Opera (latest)
- iOS Safari (latest)
- Android Browser (latest)

## Troubleshooting

### Widget Not Displaying

- Check if your API key is valid
- Verify your Google Place ID is correct
- Check the browser console for errors

### Styling Issues

- Inspect the widget elements to see if your custom styles are applied
- Check if the widget styles are loaded properly

## License

This widget is licensed under the MIT License.
