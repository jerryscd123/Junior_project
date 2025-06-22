"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { ImageIcon, Link, Smile, X } from 'lucide-react'
import { cn } from "@/lib/utils"
import Image from "next/image"
import user from "@/assets/user.jpg"
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

interface CreatePostProps {
  onPostCreated: (post: { 
    id: string; 
    title: string;
    content: string; 
    hashtags: string[]; 
    feeling: string; 
    link: string; 
    images: string[]; 
    likes: number; 
    comments: unknown[]; 
    timestamp: string; 
    isLiked: boolean; 
    isBookmarked: boolean; 
  }) => void
}

interface ErrorState {
  title?: string[];
  content?: string[];
}

export default function CreatePost({ onPostCreated }: CreatePostProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [hashtags, setHashtags] = useState("")
  const [feeling, setFeeling] = useState("")
  const [link, setLink] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [errors, setErrors] = useState<ErrorState>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [customFeeling, setCustomFeeling] = useState("")
  const [selectedFeeling, setSelectedFeeling] = useState("")

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files).map((file) => URL.createObjectURL(file))
      setImages((prev) => [...prev, ...newImages])
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const validateForm = (): boolean => {
    const newErrors: ErrorState = {}
    
    if (!title || title.length < 5) {
      newErrors.title = ["Title must be at least 5 characters long."]
    }
    
    if (!content || content.length < 10) {
      newErrors.content = ["Content must be at least 10 characters long."]
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFeelingChange = (value: string) => {
    if (value === "custom") {
      setSelectedFeeling("custom")
      // Keep current custom feeling
    } else {
      setSelectedFeeling(value)
      setFeeling(value)
      setCustomFeeling("")
    }
  }

  const handleCustomFeelingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomFeeling(e.target.value)
    setFeeling(e.target.value)
  }

  const handleSubmit = () => {
    if (!validateForm()) return

    const newPost = {
      id: Date.now().toString(),
      title,
      content,
      hashtags: hashtags.split(" ").filter((tag) => tag.startsWith("#")),
      feeling,
      link,
      images,
      likes: 0,
      comments: [],
      timestamp: new Date().toISOString(),
      isLiked: false,
      isBookmarked: false,
    }

    onPostCreated(newPost)

    // Reset form
    setTitle("")
    setContent("")
    setHashtags("")
    setFeeling("")
    setLink("")
    setImages([])
    setErrors({})
    setIsExpanded(false)
  }

  return (
    <Card className="mb-6 overflow-hidden border-gray-200 dark:border-gray-700 shadow-sm">
      <CardContent className="p-4">
        <div className="mb-3">
          <Input
            placeholder="Post title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={cn(
              "text-lg font-medium border-none pl-0 focus-visible:ring-0",
              errors.title ? "border-red-500 focus-visible:ring-red-500" : ""
            )}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-500">{errors.title[0]}</p>
          )}
        </div>

        <Textarea
          placeholder="Share your university experience anonymously..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          className={cn(
            "min-h-[80px] resize-none border-none focus-visible:ring-0 p-0 pl-0 text-base",
            errors.content ? "border-red-500 focus-visible:ring-red-500" : ""
          )}
        />
        {errors.content && (
          <p className="mt-1 text-sm text-red-500">{errors.content[0]}</p>
        )}

        {isExpanded && (
          <div className="space-y-4 mt-4">
            <div className="flex flex-wrap gap-2">
              {images.map((img, index) => (
                <div key={index} className="relative w-24 h-24">
                  <Image
                    src={img || user.src}
                    alt={`Preview ${index}`}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover rounded-md"
                  />
                  <Button
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-1 hover:bg-gray-900 transition-colors"
                  >
                    <X size={14} />
                  </Button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Hashtags</label>
                <Input
                  placeholder="#campuslife #studygrind"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-lg text-black">Feeling</label>
                <div className="mt-1 space-y-2">
                  <Select value={selectedFeeling} onValueChange={handleFeelingChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="How are you feeling?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Select a feeling</SelectLabel>
                        <SelectItem value="happy">😊 Happy</SelectItem>
                        <SelectItem value="sad">😢 Sad</SelectItem>
                        <SelectItem value="excited">🎉 Excited</SelectItem>
                        <SelectItem value="stressed">😰 Stressed</SelectItem>
                        <SelectItem value="motivated">💪 Motivated</SelectItem>
                        <SelectItem value="tired">😴 Tired</SelectItem>
                        <SelectItem value="custom">✏️ Custom feeling...</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  
                  {selectedFeeling === "custom" && (
                    <Input
                      placeholder="Enter your feeling..."
                      value={customFeeling}
                      onChange={handleCustomFeelingChange}
                    />
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400">Link</label>
              <Input
                placeholder="https://example.com"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        )}

        {images.length > 0 && !isExpanded && (
          <div className="mt-4 flex items-center text-sm text-gray-500">
            <ImageIcon size={16} className="mr-2" />
            {images.length} image{images.length > 1 ? "s" : ""} attached
          </div>
        )}
      </CardContent>

      <CardFooter
        className={cn(
          "flex justify-between items-center p-4 border-t border-gray-100 dark:border-gray-800",
          isExpanded ? "flex" : "hidden sm:flex",
        )}
      >
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon size={18} className="mr-2" />
            Photo
          </Button>
          <Input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            multiple
            accept="image/*"
            className="hidden"
          />

          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={() => setIsExpanded(true)}
          >
            <Link size={18} className="mr-2" />
            Link
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={() => setIsExpanded(true)}
          >
            <Smile size={18} className="mr-2" />
            Feeling
          </Button>
        </div>

        <Button
          onClick={handleSubmit}
          className="bg-[#1d2b7d] hover:bg-[#1d2b7d]/90 text-white transition-colors"
          disabled={!content.trim() && images.length === 0}
        >
          Post
        </Button>
      </CardFooter>
    </Card>
  )
}
