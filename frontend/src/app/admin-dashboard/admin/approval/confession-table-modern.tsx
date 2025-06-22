"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Check,
  Eye,
  MoreHorizontal,
  X,
  ImageIcon,
} from "lucide-react"
import Image from "next/image"
import type { Confession } from "./types/confession"
import { getStatusColor, formatDate } from "./utils/helper"

interface ConfessionTableModernProps {
  confessions: Confession[]
  selectedConfessions: number[]
  onSelectionChange: (ids: number[]) => void
  onSelectAll: (checked: boolean) => void
  onStatusChange: (id: number, status: "approved" | "rejected") => void
  onView: (confession: Confession) => void
}

export function ConfessionTableModern({
  confessions,
  selectedConfessions,
  onSelectionChange,
  onSelectAll,
  onStatusChange,
  onView,
}: ConfessionTableModernProps) {
  const allSelected = confessions.length > 0 && selectedConfessions.length === confessions.length
  const someSelected = selectedConfessions.length > 0 && selectedConfessions.length < confessions.length

  const handleSelectConfession = (id: number, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedConfessions, id])
    } else {
      onSelectionChange(selectedConfessions.filter((selectedId) => selectedId !== id))
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm animate-fade-in">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200 bg-gray-50">
              <TableHead className="w-12 px-6 py-4">
                <Checkbox
                  checked={allSelected}
                  ref={(el) => {
                    if (el instanceof HTMLInputElement) el.indeterminate = someSelected
                  }}
                  onCheckedChange={onSelectAll}
                  className="border-gray-300"
                />
              </TableHead>
              <TableHead className="font-semibold text-gray-700 px-6 py-4">
                <div className="flex items-center gap-1">
                  User name
                </div>
              </TableHead>
              <TableHead className="font-semibold text-gray-700 px-6 py-4 hidden md:table-cell">Image</TableHead>
              <TableHead className="font-semibold text-gray-700 px-6 py-4 hidden lg:table-cell">Title</TableHead>
              <TableHead className="font-semibold text-gray-700 px-6 py-4 hidden xl:table-cell">Description</TableHead>
              <TableHead className="font-semibold text-gray-700 px-6 py-4 hidden sm:table-cell">Tags</TableHead>
              <TableHead className="font-semibold text-gray-700 px-6 py-4">Status</TableHead>
              <TableHead className="font-semibold text-gray-700 px-6 py-4 hidden md:table-cell">Engagement</TableHead>
              <TableHead className="font-semibold text-gray-700 px-6 py-4 hidden lg:table-cell">Date</TableHead>
              <TableHead className="w-12 px-6 py-4"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {confessions.map((confession, index) => {
              const dateInfo = formatDate(confession.timeConfession)
              const isSelected = selectedConfessions.includes(confession.id)

              return (
                <TableRow
                  key={confession.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-all duration-200 animate-slide-up ${
                    isSelected ? "bg-blue-50" : ""
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <TableCell className="px-6 py-4">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleSelectConfession(confession.id, checked as boolean)}
                      className="border-gray-300"
                    />
                  </TableCell>

                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900">{confession.userName}</div>
                        <div className="text-sm text-gray-500">{confession.category}</div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="px-6 py-4 hidden md:table-cell">
                    {confession.image ? (
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200">
                          <Image
                            src={confession.image || "/placeholder.svg"}
                            width="48"
                            height="48"
                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                            alt="Confession image"
                            onClick={() => onView(confession)}
                          />
                        </div>
                        <span className="text-sm text-green-600 font-medium">Yes</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-400">
                        <ImageIcon className="h-4 w-4" />
                        <span className="text-sm">No</span>
                      </div>
                    )}
                  </TableCell>

                  <TableCell className="px-6 py-4 hidden lg:table-cell">
                    <div className="max-w-xs">
                      <p className="text-sm font-semibold text-gray-900 line-clamp-1">{confession.title}</p>
                    </div>
                  </TableCell>

                  <TableCell className="px-6 py-4 hidden xl:table-cell">
                    <div className="max-w-xs">
                      <p className="text-sm text-gray-700 line-clamp-2">{confession.description}</p>
                    </div>
                  </TableCell>

                  <TableCell className="px-6 py-4 hidden sm:table-cell">
                    {confession.tags && confession.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {confession.tags.slice(0, 2).map((tag: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {confession.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{confession.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">No tags</span>
                    )}
                  </TableCell>

                  <TableCell className="px-6 py-4">
                    <Badge className={`${getStatusColor(confession.status)} text-xs font-medium px-3 py-1`}>
                      {confession.status.charAt(0).toUpperCase() + confession.status.slice(1)}
                    </Badge>
                  </TableCell>

                  <TableCell className="px-6 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <span className="text-red-500">❤</span>
                        <span>{confession.likeCount}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-blue-500">💬</span>
                        <span>{confession.commentCount}</span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="px-6 py-4 hidden lg:table-cell">
                    <div className="text-sm text-gray-600">
                      <div>{dateInfo.date}</div>
                      <div className="text-xs text-gray-400">{dateInfo.time}</div>
                    </div>
                  </TableCell>

                  <TableCell className="px-6 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onView(confession)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {confession.status !== "approved" && (
                          <DropdownMenuItem
                            className="text-green-600"
                            onClick={() => onStatusChange(confession.id, "approved")}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Approve
                          </DropdownMenuItem>
                        )}
                        {confession.status !== "rejected" && (
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => onStatusChange(confession.id, "rejected")}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Reject with Reason
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
