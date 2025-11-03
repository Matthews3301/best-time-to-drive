<template>
  <div class="blog-page">
    <header class="blog-header">
      <div class="blog-header-content">
        <h1 class="blog-title">
          <NuxtLink to="/" class="title-link">
            <img src="/favicon.svg" alt="Rush Hour Planner logo" class="title-logo" />
            Rush Hour Planner
          </NuxtLink> Blog
        </h1>
        <p class="blog-subtitle">Insights, tips, and analysis about traffic patterns, commuting, and optimal travel times</p>
      </div>
    </header>

    <main class="blog-main">
      <div class="blog-container">
        <div v-if="loading" class="loading-state">
          <p>Loading blog posts...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <p>Error loading blog posts: {{ error }}</p>
        </div>

        <div v-else-if="blogPosts.length === 0" class="empty-state">
          <p>No blog posts available yet.</p>
        </div>

        <div v-else class="blog-posts">
          <ul class="blog-posts-list">
            <li v-for="post in blogPosts" :key="post.slug" class="blog-post-item">
              <NuxtLink :to="`/blog/${post.slug}`" class="blog-post-link">
                {{ post.title }}
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>
    </main>

    <footer class="blog-footer">
      <div class="footer-content">
        <NuxtLink to="/" class="contact-link">
          ← Back to Rush Hour Planner
        </NuxtLink>
      </div>
    </footer>
  </div>
</template>

<script setup>
// SEO Meta
useHead({
  title: 'Blog - Rush Hour Planner | Traffic Tips & Commuting Insights',
  meta: [
    { name: 'description', content: 'Read our blog for traffic tips, commuting insights, and analysis about optimal travel times. Learn how to avoid rush hour and plan your commute better.' },
    { name: 'keywords', content: 'traffic blog, commuting tips, rush hour blog, traffic analysis, travel optimization, commute planning, traffic patterns, best time to drive' },
    { property: 'og:title', content: 'Blog - Rush Hour Planner | Traffic Tips & Commuting Insights' },
    { property: 'og:description', content: 'Read our blog for traffic tips, commuting insights, and analysis about optimal travel times. Learn how to avoid rush hour and plan your commute better.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://rushhourplanner.com/blog' },
    { property: 'twitter:card', content: 'summary' },
    { property: 'twitter:title', content: 'Blog - Rush Hour Planner | Traffic Tips & Commuting Insights' },
    { property: 'twitter:description', content: 'Read our blog for traffic tips, commuting insights, and analysis about optimal travel times. Learn how to avoid rush hour and plan your commute better.' }
  ],
  link: [
    { rel: 'canonical', href: 'https://rushhourplanner.com/blog' }
  ]
})

// Use Nuxt's useAsyncData for SSR support
const { data: blogPosts, pending: loading, error } = await useAsyncData('blog-posts', async () => {
  // Use server API route for SSR support
  const response = await $fetch('/api/blog-posts')
  return response.posts || []
})
</script>

<style scoped>
.blog-page {
  min-height: 100vh;
  background: #f3f4f6;
  font-family: 'Inter', sans-serif;
}

.blog-header {
  text-align: center;
  padding: 3rem 2rem 3rem;
  background: linear-gradient(135deg, 
    rgba(99, 102, 241, 0.08) 0%, 
    rgba(139, 92, 246, 0.06) 25%,
    rgba(236, 72, 153, 0.04) 50%,
    rgba(59, 130, 246, 0.06) 75%,
    rgba(16, 185, 129, 0.04) 100%
  );
  backdrop-filter: blur(24px) saturate(150%);
  border-bottom: 1px solid rgba(99, 102, 241, 0.12);
}

.blog-header-content {
  max-width: 800px;
  margin: 0 auto;
}

.blog-title {
  font-size: 3.0rem;
  font-weight: 600;
  background: linear-gradient(135deg,
    #1a1d29 0%,
    #4f46e5 50%,
    #7c3aed 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 1rem 0;
  letter-spacing: -0.05em;
  line-height: 1.1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.title-link {
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg,
    #1a1d29 0%,
    #4f46e5 50%,
    #7c3aed 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: inherit;
  font-size: inherit;
  letter-spacing: inherit;
  line-height: inherit;
  font-family: inherit;
}

.title-logo {
  width: 40px;
  height: 40px;
}

.blog-subtitle {
  font-size: 1.25rem;
  color: #475569;
  margin: 0;
  font-weight: 400;
  line-height: 1.7;
  max-width: 620px;
  margin-left: auto;
  margin-right: auto;
  opacity: 0.9;
}

.blog-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.blog-container {
  display: grid;
  gap: 2rem;
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #64748b;
  font-size: 1.125rem;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 4px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.error-state {
  color: #dc2626;
}

.blog-posts {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 4px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 2rem;
}

.blog-posts-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.blog-post-item {
  margin-bottom: 1rem;
}

.blog-post-item:last-child {
  margin-bottom: 0;
}

.blog-post-link {
  color: #1a1d29;
  text-decoration: none;
  font-size: 1.125rem;
  font-weight: 500;
  transition: color 0.3s ease;
  display: block;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.blog-post-link:hover {
  color: #6366f1;
}

.blog-post-item:last-child .blog-post-link {
  border-bottom: none;
}

.blog-footer {
  text-align: center;
  padding: 2rem 0;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  margin-top: 4rem;
}

.footer-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 0.5rem;
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

@media (max-width: 768px) {
  .blog-header {
    padding: 2rem 1rem 2rem;
  }
  
  .blog-title {
    font-size: 2.5rem;
  }
  
  .title-logo {
    width: 36px;
    height: 36px;
  }
  
  .blog-subtitle {
    font-size: 1.125rem;
  }
  
  .blog-main {
    padding: 1rem;
  }
  
  .blog-posts {
    padding: 1.5rem;
  }
  
  .blog-post-link {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .blog-title {
    font-size: 2rem;
  }
  
  .title-logo {
    width: 32px;
    height: 32px;
  }
  
  .blog-subtitle {
    font-size: 1rem;
  }
  
  .blog-posts {
    padding: 1.25rem;
  }
}
</style>
