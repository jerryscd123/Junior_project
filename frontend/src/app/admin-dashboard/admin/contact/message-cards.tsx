"use client"

import { MoreHorizontal, Mail, MailOpen, CheckCircle, Eye } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Message } from "./types/message"
import { STATUS_COLORS } from "./lib/constants"
import { formatRelativeTime, getInitials } from "./lib/utils"

interface MessageCardsProps {
  messages: Message[]
  onMessageSelect: (message: Message) => void
  loading?: boolean
}

export function MessageCards({ messages, onMessageSelect, loading = false }: MessageCardsProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "unread":
        return <Mail className="h-4 w-4" />
      case "read":
        return <MailOpen className="h-4 w-4" />
      case "resolved":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Mail className="h-4 w-4" />
    }
  }

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <Card className="border-0 shadow-lg bg-white/90">
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <Skeleton className="h-12 w-12 sm:h-14 sm:w-14 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-xl" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="flex items-center justify-end pt-2">
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <ScrollArea className="h-[70vh] p-4 sm:p-6">
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {loading ? (
          // Show loading skeletons
          Array.from({ length: 8 }).map((_, index) => (
            <LoadingSkeleton key={`loading-${index}`} />
          ))
        ) : messages.length === 0 ? (
          // Show empty state
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-500">
            <Mail className="h-16 w-16 text-slate-300 mb-4" />
            <p className="text-xl font-medium mb-2">No messages found</p>
            <p className="text-sm text-center max-w-md">
              Try adjusting your search or filter criteria to find the messages you&apos;re looking for.
            </p>
            <span>Don&apos;t forget to check the messages!</span>
          </div>
        ) : (
          // Show actual messages
          messages.map((message) => (
            <Card
              key={message.id}
              className={`cursor-pointer transition-all duration-500 hover:shadow-2xl hover:scale-105 group border-0 shadow-lg ${
                message.status === "unread"
                  ? "bg-gradient-to-br from-blue-50 via-blue-100/50 to-indigo-100/30 ring-2 ring-blue-300/50 shadow-blue-200/50"
                  : "bg-white/90 hover:bg-gradient-to-br hover:from-slate-50 hover:to-blue-50/30"
              }`}
              onClick={() => onMessageSelect(message)}
            >
              <CardHeader className="pb-3 sm:pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <Avatar className="h-12 w-12 sm:h-14 sm:w-14 ring-2 shadow-xl ring-white">
                      <AvatarFallback className="text-sm font-bold bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 text-white">
                        {getInitials(message.senderName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h3
                        className={`font-bold truncate text-base sm:text-lg ${
                          message.status === "unread" ? "text-slate-900" : "text-slate-700"
                        }`}
                      >
                        {message.senderName}
                      </h3>
                      <p className="text-sm truncate font-medium text-slate-500">{message.senderEmail}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={`${STATUS_COLORS[message.status]} text-xs font-semibold shadow-sm`}>
                      {message.status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl hover:bg-gradient-to-br hover:from-blue-500 hover:to-indigo-600 hover:text-white"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="border-0 shadow-xl rounded-xl bg-white/95 backdrop-blur-xl"
                      >
                        <DropdownMenuItem onClick={() => onMessageSelect(message)} className="rounded-lg">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="p-2 rounded-lg shadow-sm bg-gradient-to-br from-slate-100 to-slate-200">
                        {getStatusIcon(message.status)}
                      </div>
                      <h4
                        className={`font-semibold text-sm truncate ${
                          message.status === "unread" ? "text-slate-900" : "text-slate-700"
                        }`}
                      >
                        {message.subject}
                      </h4>
                    </div>
                  </div>
                  <p className="text-sm line-clamp-2 leading-relaxed text-slate-600">{message.message}</p>
                  <div className="flex items-center justify-end pt-2 border-t border-slate-200/50">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-500">
                      {formatRelativeTime(message.receivedDate)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </ScrollArea>
  )
}
