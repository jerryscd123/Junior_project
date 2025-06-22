"use client"

import { useState } from "react"
import { Calendar, Archive, Star, User, Send, Reply } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Message } from "@/store/types/message"
import { STATUS_COLORS } from "./lib/constants"
import { formatDate, getInitials } from "./lib/utils"

type MessageStatus = "unread" | "read" | "resolved";

interface MessageDetailProps {
  message: Message | null;
  open: boolean;
  onClose: () => void;
  onStatusUpdate: (messageId: number, status: MessageStatus) => void;
  onReply?: (messageId: number, content: string) => void;
  loading?: boolean;
  statusUpdateLoading?: boolean;
}

export function MessageDetail({ 
  message, 
  open, 
  onClose, 
  onStatusUpdate, 
  onReply,
  loading = false,
  statusUpdateLoading = false
}: MessageDetailProps) {
  const [replyContent, setReplyContent] = useState("")
  const [showReplyForm, setShowReplyForm] = useState(false)

  if (!message) return null

  // Convert Redux status to local status for display
  const displayStatus = message.status === 'responded' ? 'resolved' : message.status as MessageStatus

  const handleSendReply = async () => {
    if (!replyContent.trim() || !onReply) return
    
    try {
      await onReply(message.id, replyContent)
      setReplyContent("")
      setShowReplyForm(false)
    } catch {
      // Error handling is done in the parent component
    }
  }

  const handleStatusChange = (newStatus: MessageStatus) => {
    onStatusUpdate(message.id, newStatus)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border-0 shadow-2xl rounded-2xl bg-white/95 backdrop-blur-xl">
        <DialogHeader className="border-b pb-6 rounded-t-2xl border-slate-200/50 bg-gradient-to-r from-slate-50/50 to-blue-50/30">
          <div className="flex items-start justify-between p-6">
            <div className="space-y-3">
              <DialogTitle className="text-xl sm:text-2xl font-bold pr-8 text-slate-900">{message.subject}</DialogTitle>
              <DialogDescription className="flex items-center gap-4">
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10 ring-2 shadow-lg ring-white">
                  <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 text-white">
                    {getInitials(message.sender?.name || message.user?.name || 'Unknown User')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-semibold text-slate-700">{message.sender?.name || message.user?.name || 'Unknown User'}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500">{message.sender?.email || message.user?.email || 'unknown@email.com'}</span>
                </div>
              </DialogDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={`${STATUS_COLORS[displayStatus]} font-semibold shadow-lg`}>{displayStatus}</Badge>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Message Metadata */}
            <div className="flex flex-wrap items-center gap-4 text-sm rounded-lg p-3 bg-slate-50 text-slate-500">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Received {formatDate(message.created_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Contact Form Submission</span>
              </div>
            </div>

            {/* Message Content */}
            <div className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <div className="rounded-lg p-6 border bg-gradient-to-r from-slate-50 to-white border-slate-200 text-slate-700">
                  <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </div>
              </div>
            </div>

            {/* Admin Reply Section */}
            {message.admin_reply && (
              <div className="space-y-4">
                <Separator className="bg-slate-200" />
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Reply className="h-4 w-4" />
                    <span className="font-medium">Admin Reply</span>
                    <span className="text-slate-400">•</span>
                    <span>{formatDate(message.admin_reply.replied_at)}</span>
                    <span className="text-slate-400">•</span>
                    <span>by {message.admin_reply.admin_name}</span>
                  </div>
                  <Card className="border-l-4 border-l-green-500 bg-green-50/50">
                    <CardContent className="p-4">
                      <p className="text-slate-700 leading-relaxed">{message.admin_reply.content}</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Reply Form */}
            {showReplyForm && onReply && (
              <div className="space-y-4">
                <Separator className="bg-slate-200" />
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Send className="h-4 w-4" />
                    <span>Send Reply</span>
                  </div>
                  <Textarea
                    placeholder="Type your reply here..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="min-h-[120px] resize-none border-slate-200 focus:border-blue-500"
                    disabled={loading}
                  />
                  <div className="flex items-center gap-3">
                    <Button 
                      onClick={handleSendReply}
                      disabled={!replyContent.trim() || loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Reply
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowReplyForm(false)
                        setReplyContent("")
                      }}
                      disabled={loading}
                      className="border-slate-200 text-slate-700"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-4">
              <Separator className="bg-slate-200" />
              <div className="flex flex-wrap gap-3">
                <Select value={displayStatus} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-40 bg-white border-slate-200 text-slate-900" disabled={statusUpdateLoading}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
                
                {statusUpdateLoading && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-500"></div>
                    Updating...
                  </div>
                )}
                
                {onReply && !message.admin_reply && (
                  <Button 
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Reply className="h-4 w-4 mr-2" />
                    Reply to User
                  </Button>
                )}
                
                <Button variant="outline" className="bg-white border-slate-200 text-slate-900">
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </Button>
                <Button variant="outline" className="bg-white border-slate-200 text-slate-900">
                  <Star className="h-4 w-4 mr-2" />
                  Star
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
