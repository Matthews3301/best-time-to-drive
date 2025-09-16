import { readFile } from 'fs/promises'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  try {
    const slug = getRouterParam(event, 'blog_title')
    
    // Read the blog posts JSON file from the public directory
    const blogPostsPath = join(process.cwd(), 'public', 'blog-posts.json')
    const blogPostsData = await readFile(blogPostsPath, 'utf-8')
    const { posts } = JSON.parse(blogPostsData)
    
    // Find the post with matching slug
    const post = posts.find((p: any) => p.slug === slug)
    
    if (!post) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Blog post not found'
      })
    }
    
    return post
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load blog post'
    })
  }
})
