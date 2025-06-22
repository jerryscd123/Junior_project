import { api } from './api'
import {
  CreatePostData,
  UpdatePostData,
  GetPostsParams,
  PostResponse,
  PostsListResponse,
  LikeResponse,
  GetUserPostsParams
} from '../types/post'

// Post service functions following the guide
export const postService = {
  // Get public posts (approved posts)
  getPublicPosts: async (params?: GetPostsParams): Promise<PostsListResponse> => {
    console.log('📝 Post Service: Fetching public posts', params)
    
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString())
    if (params?.search) queryParams.append('search', params.search)
    if (params?.tags) queryParams.append('tags', params.tags)
    if (params?.sort) queryParams.append('sort', params.sort)
    
    const url = `/posts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await api.get(url)
    
    console.log('✅ Post Service: Public posts fetched', {
      count: response.data.data.data?.length || 0,
      total: response.data.data.total
    })
    
    return response.data
  },

  // Get single post by ID
  getPostById: async (id: number): Promise<PostResponse> => {
    console.log('📝 Post Service: Fetching post by ID', { id })
    
    const response = await api.get(`/posts/${id}`)
    
    console.log('✅ Post Service: Post fetched', {
      id: response.data.data.id,
      title: response.data.data.title,
      hasImage: !!response.data.data.image
    })
    
    return response.data
  },

  // Create new post following the guide's pattern
  createPostWithImage: async (postData: CreatePostData): Promise<PostResponse> => {
    console.log('📝 Post Service: Creating post with image', { 
      title: postData.title,
      hasImage: !!postData.image,
      emotion: postData.emotion,
      link: postData.link
    })
    
    const formData = new FormData()
    
    // Add required text fields
    formData.append('title', postData.title)
    formData.append('content', postData.content)
    // Send boolean as "1" or "0" for Laravel compatibility
    formData.append('is_anonymous', postData.is_anonymous ? '1' : '0')

    // Add optional fields
    if (postData.emotion) {
      formData.append('emotion', postData.emotion)
    }
    if (postData.link) {
      formData.append('link', postData.link)
    }

    // Add tags if provided - following the guide's array pattern
    if (postData.tags && postData.tags.length > 0) {
      postData.tags.forEach((tag, index) => {
        formData.append(`tags[${index}]`, tag)
      })
    }

    // Add image if provided
    if (postData.image) {
      formData.append('image', postData.image)
      if (postData.image_alt) {
        formData.append('image_alt', postData.image_alt)
      }
    }

    const response = await api.post('/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    console.log('✅ Post Service: Post with image created', {
      id: response.data.data?.id || 'unknown',
      title: response.data.data?.title || postData.title,
      status: response.data.data?.status || 'pending',
      hasImage: !!response.data.data?.image,
      emotion: response.data.data?.emotion || postData.emotion,
      link: response.data.data?.link || postData.link
    })
    
    return response.data
  },

  // Create post without image (JSON)
  createPost: async (postData: CreatePostData): Promise<PostResponse> => {
    if (postData.image) {
      // Delegate to image creation if image is present
      return await postService.createPostWithImage(postData)
    }

    console.log('📝 Post Service: Creating text-only post', { 
      title: postData.title,
      emotion: postData.emotion,
      link: postData.link
    })
    
    const jsonPayload = {
      title: postData.title,
      content: postData.content,
      is_anonymous: postData.is_anonymous || false,
      ...(postData.emotion && { emotion: postData.emotion }),
      ...(postData.link && { link: postData.link }),
      tags: postData.tags
    }

    const response = await api.post('/posts', jsonPayload)
    
    console.log('✅ Post Service: Text post created', {
      id: response.data.data?.id || 'unknown',
      title: response.data.data?.title || postData.title,
      status: response.data.data?.status || 'pending',
      emotion: response.data.data?.emotion || postData.emotion,
      link: response.data.data?.link || postData.link
    })
    
    return response.data
  },

  // Update post following the guide's pattern
  updatePostWithImage: async (id: number, postData: UpdatePostData): Promise<PostResponse> => {
    console.log('📝 Post Service: Updating post with image operations', { 
      id, 
      title: postData.title,
      hasImage: !!postData.image,
      removeImage: postData.remove_image
    })
    
    // Use FormData if image operations are involved
    if (postData.image || postData.remove_image) {
      const formData = new FormData()
      
      if (postData.title) formData.append('title', postData.title)
      if (postData.content) formData.append('content', postData.content)
      if (postData.remove_image) formData.append('remove_image', 'true')
      
      if (postData.tags && postData.tags.length > 0) {
        postData.tags.forEach((tag, index) => {
          formData.append(`tags[${index}]`, tag)
        })
      }

      if (postData.image) {
        formData.append('image', postData.image)
        if (postData.image_alt) {
          formData.append('image_alt', postData.image_alt)
        }
      }

      const response = await api.put(`/posts/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      console.log('✅ Post Service: Post with image updated', {
        id: response.data.data?.id || id,
        title: response.data.data?.title || 'unknown',
        hasImage: !!response.data.data?.image
      })
      
      return response.data
    } else {
      // Use JSON for text-only updates
      const response = await api.put(`/posts/${id}`, postData)
      
      console.log('✅ Post Service: Post updated', {
        id: response.data.data?.id || id,
        title: response.data.data?.title || 'unknown'
      })
      
      return response.data
    }
  },

  // Update post (delegates to appropriate method)
  updatePost: async (id: number, postData: UpdatePostData): Promise<PostResponse> => {
    return await postService.updatePostWithImage(id, postData)
  },

  // Delete post (user's own post)
  deletePost: async (id: number): Promise<{ success: boolean; message: string }> => {
    console.log('📝 Post Service: Deleting post', { id })
    
    const response = await api.delete(`/posts/${id}`)
    
    console.log('✅ Post Service: Post deleted', { id })
    return response.data
  },

  // Like post
  likePost: async (id: number): Promise<LikeResponse> => {
    console.log('👍 Post Service: Liking post', { id })
    
    const response = await api.post(`/posts/${id}/like`)
    
    console.log('✅ Post Service: Post liked', {
      id,
      like_count: response.data.data?.like_count || 'unknown'
    })
    return response.data
  },

  // Unlike post with fallback methods
  unlikePost: async (id: number): Promise<LikeResponse> => {
    console.log('👎 Post Service: Unliking post with fallback methods', { id })
    
    try {
      // First try DELETE method (RESTful standard)
      console.log('👎 Post Service: Trying DELETE method for unlike')
      const response = await api.delete(`/posts/${id}/unlike`)
      console.log('✅ Post Service: Post unliked with DELETE', {
        id,
        like_count: response.data.data?.like_count || 'unknown'
      })
      return response.data
    } catch (firstError) {
      console.log('❌ Post Service: DELETE method failed for unlike, trying POST', { error: firstError })
      
      try {
        // Fallback to POST method
        const response = await api.post(`/posts/${id}/unlike`)
        console.log('✅ Post Service: Post unliked with POST', {
          id,
          like_count: response.data.data?.like_count || 'unknown'
        })
        return response.data
      } catch (postError) {
        console.log('❌ Post Service: POST method also failed for unlike')
        throw postError
      }
    }
  },

  // Get user's own posts with status filtering (updated based on Postman collection)
  getUserPosts: async (params?: GetUserPostsParams): Promise<PostsListResponse> => {
    console.log('📝 Post Service: Fetching user posts', params)
    
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString())
    if (params?.status) queryParams.append('status', params.status)
    if (params?.search) queryParams.append('search', params.search)
    
    const url = `/user/posts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await api.get(url)
    
    console.log('✅ Post Service: User posts fetched', {
      count: response.data.data.data?.length || 0,
      total: response.data.data.total,
      status: params?.status || 'all'
    })
    
    return response.data
  },

  // Get user posts by specific status
  getUserPostsByStatus: async (status: 'pending' | 'approved' | 'rejected', params?: Omit<GetUserPostsParams, 'status'>): Promise<PostsListResponse> => {
    console.log('📝 Post Service: Fetching user posts by status', { status, params })
    
    const queryParams = new URLSearchParams()
    queryParams.append('status', status)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString())
    if (params?.search) queryParams.append('search', params.search)
    
    const url = `/user/posts?${queryParams.toString()}`
    const response = await api.get(url)
    
    console.log('✅ Post Service: User posts by status fetched', {
      count: response.data.data.data?.length || 0,
      total: response.data.data.total,
      status
    })
    
    return response.data
  },

  // Get all user posts (no status filter)
  getAllUserPosts: async (params?: Omit<GetUserPostsParams, 'status'>): Promise<PostsListResponse> => {
    console.log('📝 Post Service: Fetching all user posts', params)
    
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString())
    if (params?.search) queryParams.append('search', params.search)
    
    const url = `/user/posts/all${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await api.get(url)
    
    console.log('✅ Post Service: All user posts fetched', {
      count: response.data.data.data?.length || 0,
      total: response.data.data.total
    })
    
    return response.data
  }
} 