<template>
  <div class="add-website">
    <h2 class="add-title">Add to Your Website</h2>

    <div class="snippet-container">
        <h4>Best Time to Drive to {{ props.target }}</h4>
        <p>Find optimal time to drive with <a :href="url" target="_blank" rel="noopener">rush traffic calculator</a>.</p>
    </div>

    <div class="actions">
      <button class="copy-btn" @click="copyHtml" :disabled="copied">{{ copied ? 'Copied!' : 'Copy HTML' }}</button>
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

const htmlSnippet = computed(() => `<div class="snippet-container">
  <h4>Best Time to Drive to ${props.target}</h4>
  <p>Find optimal time to drive with <a href="${url.value}" target="_blank" rel="noopener">rush traffic calculator</a>.</p>
</div>`);

const copied = ref(false);

async function copyHtml() {
  try {
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(htmlSnippet.value);
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = htmlSnippet.value;
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

<style>
.add-website {
  display: grid;
  gap: 1rem;
}

.add-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.add-desc {
  margin: 0.25rem 0 0.5rem 0;
  color: #475569;
  line-height: 1.6;
}

.add-desc a {
  color: #6366f1;
  text-decoration: none;
}

.add-desc a:hover {
  text-decoration: underline;
}

.snippet-container {
  background: #f8fafc;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  padding: 0.75rem;
}

.snippet-label {
  font-size: 0.75rem;
  color: #64748b;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.snippet {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.875rem;
  color: #0f172a;
}

.preview {
  font-family: sans-serif;
  color: #333;
  padding: 1rem;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.preview h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
}

.preview p {
  margin: 0;
  font-size: 0.9rem;
}

.preview a {
  color: #6366f1;
  text-decoration: none;
}

.preview a:hover {
  text-decoration: underline;
}

.actions {
  margin-top: 0.5rem;
}

.copy-btn {
  background: linear-gradient(135deg, #6366f1, #7c3aed);
  color: #ffffff;
  border: none;
  border-radius: 10px;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.2s ease, opacity 0.2s ease;
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.25);
}

.copy-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.35);
}

.copy-btn:active {
  transform: translateY(0);
}

.copy-btn:disabled {
  opacity: 0.9;
}
</style>

