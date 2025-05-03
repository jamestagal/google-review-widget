-- Check if api_calls table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'api_calls'
) AS api_calls_table_exists;

-- Check if analytics column exists in widget_projects
SELECT EXISTS (
   SELECT FROM information_schema.columns 
   WHERE table_schema = 'public'
   AND table_name = 'widget_projects'
   AND column_name = 'analytics'
) AS widget_projects_analytics_exists;

-- Check if api_usage column exists in widget_projects
SELECT EXISTS (
   SELECT FROM information_schema.columns 
   WHERE table_schema = 'public'
   AND table_name = 'widget_projects'
   AND column_name = 'api_usage'
) AS widget_projects_api_usage_exists;

-- Check if track_widget_impression function exists
SELECT EXISTS (
   SELECT FROM pg_proc
   WHERE proname = 'track_widget_impression'
) AS track_widget_impression_exists;

-- List all columns in widget_projects table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'widget_projects';
