"use client"

import { useState, useRef, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import type { Comment } from "@/store/types/comment"
import { usePostComments, useAppDispatch, getPostComments } from "@/store/hooks"
import user from "@/assets/user.jpg"

interface CommentSectionProps {
  postId: string
  isExpanded: boolean
  onToggleExpand: () => void
  onAddComment: (postId: number, content: string) => Promise<void>
  onEditComment: (postId: string, commentId: string, newContent: string) => void
  onDeleteComment: (postId: string, commentId: string) => void
  formatTimestamp: (timestamp: string) => string
}

export default function CommentSection({
  postId,
  isExpanded,
  onToggleExpand,
  onAddComment,
  onEditComment,
  onDeleteComment,
  formatTimestamp,
}: CommentSectionProps) {
  const dispatch = useAppDispatch()
  const { comments, isLoading } = usePostComments(parseInt(postId))
  
  const [newCommentText, setNewCommentText] = useState("")
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editText, setEditText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false)

  const commentInputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLTextAreaElement>(null)

  // Fetch comments when component expands (only once per expansion)
  useEffect(() => {
    if (isExpanded && !hasAttemptedFetch) {
      setHasAttemptedFetch(true)
      dispatch(getPostComments({ postId: parseInt(postId) }))
    } else if (!isExpanded) {
      setHasAttemptedFetch(false)
    }
  }, [dispatch, postId, isExpanded, hasAttemptedFetch])

  // Focus the edit input when editing starts
  useEffect(() => {
    if (editingCommentId && editInputRef.current) {
      editInputRef.current.focus()
    }
  }, [editingCommentId])

  const handleAddComment = async () => {
    if (!newCommentText.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onAddComment(parseInt(postId), newCommentText)
      setNewCommentText("")
    } catch (error) {
      console.error('Failed to add comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const startEditing = (comment: Comment) => {
    setEditingCommentId(comment.id)
    setEditText(comment.content)
  }

  const cancelEditing = () => {
    setEditingCommentId(null)
    setEditText("")
  }

  const saveEdit = (commentId: number) => {
    if (!editText.trim()) return
    onEditComment(postId, commentId.toString(), editText)
    setEditingCommentId(null)
  }

  return (
    <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
      <div className="px-4 py-3">
        <h3 className="text-base font-medium mb-3">Comments</h3>

        <div className="space-y-4">
          {isLoading && comments.length === 0 ? (
            <div className="flex items-center justify-center py-4">
              <div className="text-sm text-gray-500">Loading comments...</div>
            </div>
          ) : (
            <>
              {comments.slice(0, isExpanded ? undefined : 2).map((comment) => (
            <div key={comment.id} className="animate-fadeIn">
              <div className="flex space-x-3">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={comment.author_avatar || user.src} alt={comment.author_name} />
                  <AvatarFallback>{comment.author_name.charAt(0)}</AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  {editingCommentId === comment.id ? (
                    <div className="space-y-2 animate-fadeIn">
                      <Textarea
                        ref={editInputRef}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="min-h-[60px] text-sm"
                      />
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={() => saveEdit(comment.id)}>
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEditing}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">{comment.author_name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTimestamp(comment.created_at)}
                          </span>
                        </div>

                        {comment.can_edit && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">More options</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => startEditing(comment)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              {comment.can_delete && (
                                <DropdownMenuItem 
                                  onClick={() => onDeleteComment(postId, comment.id.toString())}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>

                      <p className="text-sm text-gray-900 dark:text-gray-100">{comment.content}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

              {comments.length > 2 && !isExpanded && (
                <Button variant="ghost" onClick={onToggleExpand} className="text-sm text-gray-500 hover:text-gray-700">
                  View {comments.length - 2} more comments
                </Button>
              )}

              {isExpanded && comments.length > 2 && (
                <Button variant="ghost" onClick={onToggleExpand} className="text-sm text-gray-500 hover:text-gray-700">
                  Show less
                </Button>
              )}
            </>
          )}
        </div>

        {/* Add Comment */}
        <div className="mt-4 flex space-x-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={user.src} alt="You" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div className="flex-1 flex space-x-2">
            <Input
              ref={commentInputRef}
              placeholder="Write a comment..."
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
              className="flex-1"
              disabled={isSubmitting}
            />
            <Button 
              size="sm" 
              onClick={handleAddComment}
              disabled={!newCommentText.trim() || isSubmitting}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 