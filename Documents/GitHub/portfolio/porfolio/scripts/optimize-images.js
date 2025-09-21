/**
 * Image Optimization Script
 * 
 * This script optimizes and resizes large images to improve website performance.
 * Run with: node scripts/optimize-images.js
 * 
 * Requirements:
 * - npm install sharp
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Configuration
const IMAGE_DIRS = [
  path.join(__dirname, '../public/images/namibia'),
  path.join(__dirname, '../public/images/projects'),
  path.join(__dirname, '../public/images/profile')
];

const SIZES = {
  hero: { width: 1200 },  // Hero images (full width)
  card: { width: 800 },   // Card images (in grids)
  thumbnail: { width: 400 } // Small thumbnails
};

// Output directory for optimized images (preserves original)
const OUTPUT_DIR = path.join(__dirname, '../public/images/optimized');

// Make sure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Process images
async function optimizeImages() {
  // Create a counter for stats
  const stats = {
    processed: 0,
    skipped: 0,
    totalSavings: 0
  };

  // Process all image directories
  for (const dir of IMAGE_DIRS) {
    const dirName = path.basename(dir);
    const outDir = path.join(OUTPUT_DIR, dirName);
    
    // Create output subdirectory
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    
    // Get all image files
    const files = fs.readdirSync(dir).filter(file => 
      /\.(jpg|jpeg|png)$/i.test(file)
    );
    
    // Process each file
    for (const file of files) {
      try {
        const inputPath = path.join(dir, file);
        const stats = fs.statSync(inputPath);
        const originalSize = stats.size / 1024; // KB
        
        // Create output paths for different sizes
        const fileNameWithoutExt = path.parse(file).name;
        const ext = '.webp'; // Convert all to WebP for better compression
        
        // Check if file is large enough to resize
        const image = sharp(inputPath);
        const metadata = await image.metadata();
        
        // Determine which sizes to create based on dimensions
        let sizesToCreate = [];
        if (metadata.width > SIZES.hero.width) {
          sizesToCreate.push('hero');
        }
        if (metadata.width > SIZES.card.width) {
          sizesToCreate.push('card');
        }
        if (metadata.width > SIZES.thumbnail.width) {
          sizesToCreate.push('thumbnail');
        }
        
        // Create and optimize each size
        for (const size of sizesToCreate) {
          const outFileName = `${fileNameWithoutExt}-${size}${ext}`;
          const outputPath = path.join(outDir, outFileName);
          
          await image
            .resize({ width: SIZES[size].width })
            .webp({ quality: 80 })
            .toFile(outputPath);
          
          const newSize = fs.statSync(outputPath).size / 1024; // KB
          const savings = originalSize - newSize;
          stats.totalSavings += savings;
          
          console.log(`✅ Optimized: ${file} → ${outFileName}`);
          console.log(`   Size: ${originalSize.toFixed(2)} KB → ${newSize.toFixed(2)} KB (saved ${savings.toFixed(2)} KB, ${((savings/originalSize)*100).toFixed(2)}%)`);
        }
        
        stats.processed++;
      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
        stats.skipped++;
      }
    }
  }
  
  // Print summary
  console.log('\n----- Optimization Summary -----');
  console.log(`Total files processed: ${stats.processed}`);
  console.log(`Total files skipped: ${stats.skipped}`);
  console.log(`Total space saved: ${(stats.totalSavings / 1024).toFixed(2)} MB`);
  console.log('-------------------------------\n');
  console.log('Optimized images are available in the public/images/optimized directory.');
  console.log('To use them, update your image paths in the code.');
}

// Run the optimizer
optimizeImages().catch(err => {
  console.error('Error in image optimization process:', err);
  process.exit(1);
}); 