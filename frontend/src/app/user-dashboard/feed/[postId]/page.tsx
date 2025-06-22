"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, ArrowLeft } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import Image from "next/image"
import CommentSection from "../comment-section"
import { useAppDispatch, usePosts } from "@/store/hooks"
import { getPostById, likePost, unlikePost } from "@/store/slices/postSlice"
import { getPostComments, createComment } from "@/store/slices/commentSlice"
import logo8 from "@/assets/logo8.png"

export default function SinglePostView() {
  const params = useParams()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { currentPost, isLoading, error } = usePosts()
  
  const postId = parseInt(params.postId as string)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [likeError, setLikeError] = useState<string | null>(null)

  useEffect(() => {
    if (postId) {
      dispatch(getPostById(postId))
      dispatch(getPostComments({ postId }))
    }
  }, [dispatch, postId])

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const toggleLike = async () => {
    if (!currentPost) return
    
    setLikeError(null)
    
    try {
      const isCurrentlyLiked = currentPost.is_liked_by_user || false
      console.log('🔄 Toggle Like on Single Post:', {
        postId: currentPost.id,
        currentLikedStatus: isCurrentlyLiked,
        currentLikeCount: currentPost.like_count
      })
      
      // Use the appropriate action based on current state
      const result = isCurrentlyLiked 
        ? await dispatch(unlikePost(currentPost.id)).unwrap()
        : await dispatch(likePost(currentPost.id)).unwrap()
      
      console.log('✅ Toggle Like Result:', result)
      
      // Refresh the post to get updated state from server
      await dispatch(getPostById(postId))
    } catch (error) {
      console.error('Failed to toggle like:', error)
      setLikeError("Failed to toggle like. Please try again.")
      setTimeout(() => setLikeError(null), 3000)
    }
  }

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    // TODO: Implement bookmark functionality when available in Redux
    console.log('Bookmark functionality not yet implemented')
  }

  const sharePost = () => {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({
        title: currentPost?.title || 'Check out this post',
        text: currentPost?.content || 'Interesting post from our social feed',
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

  const handleAddComment = async (postId: number, content: string) => {
    try {
      await dispatch(createComment({ 
        postId, 
        payload: { 
          content, 
          is_anonymous: true 
        } 
      })).unwrap()
      
      // Refresh comments for this post
      dispatch(getPostComments({ postId }))
    } catch (error) {
      console.error('Failed to add comment:', error)
    }
  }

  const handleEditComment = () => {
    console.log('Edit comment not yet implemented')
  }

  const handleDeleteComment = () => {
    console.log('Delete comment not yet implemented')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !currentPost) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Feed
          </Button>
          <div className="text-center py-12">
            <p className="text-red-500 text-lg mb-4">
              {error || 'Post not found'}
            </p>
            <Button onClick={() => router.push('/user-dashboard/feed')}>
              Return to Feed
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const post = currentPost

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Feed
        </Button>

        <Card className="shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <CardHeader className="flex flex-row items-start p-6 space-y-0">
            <div className="flex items-start space-x-3 flex-1">
              <Avatar className="h-12 w-12">
                <AvatarImage src={post.author_avatar || logo8.src} alt={post.author || 'Anonymous'} />
                <AvatarFallback>{(post.author || 'A').charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center">
                  <span className="font-semibold text-lg">{post.author || 'Anonymous'}</span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                  <span>@{post.is_anonymous ? 'anonymous' : 'user'}</span>
                  <span className="mx-1">•</span>
                  <span>{formatTimestamp(post.created_at)}</span>
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                  <MoreHorizontal className="h-5 w-5" />
                  <span className="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={sharePost}>Share</DropdownMenuItem>
                <DropdownMenuItem onClick={toggleBookmark}>
                  {isBookmarked ? 'Remove Bookmark' : 'Bookmark'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>

          <CardContent className="p-0">
            {post.content && (
              <div className="px-6 py-4 text-lg leading-relaxed">
                {post.content}
              </div>
            )}

            {post.tags && post.tags.length > 0 && (
              <div className="px-6 pb-4 flex flex-wrap gap-2">
                {post.tags.map((tag: string, i: number) => (
                  <span key={i} className="text-blue-500 hover:underline cursor-pointer text-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {post.image && post.image.url && (
              <div className="bg-gray-100 dark:bg-gray-800">
                <Image
                  src={post.image.url}
                  alt={post.image.alt_text || "Post content"}
                  width={800}
                  height={600}
                  className="w-full object-cover max-h-[600px]"
                />
              </div>
            )}
            
            {/* Like Error */}
            {likeError && (
              <div className="px-6 py-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400">
                {likeError}
              </div>
            )}

            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center space-x-6">
                <Button
                  key={`like-btn-${post.id}-${post.is_liked_by_user}-${post.like_count}`}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "flex items-center space-x-2 px-3 transition-colors duration-200",
                    (post.is_liked_by_user || false)
                      ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" 
                      : "text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  )}
                  onClick={toggleLike}
                >
                  <Heart
                    className={cn(
                      "h-5 w-5 transition-all duration-200",
                      "hover:scale-110"
                    )}
                    fill={(post.is_liked_by_user || false) ? "currentColor" : "none"}
                  />
                  <span className="font-medium">{post.like_count}</span>
                </Button>

                <div className="flex items-center space-x-2 px-3 text-gray-600 dark:text-gray-400">
                  <MessageCircle className="h-5 w-5" />
                  <span>{post.comment_count}</span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-2 px-3 text-gray-600 dark:text-gray-400"
                  onClick={sharePost}
                >
                  <Share2 className="h-5 w-5" />
                  <span>Share</span>
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "px-3",
                  isBookmarked ? "text-blue-500" : "text-gray-600 dark:text-gray-400"
                )}
                onClick={toggleBookmark}
              >
                <Bookmark
                  className={cn(
                    "h-5 w-5 transition-transform",
                    isBookmarked && "fill-current"
                  )}
                />
              </Button>
            </div>

            <CommentSection
              postId={post.id.toString()}
              isExpanded={true}
              onToggleExpand={() => {}}
              onAddComment={handleAddComment}
              onEditComment={handleEditComment}
              onDeleteComment={handleDeleteComment}
              formatTimestamp={formatTimestamp}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 