<template>
  <div class="team-page">
    <header class="team-header">
      <div class="team-header-content">
        <h1 class="team-title">
          <NuxtLink to="/" class="title-link">
            <img src="/favicon.svg" alt="Rush Hour Planner logo" class="title-logo" />
            Rush Hour Planner
          </NuxtLink>
        </h1>
      </div>
    </header>

    <main class="team-main">
      <div class="team-container">
        <div class="team-members">
          <div class="team-member-card">
            <div class="member-avatar">
              <div class="avatar-placeholder">MS</div>
            </div>
            <div class="member-info">
              <h2 class="member-name">Matthew Salamon</h2>
              <p class="member-role">Founder & Lead Developer</p>
              <p class="member-bio">
                Passionate about solving real-world traffic problems through technology. 
                Building tools to help people save time and reduce stress on their daily commutes.
              </p>
              <div class="member-social">
                <a href="https://x.com/matthews8000" target="_blank" rel="noopener noreferrer" class="social-link">
                  X
                </a>
                <span class="social-separator">•</span>
                <a href="https://www.linkedin.com/in/matthew-salamon-%F0%9F%9F%A7-65556134/" target="_blank" rel="noopener noreferrer" class="social-link">
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <footer class="team-footer">
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
  title: 'Team - Rush Hour Planner | Meet Our Team',
  meta: [
    { name: 'description', content: 'Meet the team behind Rush Hour Planner. We\'re passionate about helping people optimize their travel times and avoid traffic.' },
    { name: 'keywords', content: 'team, about us, rush hour planner team, traffic planning team, developers' },
    { property: 'og:title', content: 'Team - Rush Hour Planner | Meet Our Team' },
    { property: 'og:description', content: 'Meet the team behind Rush Hour Planner. We\'re passionate about helping people optimize their travel times and avoid traffic.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://rushhourplanner.com/team' },
    { property: 'twitter:card', content: 'summary' },
    { property: 'twitter:title', content: 'Team - Rush Hour Planner | Meet Our Team' },
    { property: 'twitter:description', content: 'Meet the team behind Rush Hour Planner. We\'re passionate about helping people optimize their travel times and avoid traffic.' }
  ],
  link: [
    { rel: 'canonical', href: 'https://rushhourplanner.com/team' }
  ]
})
</script>

<style scoped>
.team-page {
  min-height: 100vh;
  background: #f3f4f6;
  font-family: 'Inter', sans-serif;
  overflow-y: scroll;
}

.team-header {
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

.team-header-content {
  max-width: 800px;
  margin: 0 auto;
}

.team-title {
  font-size: 2.4rem;
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
  font-family: 'Inter', -apple-system, 'Roboto', Arial, sans-serif;
  position: relative;
  z-index: 1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
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
  width: 36px;
  height: 36px;
}

.team-subtitle {
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

.team-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.team-container {
  display: grid;
  gap: 2rem;
}

.team-members {
  display: flex;
  gap: 2rem;
  justify-content: center;
  flex-wrap: wrap;
}

.team-member-card {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 4px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 2rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  width: 350px;
  max-width: 100%;
}

.team-member-card:hover {
  box-shadow: 
    0 2px 6px rgba(0, 0, 0, 0.06),
    0 8px 24px rgba(0, 0, 0, 0.05),
    0 20px 60px rgba(0, 0, 0, 0.03);
  transform: translateY(-2px);
}

.member-avatar {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.avatar-placeholder {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg,
    #6366f1 0%,
    #8b5cf6 50%,
    #ec4899 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: 600;
  color: #ffffff;
  box-shadow: 
    0 4px 12px rgba(99, 102, 241, 0.2),
    0 2px 4px rgba(0, 0, 0, 0.1);
}

.member-info {
  text-align: center;
}

.member-name {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1d29;
  margin: 0 0 0.5rem 0;
}

.member-role {
  font-size: 1rem;
  color: #6366f1;
  font-weight: 500;
  margin: 0 0 1rem 0;
}

.member-bio {
  font-size: 0.95rem;
  color: #475569;
  line-height: 1.6;
  margin: 0 0 1.5rem 0;
}

.member-social {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.social-link {
  color: #6366f1;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: color 0.3s ease;
}

.social-link:hover {
  color: #4f46e5;
  text-decoration: underline;
}

.social-separator {
  color: #94a3b8;
}

.team-footer {
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
  .team-header {
    padding: 2rem 1rem 2rem;
  }
  
  .team-title {
    font-size: 2.5rem;
  }
  
  .title-logo {
    width: 36px;
    height: 36px;
  }
  
  .team-subtitle {
    font-size: 1.125rem;
  }
  
  .team-main {
    padding: 1rem;
  }
  
  .team-members {
    grid-template-columns: 1fr;
  }
  
  .team-member-card {
    padding: 1.5rem;
  }
  
  .avatar-placeholder {
    width: 100px;
    height: 100px;
    font-size: 2rem;
  }
  
  .member-name {
    font-size: 1.25rem;
  }
}

@media (max-width: 480px) {
  .team-title {
    font-size: 2rem;
  }
  
  .title-logo {
    width: 32px;
    height: 32px;
  }
  
  .team-subtitle {
    font-size: 1rem;
  }
  
  .team-member-card {
    padding: 1.25rem;
  }
  
  .avatar-placeholder {
    width: 90px;
    height: 90px;
    font-size: 1.75rem;
  }
}
</style>

