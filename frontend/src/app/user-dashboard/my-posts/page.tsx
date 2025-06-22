"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Clock, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import Link from "next/link";
import logo8 from "@/assets/logo8.png";
import { useAppDispatch, usePosts, getUserPostsByStatus, getAllUserPosts } from "@/store/hooks";
import { Post } from "@/store/types/post";

const getStatusIcon = (status: Post["status"]) => {
  switch (status) {
    case "approved":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "pending":
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case "rejected":
      return <XCircle className="h-4 w-4 text-red-500" />;
  }
};

const getStatusBadge = (status: Post["status"]) => {
  switch (status) {
    case "approved":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
    case "pending":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending Review</Badge>;
    case "rejected":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>;
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

function PostCard({ post }: { post: Post }) {
  const [showFullContent, setShowFullContent] = useState(false);
  const contentPreview = post.content.length > 150 ? post.content.substring(0, 150) + "..." : post.content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link href={`/user-dashboard/feed/${post.id}`}>
        <Card className="overflow-hidden bg-white hover:shadow-lg transition-shadow duration-300 cursor-pointer">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-gray-100">
                  <AvatarImage src={post.author_avatar || logo8.src} alt="User avatar" />
                  <AvatarFallback>
                    {post.is_anonymous ? "A" : (post.author?.charAt(0).toUpperCase() || "U")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">
                      {post.is_anonymous ? "Anonymous" : (post.author || "Your Post")}
                    </h3>
                    {getStatusIcon(post.status)}
                  </div>
                  <p className="text-sm text-gray-500">{formatDate(post.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(post.status)}
              </div>
            </div>

            {/* Content */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h2>
              <p className="text-gray-700 mb-3">
                {showFullContent ? post.content : contentPreview}
                {post.content.length > 150 && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setShowFullContent(!showFullContent);
                    }}
                    className="text-blue-500 hover:text-blue-700 ml-1 font-medium"
                  >
                    {showFullContent ? "Show less" : "Read more"}
                  </button>
                )}
              </p>

              {/* Emotion */}
              {post.emotion && (
                <div className="mb-3">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">
                    😊 Feeling {post.emotion}
                  </span>
                </div>
              )}

              {/* Link */}
              {post.link && (
                <div className="mb-3">
                  <a
                    href={post.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View Link
                  </a>
                </div>
              )}
              
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="bg-sky-50 text-sky-600 hover:bg-sky-100">
                    #{tag}
                  </Badge>
                ))}
              </div>

              {/* Image */}
              {post.image && post.image.url && (
                <div 
                  className="relative cursor-pointer flex justify-center mb-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="overflow-hidden bg-gray-100 dark:bg-gray-800 rounded-lg flex justify-center items-center">
                    <Image
                      src={post.image.url}
                      width={800}
                      height={300}
                      alt={post.image.alt_text || "Post image"}
                      className="w-auto object-cover hover:scale-105 transition-transform duration-300"
                      style={{
                        minHeight: '300px',
                        maxHeight: '70vh',
                        width: 'auto',
                        objectFit: 'cover',
                        margin: '0 auto'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Admin Note for rejected posts */}
              {post.status === "rejected" && post.admin_note && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                  <div className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Admin Feedback</p>
                      <p className="text-sm text-red-700">{post.admin_note}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Stats */}
            {post.status === "approved" && (
              <div className="flex items-center gap-6 text-gray-500 text-sm border-t pt-3">
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  <span>{post.like_count}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>{post.comment_count}</span>
                </div>
              </div>
            )}
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

function LoadingCard() {
  return (
    <Card className="overflow-hidden bg-white">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
            <div>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="mb-4">
          <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-1"></div>
          <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse mb-3"></div>
          <div className="flex gap-2 mb-4">
            <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function MyPostsPage() {
  const dispatch = useAppDispatch();
  const { 
    userPosts,
    userPostsPagination,
    userPostsByStatus, 
    userPostsByStatusPagination, 
    isLoading,
    isLoadingByStatus, 
    error 
  } = usePosts();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>("all");

  // Fetch data based on active tab
  useEffect(() => {
    if (activeTab === 'all') {
      dispatch(getAllUserPosts());
    } else {
      dispatch(getUserPostsByStatus({ status: activeTab }));
    }
  }, [dispatch, activeTab]);

  // Get current posts based on active tab
  const getCurrentPosts = (): Post[] => {
    if (activeTab === 'all') {
      return userPosts;
    }
    return userPostsByStatus[activeTab] || [];
  };

  // Get current pagination based on active tab
  const getCurrentPagination = () => {
    if (activeTab === 'all') {
      return userPostsPagination;
    }
    return userPostsByStatusPagination[activeTab];
  };

  // Get current loading state
  const getCurrentLoadingState = (): boolean => {
    if (activeTab === 'all') {
      return isLoading;
    }
    return isLoadingByStatus[activeTab];
  };

  const currentPosts = getCurrentPosts();
  const currentPagination = getCurrentPagination();
  const isCurrentlyLoading = getCurrentLoadingState();

  // Error state
  if (error && !isCurrentlyLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-500 text-lg mb-2">Error Loading Posts</div>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={() => {
              if (activeTab === 'all') {
                dispatch(getAllUserPosts());
              } else {
                dispatch(getUserPostsByStatus({ status: activeTab }));
              }
            }}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Posts</h1>
          <p className="text-gray-600">Manage and track the status of your posts</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="all" className="flex items-center gap-2">
              All Posts
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              Approved
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              Pending
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              Rejected
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {/* Loading state */}
            {isCurrentlyLoading ? (
              <div className="space-y-6">
                {[...Array(3)].map((_, index) => (
                  <LoadingCard key={index} />
                ))}
              </div>
            ) : currentPosts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-2">No posts found</div>
                <p className="text-gray-500">
                  {activeTab === "all" 
                    ? "You haven't created any posts yet." 
                    : `You don't have any ${activeTab} posts.`}
                </p>
                <Link href="/user-dashboard/feed">
                  <Button className="mt-4">
                    Create Your First Post
                  </Button>
                </Link>
              </div>
            ) : (
              currentPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Pagination - Updated to handle both all and status-specific pagination */}
        {currentPagination && currentPagination.last_page > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPagination.current_page === 1}
                onClick={() => {
                  const currentPage = currentPagination.current_page;
                  if (currentPage > 1) {
                    if (activeTab === 'all') {
                      dispatch(getAllUserPosts({ page: currentPage - 1 }));
                    } else {
                      dispatch(getUserPostsByStatus({ 
                        status: activeTab, 
                        params: { page: currentPage - 1 } 
                      }));
                    }
                  }
                }}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-500">
                Page {currentPagination.current_page} of {currentPagination.last_page}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPagination.current_page === currentPagination.last_page}
                onClick={() => {
                  const currentPage = currentPagination.current_page;
                  const lastPage = currentPagination.last_page;
                  if (currentPage < lastPage) {
                    if (activeTab === 'all') {
                      dispatch(getAllUserPosts({ page: currentPage + 1 }));
                    } else {
                      dispatch(getUserPostsByStatus({ 
                        status: activeTab, 
                        params: { page: currentPage + 1 } 
                      }));
                    }
                  }
                }}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 