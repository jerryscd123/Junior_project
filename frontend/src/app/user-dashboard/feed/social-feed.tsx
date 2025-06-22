"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Send, ImageIcon, LinkIcon, Smile, Hash, Trash2, X, Loader2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import user from "@/assets/user.jpg"
import logo8 from "@/assets/logo8.png"

// Redux imports
import { usePosts, useComments, useAppDispatch } from "@/store/hooks"
import { getPublicPosts, createPost } from "@/store/slices/postSlice"
import { likePost, unlikePost } from "@/store/slices/postSlice"
import { Post } from "@/store/types/post" // Only need the Post type

// Feelings options
const feelingOptions = [
  "happy",
  "excited",
  "grateful",
  "relaxed",
  "loved",
  "accomplished",
  "productive",
  "motivated",
  "inspired",
  "curious",
  "thoughtful",
  "calm",
  "blessed",
  "thankful",
  "hopeful",
  "proud",
  "content",
  "amused",
  "optimistic",
  "energetic",
]

export default function SocialFeed() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { publicPosts, isLoading, error } = usePosts()
  const { } = useComments()
  
  // Pagination state
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const observer = useRef<IntersectionObserver | null>(null)
  
  // Local state to track all accumulated posts
  const [allPosts, setAllPosts] = useState<Post[]>([])
  
  const [newPostTitle, setNewPostTitle] = useState("")
  const [newPostText, setNewPostText] = useState("")
  const [selectedFeeling, setSelectedFeeling] = useState("")
  const [selectedLink, setSelectedLink] = useState("")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [isCreating, setIsCreating] = useState(false)
  const [hashtags, setHashtags] = useState<string[]>([])
  const [hashtagInput, setHashtagInput] = useState("")
  const [isHashtagInputVisible, setIsHashtagInputVisible] = useState(false)
  
  // Error state for post creation
  const [postError, setPostError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]> | null>(null)
  
  // Error states for likes and comments
  const [likeError, setLikeError] = useState<string | null>(null)
  const [commentError] = useState<Record<number, string>>({})

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load initial posts on component mount
  useEffect(() => {
    // Reset pagination state when component mounts
    setPage(1)
    setAllPosts([])
    setHasMore(true)
    
    dispatch(getPublicPosts({ page: 1 }))
      .unwrap()
      .then((response) => {
        // Initialize our local posts state with the first page
        const postsData = response.data || [];
        
        // Debug: Check if posts have is_liked_by_user property
        console.log('📥 Initial posts loaded:', {
          count: postsData.length,
          samplePost: postsData[0] ? {
            id: postsData[0].id,
            like_count: postsData[0].like_count,
            is_liked_by_user: postsData[0].is_liked_by_user,
            hasIsLikedProperty: 'is_liked_by_user' in postsData[0]
          } : null
        })
        
        setAllPosts(postsData);
        
        // Check if we have fewer posts than the limit, meaning no more posts
        if (postsData.length < 10) {
          setHasMore(false);
        }
      })
      .catch(error => {
        console.error("Failed to load initial posts:", error)
      })
  }, [dispatch])

  // Update the local post state when Redux state changes
  useEffect(() => {
    // Check if this is first page and we have data from Redux
    if (page === 1 && Array.isArray(publicPosts)) {
      setAllPosts(publicPosts);
    }
  }, [publicPosts, page])

  // Setup intersection observer for infinite scrolling
  const lastPostRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading || isLoadingMore) return
    
    if (observer.current) observer.current.disconnect()
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
        // Function to load more posts
        const loadMorePosts = async () => {
          if (isLoading || isLoadingMore || !hasMore) return
          
          setIsLoadingMore(true)
          const nextPage = page + 1
          
          try {
            const response = await dispatch(getPublicPosts({ page: nextPage })).unwrap()
            
            // Get the array of posts from the response
            const newPosts = response.data || [];
            
            // Append new posts to existing ones
            setAllPosts(prevPosts => [...prevPosts, ...newPosts])
            
            // If we received fewer posts than requested or no posts, we've reached the end
            if (newPosts.length === 0 || newPosts.length < 10) {
              setHasMore(false)
            }
            
            setPage(nextPage)
          } catch (error) {
            console.error("Error loading more posts:", error)
            // Show a temporary error message
            setLikeError("Failed to load more posts. Please try again.")
            setTimeout(() => setLikeError(null), 3000)
          } finally {
            setIsLoadingMore(false)
          }
        }
        
        loadMorePosts()
      }
    }, { threshold: 0.5 })
    
    if (node) observer.current.observe(node)
  }, [isLoading, isLoadingMore, hasMore, page, dispatch])

  // Clear errors when user starts typing
  useEffect(() => {
    if (postError || validationErrors) {
      setPostError(null)
      setValidationErrors(null)
    }
  }, [newPostTitle, newPostText, selectedImage, selectedLink, hashtags, postError, validationErrors])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleHashtagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      addHashtag()
    }
  }

  const addHashtag = () => {
    if (hashtagInput.trim() && !hashtags.includes(hashtagInput.trim())) {
      setHashtags([...hashtags, hashtagInput.trim()])
      setHashtagInput("")
    }
  }

  const removeHashtag = (tagToRemove: string) => {
    setHashtags(hashtags.filter(tag => tag !== tagToRemove))
  }

  const handleNewPost = async () => {
    if (!newPostText.trim() && !imagePreview && !selectedLink) {
      setPostError("Please add some content, an image, or a link to create a post.")
      return
    }

    setIsCreating(true)
    setPostError(null)
    setValidationErrors(null)
    
    try {
      const postData = {
        title: newPostTitle.trim() || "Untitled Post",
        content: newPostText,
        emotion: selectedFeeling || undefined,
        link: selectedLink || undefined,
        is_anonymous: true,
        tags: hashtags,
        ...(selectedImage && { image: selectedImage })
      }
      
      await dispatch(createPost(postData)).unwrap()
      
      // Reset form on success
      setNewPostTitle("")
      setNewPostText("")
      setSelectedFeeling("")
      setSelectedLink("")
      setHashtags([])
      setHashtagInput("")
      setIsHashtagInputVisible(false)
      removeImage()
      
      // Refresh posts to get updated data
      const response = await dispatch(getPublicPosts({ page: 1 })).unwrap()
      const postsData = response.data || []
      setAllPosts(postsData)
      setPage(1)
    } catch (error: unknown) {
      console.error('Failed to create post:', error)
      
      // Handle the specific error format
      interface ValidationError {
        message?: string;
        errors?: Record<string, string[]>;
      }
      
      const err = error as ValidationError // Type assertion for error handling
      if (err?.errors && typeof err.errors === 'object') {
        // Handle validation errors
        setValidationErrors(err.errors)
        setPostError(err.message || "Validation failed")
      } else if (err?.message) {
        // Handle general error message
        setPostError(err.message)
      } else if (typeof error === 'string') {
        setPostError(error)
      } else {
        setPostError("Failed to create post. Please try again.")
      }
    } finally {
      setIsCreating(false)
    }
  }

  const toggleLike = async (postId: number) => {
    setLikeError(null)
    
    // Find the post in our local state
    const post = allPosts.find(p => p.id === postId)
    if (!post) {
      console.error('❌ Post not found in allPosts:', postId)
      return
    }
    
    const isCurrentlyLiked = post.is_liked_by_user || false
    const optimisticLikeCount = isCurrentlyLiked ? post.like_count - 1 : post.like_count + 1
    
    // STEP 1: Optimistic update - Update UI immediately
    setAllPosts(prevPosts => 
      prevPosts.map(p => 
        p.id === postId 
          ? { 
              ...p, 
              is_liked_by_user: !isCurrentlyLiked,
              like_count: optimisticLikeCount
            }
          : p
      )
    )
    
    // STEP 2: Dispatch the correct API call in the background
    try {
      if (isCurrentlyLiked) {
        await dispatch(unlikePost(postId)).unwrap();
      } else {
        await dispatch(likePost(postId)).unwrap();
      }
      
      // STEP 3: Update with actual API response (in case our optimistic update was wrong)
      dispatch(getPublicPosts({ page }))
    } catch (error) {
      console.error('❌ Failed to toggle like:', error)
      
      // STEP 4: Revert optimistic update on error
      setAllPosts(prevPosts => 
        prevPosts.map(p => 
          p.id === postId 
            ? { 
                ...p, 
                is_liked_by_user: isCurrentlyLiked, // Revert to original state
                like_count: post.like_count // Revert to original count
              }
            : p
        )
      )
      
      setLikeError("Failed to toggle like. Please try again.")
      setTimeout(() => setLikeError(null), 3000)
    }
  }

  const toggleBookmark = () => {
    // TODO: Implement bookmark functionality when available in Redux
    console.log('Bookmark functionality not yet implemented')
  }

  const sharePost = (postId: number) => {
    const url = `${window.location.origin}/user-dashboard/feed/${postId}`
    if (navigator.share) {
      navigator.share({
        title: 'Check out this post',
        text: 'Interesting post from our social feed',
        url: url,
      }).catch(console.error)
    } else {
      navigator.clipboard.writeText(url).then(() => {
        alert('Link copied to clipboard!')
      }).catch(() => {
        alert('Failed to copy link')
      })
    }
  }

  const copyPostLink = (postId: number) => {
    const url = `${window.location.origin}/user-dashboard/feed/${postId}`
    navigator.clipboard.writeText(url).then(() => {
      alert('Link copied to clipboard!')
    }).catch(() => {
      alert('Failed to copy link')
    })
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const goToSinglePostView = (postId: number) => {
    router.push(`/user-dashboard/feed/${postId}`)
  }

  // Use our local state for rendering posts
  const postsToRender = allPosts.length > 0 ? allPosts : (Array.isArray(publicPosts) ? publicPosts : []);

  return (
    <div className="space-y-4">
      {/* Feed Loading Error Alert */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                  Error loading posts
                </h3>
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => dispatch(getPublicPosts())}
                className="flex-shrink-0 border-red-300 text-red-700 hover:bg-red-100 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-900/30"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Like Error Alert */}
      {likeError && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800 sticky top-0 z-10">
          <CardContent className="p-4">
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.485 3.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 3.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  {likeError}
                </p>
              </div>
              <button
                onClick={() => setLikeError(null)}
                className="flex-shrink-0 text-orange-400 hover:text-orange-600 dark:hover:text-orange-300"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Post Creation Error Display */}
      {(postError || validationErrors) && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                {postError && (
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                    {postError}
                  </h3>
                )}
                {validationErrors && (
                  <div className="space-y-1">
                    {Object.entries(validationErrors).map(([field, errors]) => (
                      <div key={field}>
                        <p className="text-sm font-medium text-red-700 dark:text-red-300 capitalize">
                          {field}:
                        </p>
                        <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400 ml-2">
                          {errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setPostError(null)
                  setValidationErrors(null)
                }}
                className="flex-shrink-0 text-red-400 hover:text-red-600 dark:hover:text-red-300"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Post */}
      <Card className="shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.src} alt="User" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              {/* Title Input */}
              <Input
                placeholder="Give your post a title..."
                className="w-full border-0 focus-visible:ring-0 text-lg font-medium bg-transparent mb-2"
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
              />
              
              <Textarea
                placeholder="What's on your mind?"
                className="w-full border-0 focus-visible:ring-0 resize-none p-0 text-base bg-transparent"
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
              />

              {imagePreview && (
                <div className="relative mt-2 w-full max-w-xs">
                  <Image
                    src={imagePreview || "/placeholder.svg"}
                    alt="Preview"
                    width={200}
                    height={150}
                    className="rounded-md object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={removeImage}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* Link Input */}
              {selectedLink && (
                <div className="mt-3 space-y-2 animate-slideDown">
                  <Label htmlFor="link-input">Add a link</Label>
                  <Input
                    id="link-input"
                    placeholder="https://example.com"
                    value={selectedLink}
                    onChange={(e) => setSelectedLink(e.target.value)}
                    className="bg-gray-50"
                  />
                </div>
              )}

              {/* Hashtag Input */}
              {isHashtagInputVisible && (
                <div className="mt-3 space-y-2 animate-slideDown">
                  <Label htmlFor="hashtag-input">Add hashtags</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="hashtag-input"
                      placeholder="Enter hashtag (without #)"
                      value={hashtagInput}
                      onChange={(e) => setHashtagInput(e.target.value)}
                      onKeyPress={handleHashtagInputKeyPress}
                      className="bg-gray-50 dark:bg-gray-700"
                    />
                    <Button size="sm" onClick={addHashtag} disabled={!hashtagInput.trim()}>
                      Add
                    </Button>
                  </div>
                  {hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {hashtags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md text-sm"
                        >
                          #{tag}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 p-0 hover:bg-blue-200 dark:hover:bg-blue-800"
                            onClick={() => removeHashtag(tag)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Feeling Input */}
              {selectedFeeling && (
                <div className="mt-3 space-y-2 animate-slideDown">
                  <Label htmlFor="feeling-input">How are you feeling?</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {feelingOptions.map((feeling) => (
                      <Button
                        key={feeling}
                        variant={selectedFeeling === feeling ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "text-xs capitalize",
                          selectedFeeling === feeling && "bg-[#1d2b7d] text-white hover:bg-[#1d2b7d]/90",
                        )}
                        onClick={() => setSelectedFeeling(feeling)}
                      >
                        {feeling}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-3">
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="h-5 w-5 mr-1" />
                <span className="hidden sm:inline">Photo</span>
                <Input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </Button>
              <Button
                variant={selectedLink ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
                  selectedLink && "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100",
                )}
                onClick={() => setSelectedLink(selectedLink ? "" : "https://example.com")}
              >
                <LinkIcon className="h-5 w-5 mr-1" />
                <span className="hidden sm:inline">Link</span>
              </Button>
              <Button
                variant={selectedFeeling ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
                  selectedFeeling && "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100",
                )}
                onClick={() => setSelectedFeeling(selectedFeeling ? "" : "excited")}
              >
                <Smile className="h-5 w-5 mr-1" />
                <span className="hidden sm:inline">Feeling</span>
              </Button>
              <Button
                variant={isHashtagInputVisible ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
                  isHashtagInputVisible && "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100",
                )}
                onClick={() => setIsHashtagInputVisible(!isHashtagInputVisible)}
              >
                <Hash className="h-5 w-5 mr-1" />
                <span className="hidden sm:inline">Hashtag</span>
              </Button>
            </div>
            <Button
              className="bg-[#1d2b7d] hover:bg-[#1d2b7d]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              size="sm"
              onClick={handleNewPost}
              disabled={(!newPostText.trim() && !imagePreview && !selectedLink) || isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin sm:mr-1" />
                  <span className="hidden sm:inline">Posting...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Post</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Posts */}
      {isLoading && postsToRender.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex space-x-3">
                  <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {postsToRender.map((post: Post, index: number) => {
            const isLastElement = index === postsToRender.length - 1
            
            return (
              <div 
                key={`post-${post.id}-${post.like_count}-${post.is_liked_by_user}`}
                ref={isLastElement ? lastPostRef : null}
              >
                <Card
                  className="shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden"
                >
                  <CardHeader className="flex flex-row items-start p-4 space-y-0">
                    <div className="flex items-start space-x-3">
                      <Avatar className="cursor-pointer" onClick={() => goToSinglePostView(post.id)}>
                        <AvatarImage src={post.author_avatar || logo8.src} alt={post.author || 'Anonymous'} />
                        <AvatarFallback>{(post.author || 'A').charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center">
                          <span 
                            className="font-semibold cursor-pointer hover:underline" 
                            onClick={() => goToSinglePostView(post.id)}
                          >
                            {post.author || 'Anonymous'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 flex flex-wrap items-center">
                          <span>@{post.is_anonymous ? 'anonymous' : 'user'}</span>
                          <span className="mx-1">•</span>
                          <span>{formatTimestamp(post.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="ml-auto rounded-full h-8 w-8">
                          <MoreHorizontal className="h-5 w-5" />
                          <span className="sr-only">More options</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => sharePost(post.id)}>Share</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => goToSinglePostView(post.id)}>
                          View Post
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleBookmark()}>
                          Bookmark (Coming Soon)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>

                  <CardContent className="p-0">
                    {post.content && (
                      <div 
                        className="px-4 py-2 text-base cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        onClick={() => goToSinglePostView(post.id)}
                      >
                        {post.content}
                      </div>
                    )}

                    {/* Emotion */}
                    {post.emotion && (
                      <div className="px-4 pb-2">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">
                          😊 Feeling {post.emotion}
                        </span>
                      </div>
                    )}

                    {/* Link */}
                    {post.link && (
                      <div className="px-4 pb-2">
                        <a
                          href={post.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View Link
                        </a>
                      </div>
                    )}

                    {post.tags && post.tags.length > 0 && (
                      <div className="px-4 pb-3 flex flex-wrap gap-1">
                        {post.tags.map((tag: string, i: number) => (
                          <span key={i} className="text-blue-500 hover:underline cursor-pointer text-md">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {post.image && post.image.url && (
                      <div 
                        className="relative cursor-pointer flex justify-center"
                        onClick={() => goToSinglePostView(post.id)}
                      >
                        <div className="overflow-hidden bg-gray-100 dark:bg-gray-800 flex justify-center items-center">
                          <Image
                            src={post.image.url}
                            alt={post.image.alt_text || "Post content"}
                            width={800}
                            height={300}
                            className="w-auto object-cover hover:scale-105 transition-transform duration-300"
                            style={{
                              minHeight: '300px',
                              maxHeight: '70vh',
                              width: 'auto',
                              objectFit: 'cover',
                              margin: '0 auto'
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Comment Error */}
                    {commentError[post.id] && (
                      <div className="px-4 py-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400">
                        {commentError[post.id]}
                      </div>
                    )}

                    <div className="px-4 py-2 flex items-center justify-between border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center space-x-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "flex items-center space-x-1 px-2 transition-colors duration-200",
                            post.is_liked_by_user
                              ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" 
                              : "text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                          )}
                          onClick={() => {
                            const postIdToUpdate = post.id
                            console.log('🖱️ Heart button clicked:', {
                              postId: postIdToUpdate,
                              postIdType: typeof postIdToUpdate,
                              postTitle: post.title?.substring(0, 30) + '...',
                              currentLikeStatus: post.is_liked_by_user,
                              currentLikeCount: post.like_count,
                              postIndex: index
                            });
                            toggleLike(postIdToUpdate)
                          }}
                        >
                          <Heart
                            className={cn(
                              "h-5 w-5 transition-all duration-200",
                              "hover:scale-110",
                              post.is_liked_by_user && "fill-current"
                            )}
                            fill={post.is_liked_by_user ? "currentColor" : "none"}
                          />
                          <span className="font-medium">{post.like_count}</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex items-center space-x-1 px-2 text-gray-600 dark:text-gray-400"
                          onClick={() => router.push(`/user-dashboard/feed/${post.id}`)}
                        >
                          <MessageCircle className="h-5 w-5" />
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex items-center space-x-1 px-2 text-gray-600 dark:text-gray-400"
                            >
                              <Share2 className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => copyPostLink(post.id)}>
                              <LinkIcon className="h-4 w-4 mr-2" />
                              Copy Link
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => sharePost(post.id)}>
                              <Share2 className="h-4 w-4 mr-2" />
                              Share Post
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn("px-2", "text-gray-600 dark:text-gray-400")}
                        onClick={() => toggleBookmark()}
                      >
                        <Bookmark
                          className={cn("h-5 w-5 transition-transform")}
                        />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          })}
          
          {/* Loading more indicator */}
          {isLoadingMore && (
            <div className="py-4 flex justify-center">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                <span className="text-sm text-gray-500">Loading more posts...</span>
              </div>
            </div>
          )}
          
          {/* End of posts message */}
          {!isLoading && !isLoadingMore && postsToRender.length > 0 && !hasMore && (
            <div className="py-4 text-center text-gray-500 dark:text-gray-400">
              <p>You&apos;ve reached the end of the feed!</p>
            </div>
          )}
        </>
      )}

      {postsToRender.length === 0 && !isLoading && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-lg">No posts yet</p>
          <p className="text-sm mt-2">Be the first to share something!</p>
        </div>
      )}
    </div>
  )
}

