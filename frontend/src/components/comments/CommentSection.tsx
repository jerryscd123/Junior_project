import React from 'react'
import { CommentList } from './CommentList'
import { CommentForm } from './CommentForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface CommentSectionProps {
  postId: number
  showPending?: boolean
  allowComments?: boolean
}

export const CommentSection: React.FC<CommentSectionProps> = ({ 
  postId, 
  showPending = false,
  allowComments = true
}) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Comments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comment Form */}
        {allowComments && (
          <>
            <CommentForm postId={postId} />
            <Separator />
          </>
        )}
        
        {/* Comment List */}
        <CommentList postId={postId} showPending={showPending} />
      </CardContent>
    </Card>
  )
}

export default CommentSection 