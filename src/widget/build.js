/**
 * Build script for Google Reviews Widget
 * 
 * Minifies and optimizes the widget loader script
 */

const fs = require('fs');
const path = require('path');
const { minify } = require('terser');
const zlib = require('zlib');

// Paths
const SRC_FILE = path.join(__dirname, 'widget-loader.js');
const DIST_DIR = path.join(__dirname, '..', '..', 'dist');
const DIST_FILE = path.join(DIST_DIR, 'google-reviews-widget.min.js');

// Ensure dist directory exists
if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
}

// Read source file
const sourceCode = fs.readFileSync(SRC_FILE, 'utf8');

// Minify options
const terserOptions = {
    compress: {
        dead_code: true,
        drop_console: false,
        drop_debugger: true,
        keep_classnames: false,
        keep_fargs: true,
        keep_fnames: false,
        passes: 3
    },
    mangle: {
        toplevel: true,
        keep_classnames: false,
        keep_fnames: false
    },
    format: {
        comments: false
    }
};

async function build() {
    try {
        // Minify the code
        console.log('Minifying widget code...');
        const minified = await minify(sourceCode, terserOptions);
        
        // Write minified file
        fs.writeFileSync(DIST_FILE, minified.code);
        console.log(`Minified file written to ${DIST_FILE}`);
        
        // Check file size
        const minifiedSize = Buffer.byteLength(minified.code, 'utf8');
        console.log(`Minified size: ${(minifiedSize / 1024).toFixed(2)} KB`);
        
        // Check gzipped size
        const gzipped = zlib.gzipSync(minified.code);
        const gzippedSize = gzipped.length;
        console.log(`Gzipped size: ${(gzippedSize / 1024).toFixed(2)} KB`);
        
        // Write gzipped version for reference
        fs.writeFileSync(`${DIST_FILE}.gz`, gzipped);
        
        if (gzippedSize > 5 * 1024) {
            console.warn('⚠️ Warning: Gzipped size exceeds 5KB target!');
        } else {
            console.log('✅ Gzipped size is under 5KB target!');
        }
    } catch (error) {
        console.error('Error during build:', error);
        process.exit(1);
    }
}

build();
