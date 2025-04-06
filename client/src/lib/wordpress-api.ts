// WordPress post interface
export interface WPPost {
  id: number;
  title: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  date: string;
  slug: string;
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      source_url: string;
    }>;
    author?: Array<{
      name: string;
    }>;
  };
}

// WordPress category interface
export interface WPCategory {
  id: number;
  name: string;
  slug: string;
}

// WordPress API configuration
export const WORDPRESS_API_CONFIG = {
  // Replace with your actual WordPress site URL when ready to connect
  baseUrl: import.meta.env.VITE_WORDPRESS_API_URL || 'https://your-wordpress-site.com/wp-json/wp/v2',
  
  // Number of posts to fetch per page
  perPage: 9,
  
  // Default post fields to include in response
  postFields: [
    'id',
    'title',
    'excerpt',
    'date',
    'slug',
    'featured_media'
  ].join(','),
  
  // Default post fields for single post view
  singlePostFields: [
    'id',
    'title',
    'content',
    'date',
    'slug',
    'featured_media'
  ].join(','),
  
  // Additional data to embed in response
  embed: true
};

/**
 * Get all blog posts with optional pagination
 */
export async function getPosts(page = 1, perPage = WORDPRESS_API_CONFIG.perPage): Promise<WPPost[]> {
  try {
    const url = new URL(`${WORDPRESS_API_CONFIG.baseUrl}/posts`);
    
    // Add query parameters
    url.searchParams.append('page', page.toString());
    url.searchParams.append('per_page', perPage.toString());
    url.searchParams.append('_fields', WORDPRESS_API_CONFIG.postFields);
    
    if (WORDPRESS_API_CONFIG.embed) {
      url.searchParams.append('_embed', 'true');
    }
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching WordPress posts:', error);
    throw error;
  }
}

/**
 * Get a single blog post by slug
 */
export async function getPostBySlug(slug: string): Promise<WPPost> {
  try {
    const url = new URL(`${WORDPRESS_API_CONFIG.baseUrl}/posts`);
    
    // Add query parameters to find post by slug
    url.searchParams.append('slug', slug);
    url.searchParams.append('_fields', WORDPRESS_API_CONFIG.singlePostFields);
    
    if (WORDPRESS_API_CONFIG.embed) {
      url.searchParams.append('_embed', 'true');
    }
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status}`);
    }
    
    const posts = await response.json();
    
    if (!posts || !posts.length) {
      throw new Error(`Post with slug "${slug}" not found`);
    }
    
    // Return the first post (should be only one with this slug)
    return posts[0];
  } catch (error) {
    console.error(`Error fetching WordPress post with slug "${slug}":`, error);
    throw error;
  }
}

/**
 * Get categories
 */
export async function getCategories(): Promise<WPCategory[]> {
  try {
    const url = new URL(`${WORDPRESS_API_CONFIG.baseUrl}/categories`);
    
    // Add query parameters
    url.searchParams.append('_fields', 'id,name,slug');
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching WordPress categories:', error);
    throw error;
  }
}

/**
 * Helper function to strip HTML tags from WordPress content
 */
export function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
}

/**
 * Helper function to create markup for dangerously setting innerHTML
 */
export function createMarkup(content: string) {
  return { __html: content };
}