"use client"

import { useState } from "react"
import { MoreHorizontal, Mail, MailOpen, CheckCircle, Eye, EyeOff, Archive, Trash2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import type { Message } from "./types/message"
import { STATUS_COLORS } from "./lib/constants"
import { formatRelativeTime, getInitials } from "./lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type MessageStatus = "unread" | "read" | "resolved";

interface MessageTableProps {
  messages: Message[];
  onMessageSelect: (message: Message) => void;
  onStatusUpdate: (messageId: number, status: MessageStatus) => void;
  loading?: boolean;
}

export function MessageTable({ messages, onMessageSelect, onStatusUpdate, loading = false }: MessageTableProps) {
  const [selectedMessages, setSelectedMessages] = useState<number[]>([])

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

  const handleSelectAll = (checked: boolean) => {
    setSelectedMessages(checked ? messages.map((m) => m.id) : [])
  }

  const handleSelectMessage = (messageId: number, checked: boolean) => {
    setSelectedMessages((prev) => (checked ? [...prev, messageId] : prev.filter((id) => id !== messageId)))
  }

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <TableRow>
      <TableCell className="pl-4 sm:pl-6">
        <Skeleton className="h-4 w-4 rounded" />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3 sm:gap-4">
          <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <div className="flex items-center gap-2 sm:gap-3">
          <Skeleton className="h-6 w-6 rounded-lg" />
          <Skeleton className="h-4 w-40" />
        </div>
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <Skeleton className="h-6 w-16 rounded-full" />
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-8 w-8 rounded-xl" />
      </TableCell>
    </TableRow>
  )

  return (
    <div className="overflow-hidden">
      <ScrollArea className="h-[70vh]">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12 pl-4 sm:pl-6">
                <Checkbox
                  checked={selectedMessages.length === messages.length && messages.length > 0}
                  onCheckedChange={handleSelectAll}
                  className="rounded-lg"
                  disabled={loading}
                />
              </TableHead>
              <TableHead className="font-semibold text-slate-700">Sender</TableHead>
              <TableHead className="hidden md:table-cell font-semibold text-slate-700">Subject</TableHead>
              <TableHead className="hidden lg:table-cell font-semibold text-slate-700">Status</TableHead>
              <TableHead className="hidden sm:table-cell font-semibold text-slate-700">Date</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Show loading skeletons
              Array.from({ length: 5 }).map((_, index) => (
                <LoadingSkeleton key={`loading-${index}`} />
              ))
            ) : messages.length === 0 ? (
              // Show empty state
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3 text-slate-500">
                    <Mail className="h-12 w-12 text-slate-300" />
                    <p className="text-lg font-medium">No messages found</p>
                    <p className="text-sm">Try adjusting your search or filter criteria</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              // Show actual messages
              messages.map((message) => (
                <TableRow
                  key={message.id}
                  className={`cursor-pointer transition-all duration-300 group border-b hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 border-slate-100/50 ${
                    message.status === "unread"
                      ? "bg-gradient-to-r from-blue-50/80 to-indigo-50/40 border-l-4 border-l-blue-500 shadow-sm"
                      : ""
                  } ${selectedMessages.includes(message.id) ? "bg-gradient-to-r from-blue-100 to-indigo-100" : ""}`}
                  onClick={() => onMessageSelect(message)}
                >
                  <TableCell className="pl-4 sm:pl-6">
                    <Checkbox
                      checked={selectedMessages.includes(message.id)}
                      onCheckedChange={(checked) => handleSelectMessage(message.id, checked as boolean)}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-lg"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12 ring-2 shadow-lg ring-white">
                        <AvatarFallback className="text-sm font-bold bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 text-white">
                          {getInitials(message.senderName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div
                          className={`font-semibold truncate text-sm sm:text-base ${
                            message.status === "unread" ? "text-slate-900" : "text-slate-700"
                          }`}
                        >
                          {message.senderName}
                        </div>
                        <div className="text-xs sm:text-sm truncate text-slate-500">{message.senderEmail}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200">
                          {getStatusIcon(message.status)}
                        </div>
                        <span
                          className={`truncate max-w-xs lg:max-w-md text-sm sm:text-base ${
                            message.status === "unread" ? "font-semibold text-slate-900" : "text-slate-700"
                          }`}
                        >
                          {message.subject}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Badge className={`${STATUS_COLORS[message.status]} font-medium shadow-sm`}>{message.status}</Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-xs sm:text-sm font-medium text-slate-500">
                    {formatRelativeTime(message.receivedDate)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="group h-8 w-8 sm:h-9 sm:w-9 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl text-black bg-black hover:bg-black hover:text-white"
                        >
                          <MoreHorizontal className="h-4 w-4 text-black group-hover:text-white" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-48 border-0 shadow-xl rounded-xl bg-white/95 backdrop-blur-xl"
                      >
                        <DropdownMenuItem onClick={() => onMessageSelect(message)} className="rounded-lg">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onStatusUpdate(message.id, message.status === "read" ? "unread" : "read")}
                          className="rounded-lg"
                        >
                          {message.status === "read" ? (
                            <EyeOff className="h-4 w-4 mr-2" />
                          ) : (
                            <Eye className="h-4 w-4 mr-2" />
                          )}
                          Mark as {message.status === "read" ? "Unread" : "Read"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="rounded-lg">
                          <Archive className="h-4 w-4 mr-2" />
                          Archive Message
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Message
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  )
}
