// Test script to verify sitemap generation
// Run with: node scripts/test-sitemap.js

const { popularRoutes } = require('../server/data/topRoutes.ts');

function generateSitemap() {
  const baseUrl = 'https://rushhourplanner.com';
  const currentDate = new Date().toISOString().split('T')[0];
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  // Add the main homepage
  xml += '  <url>\n';
  xml += `    <loc>${baseUrl}</loc>\n`;
  xml += `    <lastmod>${currentDate}</lastmod>\n`;
  xml += '    <changefreq>weekly</changefreq>\n';
  xml += '    <priority>1.0</priority>\n';
  xml += '  </url>\n';
  
  // Add dynamic routes
  for (const route of popularRoutes) {
    const fromEncoded = encodeURIComponent(route.from);
    const toEncoded = encodeURIComponent(route.to);
    const url = `${baseUrl}/?from=${fromEncoded}&amp;exclude=true&amp;to=${toEncoded}`;
    
    xml += '  <url>\n';
    xml += `    <loc>${url}</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>${route.changefreq || 'weekly'}</changefreq>\n`;
    xml += `    <priority>${route.priority || 0.8}</priority>\n`;
    xml += '  </url>\n';
  }
  
  xml += '</urlset>';
  return xml;
}

console.log('Generated Sitemap:');
console.log(generateSitemap());
console.log(`\nTotal routes: ${popularRoutes.length + 1} (including homepage)`);
