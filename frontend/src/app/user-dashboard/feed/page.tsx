import type { Metadata } from "next"
import SocialFeed from "./social-feed"

export const metadata: Metadata = {
  title: "Anonymous Social Feed",
  description: "Share your thoughts and images anonymously",
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6 text-[#1d2b7d] dark:text-gray-100">Social Feed</h1>
        
        <SocialFeed />
      </div>
    </div>
  )
}
