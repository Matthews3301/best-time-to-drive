import { readFile } from 'fs/promises'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  try {
    // Read the blog posts JSON file from the public directory
    const blogPostsPath = join(process.cwd(), 'public', 'blog-posts.json')
    const blogPostsData = await readFile(blogPostsPath, 'utf-8')
    const { posts } = JSON.parse(blogPostsData)
    
    return {
      posts: posts || []
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load blog posts'
    })
  }
})
