# Google Reviews Widget: Developer Specification
*Built on SaaS Kit boilerplate*

## 1. Product Overview

### 1.1 Purpose
A lightweight, high-performance Google reviews widget that can be easily embedded on websites, displaying reviews from Google Business Profiles while maintaining minimal impact on page load times. The solution will be offered as a SaaS product.

### 1.2 Target Users
- Website developers
- Technically savvy business owners
- Marketing professionals managing business websites

### 1.3 Core Value Proposition
- Ultra-lightweight (<5KB gzipped) widget
- Asynchronous loading with zero impact on page performance
- Easy installation with minimal technical knowledge required
- Customizable appearance and review display

### 1.4 Pricing Tiers
- **Free**: 1 widget, 200 views/month, Elfsight branding, limited features
- **Basic** ($5/mo): 3 widgets, 5,000 views/month, no branding, basic support
- **Pro** ($10/mo): 9 widgets, 50,000 views/month, 3 projects, 1 collaborator, priority support
- **Premium** ($20/mo): 21 widgets, 150,000 views/month, 9 projects, 3 collaborators, live chat support

## 2. Technical Architecture

### 2.1 Infrastructure
- **Web Framework**: SvelteKit (from SaaS Kit boilerplate)
- **CSS/Styling**: TailwindCSS with shadcn-svelte components
- **Hosting**: Cloudflare Pages
- **API Functionality**: Cloudflare Workers
- **Caching & Configuration**: Cloudflare KV
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **Asset Storage**: Cloudflare R2
- **Billing**: Stripe Checkout (integrated with SaaS Kit)

### 2.2 Installation Methods

#### 2.2.1 JavaScript Snippet
```html
<script>
  window.__gr = window.__gr || {};
  window.__gr.id = "your-api-key";
  // Optional configurations
  window.__gr.theme = "light";
  (function(w,d,s,o){
    var j=d.createElement(s);j.async=true;j.src='https://cdn.googlereviews.app/widget.js';
    d.head.appendChild(j);
    if(!w.__gr.asyncInit) j.onload = function(){ w.GoogleReviews.init() };
  })(window,document,'script');
</script>
```

#### 2.2.2 HTML Attributes Installation
```html
<div 
  data-googlereviews="YOUR-API-KEY"
  data-display="carousel"
  data-theme="light"
  data-min-rating="4">
</div>
```

### 2.3 Performance Requirements
- **Initial Response**: TTFB under 100ms
- **Complete Widget Load**: Total load time of 1-2 seconds
- **Size Constraint**: <5KB gzipped for initial loader script
- **Global Distribution**: All major geographic regions with optimized edge caching

### 2.4 Data Flow Architecture
1. Client website loads the lightweight widget script
2. Widget requests review data from Cloudflare Worker
3. Worker checks cache in KV storage
4. If cache miss, Worker securely fetches data from Google Places API
5. Data is transformed, cached, and returned to widget
6. Widget renders the reviews according to configuration

### 2.5 Building on SaaS Kit Boilerplate
This project will leverage the existing SaaS Kit boilerplate infrastructure:
- Existing user authentication (Supabase Auth)
- Marketing site framework
- User dashboard structure
- Subscription management via Stripe
- Contact form
- CI/CD workflows

## 3. Data Storage and Models

### 3.1 Data Models
These models will be implemented in Supabase PostgreSQL database.

#### 3.1.1 User Account
*Note: Leveraging the existing SaaS Kit user model in Supabase Auth*

```sql
-- This is handled by Supabase Auth, with subscription data managed by their integration with Stripe
-- We'll extend the existing users table with any additional fields needed
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS metadata JSONB;
```

#### 3.1.2 Business Profile
```sql
CREATE TABLE business_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  google_place_id TEXT NOT NULL,
  business_name TEXT NOT NULL,
  business_address TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX business_profiles_user_id_idx ON business_profiles(user_id);
```

#### 3.1.3 Widget Configuration (Projects)
```sql
CREATE TABLE widget_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_profile_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_type TEXT NOT NULL CHECK (display_type IN ('carousel', 'grid', 'list', 'badge', 'slider', 'floating-badge', 'review-wall')),
  theme TEXT NOT NULL DEFAULT 'light',
  colors JSONB NOT NULL DEFAULT '{"background":"#ffffff","text":"#000000","stars":"#FFD700","links":"#0070f3","buttons":"#0070f3"}',
  fonts JSONB NOT NULL DEFAULT '{"family":"inherit","titleSize":"1.25rem","bodySize":"1rem","weight":"normal"}',
  filters JSONB NOT NULL DEFAULT '{"minRating":1,"maxAge":365,"sortBy":"newest"}',
  display JSONB NOT NULL DEFAULT '{"showHeader":true,"showRating":true,"showPhotos":true,"reviewLimit":10,"width":"100%","height":"auto"}',
  api_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX widget_projects_user_id_idx ON widget_projects(user_id);
CREATE INDEX widget_projects_business_profile_id_idx ON widget_projects(business_profile_id);
```

#### 3.1.4 Review Cache
```sql
CREATE TABLE review_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_profile_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
  reviews JSONB NOT NULL DEFAULT '[]',
  aggregate_rating NUMERIC(3,2),
  review_count INTEGER,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX review_cache_business_profile_id_idx ON review_cache(business_profile_id);
```

#### 3.1.5 Analytics Data
```sql
CREATE TABLE analytics_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  widget_id UUID REFERENCES widget_projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{"impressions":0,"clicks":0,"ctr":0,"reviewClicks":0,"ctaClicks":0}',
  UNIQUE(widget_id, date)
);

CREATE INDEX analytics_daily_widget_id_date_idx ON analytics_daily(widget_id, date);
```

### 3.2 Storage Strategy

#### 3.2.1 Supabase PostgreSQL (Relational)
- User accounts (via Supabase Auth)
- Business profiles
- Widget configurations
- Projects and collaborators
- Detailed analytics data
- Subscription management (integrated with Stripe)

#### 3.2.2 Cloudflare KV (Key-Value)
- Cached review data (with tier-based TTLs)
- Widget configuration quick lookups
- Session data
- Rate limiting information

#### 3.2.3 Cloudflare R2 (Object Storage)
- Media content (business logos, reviewer images)
- Historical analytics data archives
- Backup data

### 3.3 Caching Strategy
- **Free tier**: 24-hour cache refresh
- **Basic tier**: 12-hour cache refresh
- **Pro tier**: 6-hour cache refresh
- **Premium tier**: 3-hour cache refresh
- **Browser caching**: Appropriate cache headers for static assets
- **Edge caching**: Distributed caching at CDN level
- **Staggered refreshes**: To prevent API quota exhaustion

## 4. Widget Functionality

### 4.1 Display Formats
- **Carousel**: Scrolling horizontal layout
- **Grid**: Responsive grid layout
- **List**: Vertical list layout
- **Badge**: Compact floating badge 
- **Slider**: Full-width slider layout
- **Floating Badge**: Fixed-position badge that follows scrolling
- **Review Wall**: Masonry-style layout

### 4.2 Customization Options

#### 4.2.1 Visual Customization
- Header display and styling
- Star color and size
- Background colors/transparency
- Text styling (font, size, color)
- Custom dimensions (width/height)
- Layout parameters (spacing, padding)
- Light/dark theme support
- Container styling (borders, shadows, etc.)

#### 4.2.2 Content Customization
- Minimum rating filter
- Review sorting (newest, highest rated, etc.)
- Maximum review age
- Review count per page/view
- Show/hide reviewer photos
- Show/hide review date
- Text length limitations
- Custom header text

### 4.3 Interactivity Features
- Click to expand truncated reviews
- Navigation controls (arrows, dots)
- Pagination
- Lazy loading on scroll
- "Write a review" call-to-action
- Direct link to Google listing

### 4.4 Responsive Behavior
- Mobile-optimized layouts
- Adaptive sizing based on container
- Touch-friendly controls
- Minimum legible text size enforcement

## 5. JavaScript API

### 5.1 Installation
```javascript
// Async initialization
window.__gr = window.__gr || {};
window.__gr.id = "your-api-key";
window.__gr.asyncInit = true;

// Later in code
GoogleReviews.init();
```

### 5.2 Display Control Methods
```javascript
// Show or hide the widget
GoogleReviews.call('show');
GoogleReviews.call('hide');

// Expand or collapse expandable widgets
GoogleReviews.call('maximize');
GoogleReviews.call('minimize');

// Change display format dynamically
GoogleReviews.call('setDisplayFormat', 'carousel');
GoogleReviews.call('setDisplayFormat', 'grid');
```

### 5.3 Content Control Methods
```javascript
// Filter reviews
GoogleReviews.call('filterReviews', { 
  minRating: 4, 
  maxAge: 90 // days
});

// Sort reviews
GoogleReviews.call('sortReviews', 'newest');
GoogleReviews.call('sortReviews', 'highest');

// Force refresh of review data
GoogleReviews.call('refreshData');

// Load additional reviews
GoogleReviews.call('loadMore', 5);
```

### 5.4 Styling Methods
```javascript
// Change theme
GoogleReviews.call('setTheme', 'light');
GoogleReviews.call('setTheme', 'dark');

// Update colors
GoogleReviews.call('setColors', { 
  background: '#fff', 
  text: '#000', 
  stars: '#FFD700' 
});

// Modify dimensions
GoogleReviews.call('resize', { 
  width: '100%', 
  height: '500px' 
});
```

### 5.5 Event Handlers
```javascript
// Widget loaded and ready
GoogleReviews.on('ready', function() {
  console.log('Widget is ready');
});

// User clicked a review
GoogleReviews.on('reviewClick', function(reviewData) {
  console.log('Review clicked:', reviewData);
});

// User clicked CTA button
GoogleReviews.on('ctaClick', function() {
  console.log('CTA button clicked');
});

// Widget viewed by user
GoogleReviews.on('impression', function() {
  console.log('Widget impression recorded');
});

// User navigated to different page of reviews
GoogleReviews.on('pageChange', function(pageNumber) {
  console.log('Page changed to:', pageNumber);
});
```

## 6. HTML Attributes

### 6.1 Core Display Attributes
```html
<div 
  data-googlereviews="YOUR-API-KEY"
  data-display="carousel"
  data-theme="light"
  data-min-rating="4"
  data-review-limit="10"
  data-sort="latest"
  data-lang="en">
</div>
```

### 6.2 Advanced Attributes
```html
<div 
  data-googlereviews="YOUR-API-KEY"
  data-display="carousel"
  data-theme="light"
  data-min-rating="4"
  data-review-limit="10"
  data-sort="latest"
  data-lang="en"
  
  <!-- Analytics & Engagement -->
  data-show-analytics="true"
  data-analytics-metrics="ratingTrend,reviewVelocity,ratingDistribution,sentimentAnalysis"
  data-show-engagement="true"
  data-engagement-metrics="impressions,clicks,ctr,reviewClicks,viewingTime"
  
  <!-- Business Impact & Competitive Intelligence -->
  data-show-business-impact="true"
  data-conversion-tracking="YOUR_TRACKING_CODE"
  data-competitor-comparison="true">
</div>
```

## 7. Admin Dashboard Features
*Note: Will be built using SvelteKit and shadcn-svelte components from the SaaS Kit boilerplate*

### 7.1 Widget Configuration
- Visual widget builder with live preview
- Template selection and customization
- Color picker and theme controls (using SaaS Kit UI components)
- Layout and spacing controls
- Filter and display settings
- Mobile preview mode

### 7.2 Analytics Dashboard
- **Review Performance**:
  - Rating trends over time
  - Review velocity metrics
  - Rating distribution visualization
  - Sentiment analysis
  
- **Engagement Metrics**:
  - Widget impressions
  - Interaction rates
  - Click-through rates
  - Average viewing time
  
- **Business Impact**:
  - Conversion impact tracking
  - Before/after metrics
  - Referral tracking
  - Customer sentiment word cloud
  
- **Competitive Intelligence**:
  - Industry benchmarking
  - Rating comparisons
  - Review volume comparisons

### 7.3 Multi-profile Management
- Multiple business profile support
- Profile switching interface
- Aggregated multi-location analytics
- Bulk operations and settings

### 7.4 User Management
*Note: Leveraging existing SaaS Kit user management features*
- Role-based access control
- Team member invitations (using SaaS Kit collaborator feature)
- Permission settings
- Activity logs and audit trails

## 8. Security & Compliance

### 8.1 API Key Management
- Server-side proxy for Google API calls
- No client-side exposure of API keys
- Key rotation mechanisms
- Usage monitoring and rate limiting

### 8.2 Data Protection
- TLS/SSL encryption for all data in transit
- Encryption of sensitive data at rest
- Role-based access controls
- Regular security audits

### 8.3 Compliance Implementation
- GDPR-compliant data handling
- CCPA support for California users
- Clear privacy policies and consent mechanisms
- Data minimization practices
- Data retention controls

### 8.4 Authentication Security
*Note: Leveraging Supabase Auth from SaaS Kit*
- Multi-factor authentication for admin dashboard
- Secure session management
- JWT-based authentication with short lifetimes
- Password strength requirements
- OAuth providers integration (Google, GitHub, etc.)

### 8.5 Error Handling Strategy
- Graceful fallbacks for API failures
- User-friendly error messages
- Detailed server-side logging
- Automatic retry mechanisms
- Cache serving during service disruptions

## 9. Third-Party Integrations

### 9.1 CRM Integrations
- Salesforce
- HubSpot
- Zoho CRM
- API framework for custom CRM integrations

### 9.2 eCommerce Platforms
- Shopify (App/Plugin)
- WooCommerce
- Magento
- BigCommerce

### 9.3 Analytics Integration
- Google Analytics connection
- Event tracking integration
- Custom dimension support
- Conversion correlation

### 9.4 Payment Processing
*Note: Leveraging existing Stripe integration from SaaS Kit*
- Stripe Checkout for subscription billing
- Stripe Customer Portal for self-service billing management
- Secure payment processing
- Automatic plan upgrades/downgrades
- Invoice generation

## 10. Implementation Roadmap

### 10.1 Phase 0: SaaS Kit Setup (1 week)
- Set up SaaS Kit boilerplate
- Configure Supabase integration
- Set up Stripe integration
- Configure Cloudflare deployment

### 10.1 Phase 1: Planning & Requirements (2-3 weeks)
- Finalize technical specifications
- Complete UI/UX designs
- Establish development environment
- Leverage existing CI/CD pipeline from SaaS Kit

### 10.2 Phase 2: MVP Development (6-10 weeks)
- Implement core widget functionality
- Extend SaaS Kit dashboard for widget management
- Set up Cloudflare Workers and KV infrastructure
- Leverage existing authentication system
- Integrate with Google Reviews API

### 10.3 Phase 3: Advanced Features (6-8 weeks)
- Add advanced analytics
- Implement additional display formats
- Enhance customization options
- Optimize caching and performance
- Add integration capabilities

### 10.4 Phase 4: Security & Compliance (4-6 weeks)
- Implement security best practices
- Add compliance features
- Conduct security audits
- Perform penetration testing
- Optimize error handling

### 10.5 Phase 5: Testing & Beta Launch
- Conduct unit and integration testing
- Perform load and performance testing
- Run user acceptance testing
- Launch beta version
- Gather initial feedback

### 10.6 Phase 6: Official Launch & Maintenance
- Address beta feedback
- Finalize documentation
- Update existing SaaS Kit marketing website with Google Reviews Widget info
- Implement monitoring systems
- Establish support protocols
- Regular updates to maintain compatibility with SaaS Kit

## 11. Testing Strategy

### 11.1 Unit Testing
- Test individual components (widget, API handlers)
- Test utility functions
- Test rendering logic
- Test data processing

### 11.2 Integration Testing
- Test interactions between components
- Test API integrations
- Test data flow between services
- Test authentication flows

### 11.3 Performance Testing
- Load testing with simulated traffic
- Measure response times under load
- Test caching effectiveness
- Validate resource utilization

### 11.4 Security Testing
- Vulnerability assessments
- Penetration testing
- Authentication security testing
- API security validation

### 11.5 User Acceptance Testing
- Beta tester program
- Feedback collection mechanism
- Usability testing
- Cross-browser/device testing

### 11.6 Automated Testing Setup
- CI/CD integration
- Automated test suites
- Regression testing
- Performance regression monitoring

## 12. Error Handling & Monitoring

### 12.1 Error Types & Responses
- **API Connection Errors**: 
  - Fallback to cached data
  - Retry mechanism with exponential backoff
  - User-friendly error display

- **Configuration Errors**:
  - Default fallback values
  - Admin notifications
  - Validation on save

- **Display/Rendering Errors**:
  - Graceful degradation
  - Minimal viable display options
  - Console diagnostics for developers

### 12.2 Logging Strategy
- Structured logging format
- Error severity classification
- PII/sensitive data filtering
- Retention policies by log type

### 12.3 Monitoring System
- Real-time performance dashboards
- Automated alerts for critical issues
- Usage pattern analysis
- Anomaly detection
- SLA compliance tracking

### 12.4 Incident Response Plan
- Severity classification criteria
- Escalation procedures
- Communication templates
- Post-mortem process

## 13. Documentation

### 13.1 Developer Documentation
- API references
- Implementation guides
- Example code
- Troubleshooting guides
- SaaS Kit integration notes

### 13.2 User Documentation
- Installation guides
- Widget configuration
- Dashboard usage
- Analytics interpretation
- Subscription management (integrated with SaaS Kit docs)

### 13.3 Internal Documentation
- Architecture diagrams
- Database schemas
- Security protocols
- Deployment procedures
- SaaS Kit extension patterns

## 14. SaaS Kit Integration Notes

### 14.1 Extending SaaS Kit
- Custom routes added to the application under `(app)` route group
- New database tables in Supabase while preserving existing schema
- Extension of existing user model rather than replacement
- Consistent styling using shadcn-svelte components

### 14.2 Customization Requirements
- Update SaaS Kit configuration in `src/config.ts` to include Google Reviews branding
- Add widget-specific navigation items to dashboard sidebar
- Implement Google OAuth for simplified business profile connection
- Extend existing billing tiers for Google Reviews functionality

### 14.3 Deployment Process
- Follow existing SaaS Kit deployment to Cloudflare Pages
- Add required environment variables for Google API authentication
- Configure Supabase database with additional tables
- Set up Cloudflare Workers routes for widget API endpoints
