<template>
  <div class="not-found">
    <h1>404 - Page Not Found</h1>
    <p>Sorry, the page you are looking for does not exist.</p>
    <nuxt-link to="/">Return to Home</nuxt-link>
  </div>
</template>

<script setup>
// You can add any additional setup logic here if needed
</script>

<style scoped>
.not-found {
  text-align: center;
  margin-top: 50px;
}

.not-found h1 {
  font-size: 2em;
  margin-bottom: 20px;
}

.not-found p {
  margin-bottom: 20px;
}

.not-found a {
  color: #4f46e5;
  text-decoration: underline;
}
</style> 