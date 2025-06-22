"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Check, ExternalLink, X, Calendar, MessageSquare, Hash, User, MessageCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { Confession } from "./types/confession"
import { getStatusColor, getFeelingEmoji, formatDate } from "./utils/helper"

interface ConfessionModalProps {
  confession: Confession | null
  isOpen: boolean
  onClose: () => void
  onStatusChange: (id: number, status: "approved" | "rejected") => void
}

export function ConfessionModal({ confession, isOpen, onClose, onStatusChange }: ConfessionModalProps) {
  if (!confession) return null

  const dateInfo = formatDate(confession.timeConfession)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 border-0 shadow-2xl p-0">
        <div className="overflow-y-auto max-h-[90vh]">
          {/* Header */}
          <DialogHeader className="p-6 pb-4 border-b border-white/30 bg-white/20 backdrop-blur-sm">
            <DialogTitle className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{confession.userName}</h3>
                <p className="text-sm text-gray-600 bg-white/50 px-3 py-1 rounded-full inline-block mt-1">
                  {confession.category}
                </p>
              </div>
              <div className="ml-auto">
                <Badge className={`${getStatusColor(confession.status)} font-medium shadow-sm text-sm px-3 py-2`}>
                  {confession.status.charAt(0).toUpperCase() + confession.status.slice(1)}
                </Badge>
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Main Content - Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Left Column - Image */}
            <div className="space-y-6">
              {confession.image ? (
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/30 shadow-sm">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    Confession Image
                  </h4>
                  <div className="bg-white/80 p-4 rounded-lg border border-white/40">
                    <div className="relative group cursor-pointer">
                      <Image
                        src={confession.image || "/placeholder.svg"}
                        width="600"
                        height="400"
                        className="w-full h-auto max-h-96 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300"
                        alt="Confession image"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg"></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/30 shadow-sm">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <MessageSquare className="h-5 w-5 text-gray-400" />
                    No Image Attached
                  </h4>
                  <div className="bg-gray-100/80 p-8 rounded-lg border border-gray-200/50 text-center">
                    <div className="w-16 h-16 mx-auto bg-gray-300 rounded-lg flex items-center justify-center mb-3">
                      <MessageSquare className="h-8 w-8 text-gray-500" />
                    </div>
                    <p className="text-gray-600">This confession does not include an image</p>
                  </div>
                </div>
              )}

              {/* Meta Information */}
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/30 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-4">Submission Details</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-gray-700">
                      {dateInfo.date} at {dateInfo.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getFeelingEmoji(confession.feeling)}</span>
                    <div>
                      <span className="font-medium text-gray-800">{confession.feeling}</span>
                      <p className="text-sm text-gray-600">Emotional state</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Description and Details */}
            <div className="space-y-6">
              {/* Confession Content */}
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/30 shadow-sm">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                  Confession Details
                </h4>
                <div className="bg-white/80 p-6 rounded-lg border border-white/40">
                  <p className="text-gray-800 leading-relaxed text-base">{confession.description}</p>
                </div>
              </div>

              {/* Admin Response */}
              {confession.adminComment && (
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/30 shadow-sm">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <MessageCircle className={`h-5 w-5 ${confession.status === "rejected" ? "text-red-600" : "text-green-600"}`} />
                    Admin Response
                    {confession.status === "rejected" && <Badge variant="destructive" className="ml-2">Rejection Reason</Badge>}
                  </h4>
                  <div className={`${
                    confession.status === "rejected" 
                      ? "bg-red-50/80 p-6 rounded-lg border border-red-200/50" 
                      : "bg-green-50/80 p-6 rounded-lg border border-green-200/50"
                  }`}>
                    <p className={`leading-relaxed text-base font-medium ${
                      confession.status === "rejected" ? "text-red-800" : "text-green-800"
                    }`}>{confession.adminComment}</p>
                  </div>
                </div>
              )}

              {/* Hashtags */}
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/30 shadow-sm">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <Hash className="h-5 w-5 text-blue-600" />
                  Tags & Categories
                </h4>
                <div className="space-y-3">
                  <div className="bg-blue-50/80 p-4 rounded-lg border border-blue-200/50">
                    <p className="text-sm text-blue-600 font-medium mb-1">Student Tags</p>
                    <p className="text-blue-700 font-medium">{confession.hashtag}</p>
                  </div>
                  {confession.adminHashtag && (
                    <div className="bg-purple-50/80 p-4 rounded-lg border border-purple-200/50">
                      <p className="text-sm text-purple-600 font-medium mb-1">Admin Tags</p>
                      <p className="text-purple-700 font-medium">{confession.adminHashtag}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Resource Link */}
              {confession.link && (
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/30 shadow-sm">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <ExternalLink className="h-5 w-5 text-green-600" />
                    Resource Link
                  </h4>
                  <Link
                    href={confession.link}
                    className="inline-flex items-center gap-2 text-green-700 hover:text-green-800 bg-green-50/80 hover:bg-green-100/80 px-4 py-3 rounded-lg transition-colors border border-green-200/50 font-medium w-full justify-center"
                    target="_blank"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Resource
                  </Link>
                </div>
              )}

              {/* Action Buttons */}
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/30 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-4">Admin Actions</h4>
                <div className="flex flex-col sm:flex-row gap-3">
                  {confession.status !== "approved" && (
                    <Button
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all"
                      onClick={() => onStatusChange(confession.id, "approved")}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  )}
                  {confession.status !== "rejected" && (
                    <Button
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all"
                      onClick={() => onStatusChange(confession.id, "rejected")}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject with Reason
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
