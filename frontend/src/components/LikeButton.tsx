import React from 'react'
import { Heart, Loader2 } from 'lucide-react'
import { usePostLikes } from '../store/hooks/useLikes'
import { Button } from './ui/button'
import { cn } from '../lib/utils'

interface LikeButtonProps {
  postId: number
  className?: string
  showCount?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export const LikeButton: React.FC<LikeButtonProps> = ({
  postId,
  className,
  showCount = true,
  size = 'md'
}) => {
  const {
    likeCount,
    userHasLiked,
    isToggling,
    toggle
  } = usePostLikes(postId)

  const handleLikeToggle = async () => {
    try {
      await toggle()
    } catch (error) {
      console.error('Failed to toggle like:', error)
    }
  }

  const sizeClasses = {
    sm: 'h-8 text-sm',
    md: 'h-10 text-base',
    lg: 'h-12 text-lg'
  }

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  }

  return (
    <Button
      variant={userHasLiked ? 'default' : 'outline'}
      size="sm"
      onClick={handleLikeToggle}
      disabled={isToggling}
      className={cn(
        'flex items-center gap-2 transition-colors',
        sizeClasses[size],
        userHasLiked 
          ? 'bg-red-500 hover:bg-red-600 text-white border-red-500' 
          : 'hover:bg-red-50 hover:text-red-600 hover:border-red-300',
        className
      )}
    >
      {isToggling ? (
        <Loader2 size={iconSizes[size]} className="animate-spin" />
      ) : (
        <Heart 
          size={iconSizes[size]} 
          className={cn(
            'transition-all duration-200',
            userHasLiked 
              ? 'fill-current text-white' 
              : 'text-gray-600'
          )} 
        />
      )}
      
      {showCount && (
        <span className="font-medium">
          {likeCount}
        </span>
      )}
    </Button>
  )
}

// Component to display who liked the post
interface LikeListProps {
  postId: number
  maxDisplay?: number
}

export const LikeList: React.FC<LikeListProps> = ({ 
  postId, 
  maxDisplay = 3 
}) => {
  const {
    likes,
    likeCount,
    isLoading,
    fetchLikes
  } = usePostLikes(postId)

  React.useEffect(() => {
    if (likes.length === 0 && likeCount > 0) {
      fetchLikes()
    }
  }, [likes.length, likeCount, fetchLikes])

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 size={16} className="animate-spin" />
        <span>Loading likes...</span>
      </div>
    )
  }

  if (likeCount === 0) {
    return (
      <div className="text-sm text-gray-500">
        Be the first to like this post
      </div>
    )
  }

  const displayLikes = likes.slice(0, maxDisplay)
  const remainingCount = likeCount - displayLikes.length

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <Heart size={16} className="text-red-500" />
      <span>
        Liked by{' '}
        {displayLikes.map((like, index) => (
          <span key={like.id}>
            <span className="font-medium">{like.user.name}</span>
            {index < displayLikes.length - 1 && ', '}
          </span>
        ))}
        {remainingCount > 0 && (
          <span className="text-gray-500">
            {' '}and {remainingCount} other{remainingCount > 1 ? 's' : ''}
          </span>
        )}
      </span>
    </div>
  )
}

export default LikeButton 