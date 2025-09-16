import { popularRoutes } from '../data/topRoutes';
import { readFile } from 'fs/promises';
import { join } from 'path';

export default defineEventHandler(async (event) => {
  const baseUrl = 'https://rushhourplanner.com';
  const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  // Start building the XML
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  // Add the main homepage
  xml += '  <url>\n';
  xml += `    <loc>${baseUrl}</loc>\n`;
  xml += `    <lastmod>${currentDate}</lastmod>\n`;
  xml += '    <changefreq>weekly</changefreq>\n';
  xml += '    <priority>1.0</priority>\n';
  xml += '  </url>\n';
  
  // Add the blog index page
  xml += '  <url>\n';
  xml += `    <loc>${baseUrl}/blog</loc>\n`;
  xml += `    <lastmod>${currentDate}</lastmod>\n`;
  xml += '    <changefreq>weekly</changefreq>\n';
  xml += '    <priority>0.8</priority>\n';
  xml += '  </url>\n';
  
  // Add blog posts
  try {
    const blogPostsPath = join(process.cwd(), 'public', 'blog-posts.json');
    const blogPostsData = await readFile(blogPostsPath, 'utf-8');
    const blogPosts = JSON.parse(blogPostsData);
    
    if (blogPosts.posts && Array.isArray(blogPosts.posts)) {
      for (const post of blogPosts.posts) {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/blog/${post.slug}</loc>\n`;
        xml += `    <lastmod>${currentDate}</lastmod>\n`;
        xml += '    <changefreq>monthly</changefreq>\n';
        xml += '    <priority>0.7</priority>\n';
        xml += '  </url>\n';
      }
    }
  } catch (error) {
    console.error('Error loading blog posts for sitemap:', error);
    // Continue without blog posts if there's an error
  }
  
  // Add dynamic routes based on the hardcoded data
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
  
  // Set the response headers
  setHeader(event, 'Content-Type', 'application/xml');
  setHeader(event, 'Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
  
  return xml;
});
