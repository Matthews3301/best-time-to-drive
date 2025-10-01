<template>
  <div class="blog-post-page">
    <header class="blog-post-header" :style="{ backgroundImage: blogPost?.bannerImage ? `url(${blogPost.bannerImage})` : 'none' }">
      <div class="blog-post-header-overlay"></div>
      <div class="blog-post-header-content">
        <div class="breadcrumb">
          <NuxtLink to="/" class="breadcrumb-link">Rush Hour Planner</NuxtLink>
          <span class="breadcrumb-separator">›</span>
          <NuxtLink to="/blog" class="breadcrumb-link">Blog</NuxtLink>
        </div>
        
        <h1 class="blog-post-title">{{ blogPost?.title }}</h1>
        
        <div class="blog-post-description" v-if="blogPost?.description">
          <p class="lead">{{ blogPost.description }}</p>
        </div>
        
        <div class="blog-post-meta" style="display: none;">
          <div class="blog-post-keywords" v-if="blogPost?.keywords">
            <span class="keywords-label">Topics:</span>
            <span class="keywords-list">{{ blogPost.keywords.join(', ') }}</span>
          </div>
        </div>
      </div>
    </header>

    <main class="blog-post-main">
      <div class="blog-post-container">
        <div v-if="loading" class="loading-state">
          <p>Loading blog post...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <p>Error loading blog post: {{ error }}</p>
        </div>

        <div v-else-if="!blogPost" class="not-found-state">
          <h2>Blog Post Not Found</h2>
          <p>The blog post you're looking for doesn't exist.</p>
          <NuxtLink to="/blog" class="back-link">← Back to Blog</NuxtLink>
        </div>

        <article v-else class="blog-post-content">
          <div class="blog-post-body" v-html="renderedMarkdown"></div>
        </article>
      </div>
    </main>

    <footer class="blog-post-footer">
      <div class="footer-content">
        <NuxtLink to="/blog" class="contact-link">
          ← Back to Blog
        </NuxtLink>
        <span class="footer-separator">•</span>
        <NuxtLink to="/" class="contact-link">
          Rush Hour Planner
        </NuxtLink>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { marked } from 'marked'

const route = useRoute()

// Use Nuxt's useAsyncData for SSR support
const { data: blogPost, pending: loading, error } = await useAsyncData(`blog-post-${route.params.blog_title}`, async () => {
  const blogTitle = route.params.blog_title
  
  // Use server API route for SSR support
  return await $fetch(`/api/blog-posts/${blogTitle}`)
})

// SEO Meta - computed based on blog post data
const seoTitle = computed(() => {
  if (!blogPost.value) return 'Blog Post - Rush Hour Planner'
  return `${blogPost.value.title} - Rush Hour Planner Blog`
})

const seoDescription = computed(() => {
  if (!blogPost.value) return 'Read our blog for traffic tips and commuting insights.'
  return blogPost.value.description || `Learn about ${blogPost.value.title} and get traffic tips from Rush Hour Planner.`
})

const seoKeywords = computed(() => {
  if (!blogPost.value) return 'traffic blog, commuting tips, rush hour'
  return blogPost.value.keywords ? blogPost.value.keywords.join(', ') : 'traffic blog, commuting tips, rush hour'
})

// Set dynamic SEO meta
useHead(() => ({
  title: seoTitle.value,
  meta: [
    { name: 'description', content: seoDescription.value },
    { name: 'keywords', content: seoKeywords.value },
    { property: 'og:title', content: seoTitle.value },
    { property: 'og:description', content: seoDescription.value },
    { property: 'og:type', content: 'article' },
    { property: 'og:url', content: `https://rushhourplanner.com/blog/${route.params.blog_title}` },
    { property: 'og:image', content: blogPost.value?.bannerImage || 'https://rushhourplanner.com/og-image.jpg' },
    { property: 'twitter:card', content: 'summary_large_image' },
    { property: 'twitter:title', content: seoTitle.value },
    { property: 'twitter:description', content: seoDescription.value },
    { property: 'twitter:image', content: blogPost.value?.bannerImage || 'https://rushhourplanner.com/og-image.jpg' }
  ],
  link: [
    { rel: 'canonical', href: `https://rushhourplanner.com/blog/${route.params.blog_title}` }
  ]
}))

// Render markdown content
const renderedMarkdown = computed(() => {
  if (!blogPost.value?.markdownText) return ''
  return marked(blogPost.value.markdownText)
})
</script>

<style scoped>
.blog-post-page {
  min-height: 100vh;
  background: #eaeaea;
  font-family: 'Inter', sans-serif;
}

.blog-post-header {
  position: relative;
  padding: 3rem 2rem 4rem;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  min-height: 60vh;
  display: flex;
  align-items: center;
}

.blog-post-header-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.76);
  z-index: 1;
}

.blog-post-header-content {
  position: relative;
  z-index: 2;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
}

.breadcrumb-link {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  transition: color 0.3s ease;
}

.breadcrumb-link:hover {
  color: #ffffff;
  text-decoration: underline;
}

.breadcrumb-separator {
  color: rgba(255, 255, 255, 0.6);
}

.breadcrumb-current {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.blog-post-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 2rem 0;
  line-height: 1.2;
  letter-spacing: -0.02em;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}


.blog-post-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.blog-post-keywords {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.keywords-label {
  color: #64748b;
  font-weight: 500;
  font-size: 0.875rem;
}

.keywords-list {
  color: #94a3b8;
  font-size: 0.875rem;
  font-style: italic;
}

.blog-post-main {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.blog-post-container {
  background: transparent;
}

.loading-state,
.error-state,
.not-found-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #64748b;
  font-size: 1.125rem;
}

.error-state {
  color: #dc2626;
}

.not-found-state h2 {
  color: #1a1d29;
  margin-bottom: 1rem;
}

.back-link {
  color: #6366f1;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.back-link:hover {
  color: #4f46e5;
  text-decoration: underline;
}

.blog-post-content {
  padding: 0;
}

.blog-post-description {
  margin-bottom: 2rem;
}

.lead {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.7;
  margin: 0;
  font-weight: 400;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.blog-post-body {
  line-height: 1.7;
  color: #1a1d29;
}

.blog-post-body :deep(h1),
.blog-post-body :deep(h2),
.blog-post-body :deep(h3),
.blog-post-body :deep(h4),
.blog-post-body :deep(h5),
.blog-post-body :deep(h6) {
  color: #1a1d29;
  margin: 2rem 0 1rem 0;
  font-weight: 600;
  line-height: 1.3;
}

.blog-post-body :deep(h1) {
  font-size: 2rem;
}

.blog-post-body :deep(h2) {
  font-size: 1.75rem;
}

.blog-post-body :deep(h3) {
  font-size: 1.5rem;
}

.blog-post-body :deep(h4) {
  font-size: 1.25rem;
}

.blog-post-body :deep(p) {
  margin: 0 0 1.5rem 0;
  color: #475569;
}

.blog-post-body :deep(ul),
.blog-post-body :deep(ol) {
  margin: 0 0 1.5rem 0;
  padding-left: 2rem;
}

.blog-post-body :deep(li) {
  margin: 0 0 0.5rem 0;
  color: #475569;
}

.blog-post-body :deep(blockquote) {
  margin: 2rem 0;
  padding: 1.5rem;
  background: rgba(99, 102, 241, 0.05);
  border-left: 4px solid #6366f1;
  border-radius: 0 8px 8px 0;
  font-style: italic;
  color: #475569;
}

.blog-post-body :deep(code) {
  background: rgba(99, 102, 241, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  color: #6366f1;
}

.blog-post-body :deep(pre) {
  background: #1a1d29;
  color: #e2e8f0;
  padding: 1.5rem;
  border-radius: 8px;
  overflow-x: auto;
  margin: 2rem 0;
}

.blog-post-body :deep(pre code) {
  background: none;
  padding: 0;
  color: inherit;
}

.blog-post-body :deep(a) {
  color: #6366f1;
  text-decoration: none;
  transition: color 0.3s ease;
}

.blog-post-body :deep(a:hover) {
  color: #4f46e5;
  text-decoration: underline;
}

.blog-post-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 2rem 0;
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.1),
    0 2px 4px rgba(0, 0, 0, 0.06);
}

.blog-post-footer {
  text-align: center;
  padding: 2rem 0;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  margin-top: 4rem;
}

.footer-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.contact-link {
  color: #6366f1;
  text-decoration: none;
  transition: color 0.3s ease;
  font-weight: 500;
}

.contact-link:hover {
  color: #4f46e5;
  text-decoration: underline;
}

.footer-separator {
  color: #94a3b8;
}

@media (max-width: 768px) {
  .blog-post-header {
    padding: 2rem 1rem 3rem;
    min-height: 50vh;
  }
  
  .blog-post-title {
    font-size: 2rem;
  }
  
  .blog-post-main {
    padding: 1rem;
  }
  
  .blog-post-body :deep(h1) {
    font-size: 1.75rem;
  }
  
  .blog-post-body :deep(h2) {
    font-size: 1.5rem;
  }
  
  .blog-post-body :deep(h3) {
    font-size: 1.25rem;
  }
}

@media (max-width: 480px) {
  .blog-post-header {
    padding: 1.5rem 1rem 2rem;
    min-height: 40vh;
  }
  
  .blog-post-title {
    font-size: 1.75rem;
  }
  
  .lead {
    font-size: 1.125rem;
  }
  
  .footer-content {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
