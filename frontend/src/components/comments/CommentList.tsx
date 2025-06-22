import React, { useEffect } from 'react'
import { useAppDispatch, usePostComments } from '@/store/hooks'
import { getPostComments } from '@/store/slices/commentSlice'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'

interface CommentListProps {
  postId: number
  showPending?: boolean
}

export const CommentList: React.FC<CommentListProps> = ({ 
  postId, 
  showPending = false 
}) => {
  const dispatch = useAppDispatch()
  const { comments, pagination, isLoading, error } = usePostComments(postId)

  useEffect(() => {
    // Load comments when component mounts
    dispatch(getPostComments({ postId }))
  }, [dispatch, postId])

  const filteredComments = showPending 
    ? comments 
    : comments.filter(comment => comment.status === 'approved')

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex space-x-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                <div className="h-16 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-4">
        <p className="text-red-500">Error loading comments: {error}</p>
        <Button 
          variant="outline" 
          onClick={() => dispatch(getPostComments({ postId }))}
          className="mt-2"
        >
          Retry
        </Button>
      </Card>
    )
  }

  if (filteredComments.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-gray-500 text-center">
          {showPending ? 'No comments yet.' : 'No approved comments yet.'}
        </p>
      </Card>
    )
  }

  const loadMoreComments = () => {
    if (pagination && pagination.current_page < pagination.last_page) {
      dispatch(getPostComments({ 
        postId, 
        params: { page: pagination.current_page + 1 } 
      }))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Comments ({pagination?.total || 0})
        </h3>
      </div>

      <div className="space-y-4">
        {filteredComments.map((comment) => (
          <Card key={comment.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.user?.avatar} />
                  <AvatarFallback>
                    {comment.is_anonymous 
                      ? 'A' 
                      : comment.user?.name?.charAt(0).toUpperCase() ?? 'U'
                    }
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">
                      {comment.is_anonymous ? 'Anonymous' : comment.user?.name ?? 'Unknown User'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(comment.created_at), { 
                        addSuffix: true 
                      })}
                    </span>
                    {showPending && (
                      <Badge 
                        variant={
                          comment.status === 'approved' ? 'default' :
                          comment.status === 'pending' ? 'secondary' :
                          'destructive'
                        }
                        className="text-xs"
                      >
                        {comment.status}
                      </Badge>
                    )}
                  </div>

                  <div className="text-sm leading-relaxed">
                    {comment.content}
                  </div>

                  {comment.admin_note && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-xs text-yellow-800">
                        <strong>Admin Note:</strong> {comment.admin_note}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pagination && pagination.current_page < pagination.last_page && (
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            onClick={loadMoreComments}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Load More Comments'}
          </Button>
        </div>
      )}
    </div>
  )
}

export default CommentList 