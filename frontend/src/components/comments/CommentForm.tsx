import React, { useState } from 'react'
import { useAppDispatch, useAuth } from '@/store/hooks'
import { createComment } from '@/store/slices/commentSlice'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

interface CommentFormProps {
  postId: number
  onCommentCreated?: () => void
}

export const CommentForm: React.FC<CommentFormProps> = ({ 
  postId, 
  onCommentCreated 
}) => {
  const dispatch = useAppDispatch()
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()
  
  const [content, setContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to comment on posts.",
        variant: "destructive"
      })
      return
    }

    if (!content.trim()) {
      toast({
        title: "Comment Required",
        description: "Please enter your comment before submitting.",
        variant: "destructive"
      })
      return
    }

    if (content.length < 3) {
      toast({
        title: "Comment Too Short",
        description: "Comments must be at least 3 characters long.",
        variant: "destructive"
      })
      return
    }

    if (content.length > 1000) {
      toast({
        title: "Comment Too Long",
        description: "Comments must be less than 1000 characters.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      await dispatch(createComment({
        postId,
        payload: {
          content: content.trim(),
          is_anonymous: isAnonymous
        }
      })).unwrap()

      // Reset form
      setContent('')
      setIsAnonymous(false)
      
      toast({
        title: "Comment Submitted",
        description: "Your comment has been submitted and is pending approval.",
      })

      // Call callback if provided
      if (onCommentCreated) {
        onCommentCreated()
      }
    } catch (error: Error | unknown) {
      toast({
        title: "Failed to Submit Comment",
        description: error instanceof Error ? error.message : "There was an error submitting your comment. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-gray-500 text-center">
            Please log in to comment on this post.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Add a Comment</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="comment-content" className="text-sm font-medium">
              Your Comment
            </Label>
            <Textarea
              id="comment-content"
              placeholder="Share your thoughts on this post..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-1 min-h-[100px]"
              disabled={isSubmitting}
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-500">
                Minimum 3 characters
              </span>
              <span className="text-xs text-gray-500">
                {content.length}/1000
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="anonymous-comment"
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
              disabled={isSubmitting}
            />
            <Label htmlFor="anonymous-comment" className="text-sm">
              Post anonymously
            </Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setContent('')
                setIsAnonymous(false)
              }}
              disabled={isSubmitting}
            >
              Clear
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !content.trim() || content.length < 3}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Comment'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default CommentForm 