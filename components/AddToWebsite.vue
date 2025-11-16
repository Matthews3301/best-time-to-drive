<template>
  <div class="add-website">
    <div class="header-section">
      <h2 class="add-title"> Add to Your Website</h2>
      <p class="add-desc">
        Help your visitors plan their trip better. Perfect for restaurants, retail stores, offices, event venues, and any business where timing matters.
      </p>
    </div>

    <div class="benefits-grid">
      <div class="benefit-card">
        <span class="benefit-icon">⏰</span>
        <h3>Reduce No-Shows</h3>
        <p>Help customers avoid traffic delays</p>
      </div>
      <div class="benefit-card">
        <span class="benefit-icon">✨</span>
        <h3>Better Experience</h3>
        <p>Show you care about their time</p>
      </div>
      <div class="benefit-card">
        <span class="benefit-icon">🎯</span>
        <h3>More Visits</h3>
        <p>Make it easier to plan visits during off-peak times</p>
      </div>
    </div>

    <div class="snippet-section">
      <h3 class="section-title">Choose Your Style</h3>
      
      <div class="style-options">
        <button 
          v-for="style in styles" 
          :key="style.id"
          class="style-btn"
          :class="{ active: selectedStyle === style.id }"
          @click="selectedStyle = style.id"
        >
          {{ style.name }}
        </button>
      </div>

      <div class="preview-section">
        <div class="preview-label">Preview</div>
        <div class="preview" v-html="currentPreview"></div>
      </div>

      <div class="code-section">
        <div class="code-header">
          <span class="code-label">HTML Code</span>
          <button class="copy-btn" @click="copyHtml" :disabled="copied">
            <span v-if="copied">Copied!</span>
            <span v-else>Copy Code</span>
          </button>
        </div>
        <pre class="code-snippet"><code>{{ currentSnippet }}</code></pre>
      </div>
    </div>

    <div class="footer-note">
      <p>No signup required. Just copy and paste the code above into your website.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, computed } from 'vue';

const props = defineProps({
  target: {
    type: String,
    required: true
  }
});

const url = computed(() => `https://rushhourplanner.com/?to=${encodeURIComponent(props.target)}`);
const selectedStyle = ref('detailed');
const copied = ref(false);

const styles = [
  { id: 'minimal', name: 'Minimal' },
  { id: 'detailed', name: 'Detailed' },
  { id: 'badge', name: 'Badge' }
];

const snippets = computed(() => ({
  minimal: `<p>Plan your drive: <a href="${url.value}" target="_blank" rel="noopener">rush hour calculator for ${props.target}</a></p>`,
  
  detailed: `<div style="padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
  <h4 style="margin: 0 0 8px 0; color: #1e293b; font-size: 18px;">🚗 Planning Your Visit?</h4>
  <p style="margin: 0; color: #475569; font-size: 14px;">
    Use our <a href="${url.value}" target="_blank" rel="noopener" style="color: #6366f1; text-decoration: none; font-weight: 600;">rush hour calculator for ${props.target}</a> to avoid traffic delays.
  </p>
</div>`,
  
  badge: `<a href="${url.value}" target="_blank" rel="noopener" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; background: linear-gradient(135deg, #6366f1, #7c3aed); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); transition: transform 0.2s;">
  <span>🚗</span>
  <span>Rush Hour Calculator for ${props.target}</span>
</a>`
}));

const previews = computed(() => ({
  minimal: `<p>Plan your drive: <a href="${url.value}" target="_blank" rel="noopener">rush hour calculator for ${props.target}</a></p>`,
  
  detailed: `<div style="padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
  <h4 style="margin: 0 0 8px 0; color: #1e293b; font-size: 18px;">🚗 Planning Your Visit?</h4>
  <p style="margin: 0; color: #475569; font-size: 14px;">
    Use our <a href="${url.value}" target="_blank" rel="noopener" style="color: #6366f1; text-decoration: none; font-weight: 600;">rush hour calculator for ${props.target}</a> to avoid traffic delays.
  </p>
</div>`,
  
  badge: `<a href="${url.value}" target="_blank" rel="noopener" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; background: linear-gradient(135deg, #6366f1, #7c3aed); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);">
  <span>🚗</span>
  <span>Rush Hour Calculator for ${props.target}</span>
</a>`
}));

const currentSnippet = computed(() => snippets.value[selectedStyle.value]);
const currentPreview = computed(() => previews.value[selectedStyle.value]);

async function copyHtml() {
  try {
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(currentSnippet.value);
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = currentSnippet.value;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  } catch (e) {
    // Best-effort; keep silent if clipboard fails
    copied.value = false;
  }
}
</script>

<style scoped>
.add-website {
  display: grid;
  gap: 2rem;
  max-width: 900px;
  margin: 0 auto;
}

.header-section {
  text-align: center;
}

.add-title {
  margin: 0 0 0.75rem 0;
  font-size: 1.6rem;
  font-weight: 700;
  color: #1f2937;
  background: linear-gradient(135deg, #6366f1, #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.add-desc {
  margin: 0;
  color: #64748b;
  font-size: 1.1rem;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
}

.benefits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.benefit-card {
  background: linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%);
  padding: 1.0rem;
  border-radius: 12px;
  text-align: center;
  border: 1px solid #e2e8f0;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.benefit-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.15);
}

.benefit-icon {
  font-size: 1.6rem;
  display: block;
  margin-bottom: 0.5rem;
}

.benefit-card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.benefit-card p {
  margin: 0;
  font-size: 0.9rem;
  color: #64748b;
  line-height: 1.4;
}

.snippet-section {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.section-title {
  margin: 0 0 1rem 0;
  font-size: 1.3rem;
  font-weight: 600;
  color: #1f2937;
}

.style-options {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.style-btn {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.625rem 1.25rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
}

.style-btn:hover {
  border-color: #a5b4fc;
  background: #eef2ff;
  color: #4f46e5;
}

.style-btn.active {
  background: linear-gradient(135deg, #6366f1, #7c3aed);
  border-color: #6366f1;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.preview-section {
  margin-bottom: 1.5rem;
}

.preview-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.preview {
  background: #ffffff;
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 1.5rem;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.code-section {
  background: #0f172a;
  border-radius: 12px;
  overflow: hidden;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #1e293b;
  border-bottom: 1px solid #334155;
}

.code-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.copy-btn {
  background: linear-gradient(135deg, #6366f1, #7c3aed);
  color: #ffffff;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  min-width: 120px;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.copy-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.copy-btn:active {
  transform: translateY(0);
}

.copy-btn:disabled {
  background: #10b981;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: default;
}

.code-snippet {
  margin: 0;
  padding: 1rem;
  overflow-x: auto;
}

.code-snippet code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  color: #e2e8f0;
  white-space: pre-wrap;
  word-break: break-word;
}

.footer-note {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border: 1px solid #fbbf24;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  text-align: center;
}

.footer-note p {
  margin: 0;
  color: #78350f;
  font-size: 0.95rem;
  line-height: 1.6;
}

.footer-note strong {
  color: #92400e;
}

@media (max-width: 640px) {
  .add-title {
    font-size: 1.5rem;
  }
  
  .add-desc {
    font-size: 1rem;
  }
  
  .benefits-grid {
    grid-template-columns: 1fr;
  }
  
  .snippet-section {
    padding: 1.5rem;
  }
  
  .style-options {
    flex-direction: column;
  }
  
  .style-btn {
    width: 100%;
  }
}
</style>

