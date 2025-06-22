"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Search,
  X,
  Grid3X3,
  List,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { 
  fetchPendingPosts, 
  fetchApprovedPosts, 
  fetchRejectedPosts,
  fetchAllPosts,
  fetchDashboardOverview,
  approvePost,
  rejectPost,
  setPostFilters
} from "@/store/slices/adminSlice";
import { RejectionReasonModal } from "./rejection-reason-modal";
import { ApprovalConfirmationModal } from "./approval-confirmation-modal";
import { Post } from "@/store/types/post";
import { ConfessionTableModern } from "./confession-table-modern";
import { ConfessionCards } from "./confession-cards";
import { ConfessionModal } from "./confession-modal";
import { StatsCards } from "./stats-cards";
import { Confession } from "./types/confession";

// Define the ConfessionStats interface
interface ConfessionStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalUsers: number;
  today: number;
  yesterday: number;
  lastWeekend: number;
}

// Transform Post to Confession
const transformPostToConfession = (post: Post): Confession => ({
  id: post?.id || 0,
  userName: post?.is_anonymous 
    ? "Anonymous" 
    : (post?.author !== "Anonymous User" ? post?.author : "Anonymous"),
  title: post?.title || "No title available",
  description: post?.content || post?.title || "No content available",
  image: post?.image?.has_image && post?.image?.url ? post.image.url : undefined,
  hashtag: post?.tags?.length ? post.tags.join(", ") : "general",
  adminHashtag: post?.admin_note || "",
  adminComment: post?.admin_note || "",
  link: "",
  feeling: "neutral", // Default feeling since posts don't have feelings
  timeConfession: post?.created_at || new Date().toISOString(),
  status: post?.status || "pending",
  category: post?.tags?.[0] || "general",
  tags: post?.tags || [],
  likeCount: post?.like_count || 0,
  commentCount: post?.comment_count || 0,
});

export default function PostManagementDashboard() {
  const dispatch = useAppDispatch();
  
  // Redux state
  const {
    pendingPosts,
    approvedPosts,
    rejectedPosts,
    allPosts,
    dashboardOverview,
    pagination,
    filters,
    loading,
    error
  } = useAppSelector((state) => state.admin);

  // Local state
  const [selectedPosts, setSelectedPosts] = useState<number[]>([]);
  const [selectedPost, setSelectedPost] = useState<Confession | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters.posts.search || "");
  const [activeTab, setActiveTab] = useState("all");
  const [statusFilter] = useState(filters.posts.status || "all");
  const [currentPage, setCurrentPage] = useState(filters.posts.page);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const itemsPerPage = filters.posts.per_page;
  
  // Rejection modal state
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [postToReject, setPostToReject] = useState<number | null>(null);
  const [isBulkRejection, setIsBulkRejection] = useState(false);
  
  // Approval modal state
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [postToApprove, setPostToApprove] = useState<number | null>(null);
  const [isBulkApproval, setIsBulkApproval] = useState(false);

  // Load data on component mount
  useEffect(() => {
    dispatch(fetchDashboardOverview());
    
    // Load posts based on active tab
    switch (activeTab) {
      case "pending":
        dispatch(fetchPendingPosts({ 
          page: currentPage, 
          per_page: itemsPerPage,
          search: searchTerm || undefined
        }));
        break;
      case "approved":
        dispatch(fetchApprovedPosts({ 
          page: currentPage, 
          per_page: itemsPerPage,
          search: searchTerm || undefined
        }));
        break;
      case "rejected":
        dispatch(fetchRejectedPosts({ 
          page: currentPage, 
          per_page: itemsPerPage,
          search: searchTerm || undefined
        }));
        break;
      default:
        // Load all posts
        dispatch(fetchAllPosts({ page: currentPage, per_page: itemsPerPage, search: searchTerm || undefined }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on initial mount

  // Update filters in Redux when local state changes
  useEffect(() => {
    // Only update the Redux store with filter changes
    // (don't trigger data fetches here)
    dispatch(setPostFilters({
      search: searchTerm || undefined,
      status: statusFilter !== "all" ? statusFilter as "pending" | "approved" | "rejected" | undefined : undefined,
      page: currentPage,
      per_page: itemsPerPage
    }));
  }, [dispatch, searchTerm, statusFilter, currentPage, itemsPerPage]);

  // Function to refresh posts data based on current active tab
  const refreshPostsData = useCallback(() => {
    setIsRefreshing(true);
    
    // Small timeout to ensure the loading state is visible
    setTimeout(() => {
      switch (activeTab) {
        case "pending":
          dispatch(fetchPendingPosts({ 
            page: currentPage, 
            per_page: itemsPerPage, 
            search: searchTerm || undefined 
          }));
          break;
        case "approved":
          dispatch(fetchApprovedPosts({ 
            page: currentPage, 
            per_page: itemsPerPage, 
            search: searchTerm || undefined 
          }));
          break;
        case "rejected":
          dispatch(fetchRejectedPosts({ 
            page: currentPage, 
            per_page: itemsPerPage, 
            search: searchTerm || undefined 
          }));
          break;
        default:
          dispatch(fetchAllPosts({ 
            page: currentPage, 
            per_page: itemsPerPage, 
            search: searchTerm || undefined 
          }));
          break;
      }
      
      // Set refreshing to false after a short delay to ensure smooth transition
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }, 300);
  }, [dispatch, activeTab, currentPage, itemsPerPage, searchTerm]);

  // Calculate stats from dashboard overview
  const stats: ConfessionStats = useMemo(() => {
    if (!dashboardOverview) {
      return {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        totalUsers: 0,
        today: 0,
        yesterday: 0,
        lastWeekend: 0,
      };
    }

    return {
      total: dashboardOverview.total_confessions,
      pending: dashboardOverview.posts_by_status.pending,
      approved: dashboardOverview.posts_by_status.approved,
      rejected: dashboardOverview.posts_by_status.rejected,
      totalUsers: dashboardOverview.total_users,
      today: 0, // These are not relevant anymore but needed for compatibility
      yesterday: 0,
      lastWeekend: 0,
    };
  }, [dashboardOverview]);

  // Get current posts based on active tab
  const getCurrentPosts = (): Post[] => {
    switch (activeTab) {
      case "pending":
        return pendingPosts;
      case "approved":
        return approvedPosts;
      case "rejected":
        return rejectedPosts;
      default:
        return allPosts;
    }
  };

  const currentPosts = getCurrentPosts();
  
  // Filter posts based on search and status filter
  const filteredPosts = useMemo(() => {
    let filtered = currentPosts;

    if (statusFilter !== "all" && activeTab === "all") {
      filtered = filtered.filter(post => post.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(post =>
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return filtered;
  }, [currentPosts, statusFilter, searchTerm, activeTab]);

  // Transform posts to confessions for existing components
  const confessions = filteredPosts.map(transformPostToConfession);

  // Pagination
  const getCurrentPagination = () => {
    switch (activeTab) {
      case "pending":
        return pagination.pendingPosts;
      case "approved":
        return pagination.approvedPosts;
      case "rejected":
        return pagination.rejectedPosts;
      default:
        return pagination.allPosts;
    }
  };

  const currentPagination = getCurrentPagination();
  const totalPages = currentPagination?.last_page || Math.ceil(confessions.length / itemsPerPage);
  const paginatedConfessions = confessions; // Server-side pagination, no client-side slicing needed

  // Handlers
  const handleStatusChange = useCallback(async (id: number, status: "approved" | "rejected") => {
    if (status === "approved") {
      // For approval, open modal to confirm
      setPostToApprove(id);
      setIsBulkApproval(false);
      setIsApprovalModalOpen(true);
    } else {
      // For rejection, open modal to get reason
      setPostToReject(id);
      setIsBulkRejection(false);
      setIsRejectionModalOpen(true);
    }
  }, []);
  
  // Handle approval with optional note
  const handleApproveConfirmation = useCallback(async () => {
    if (!postToApprove && !isBulkApproval) {
      return;
    }
    
    try {
      if (isBulkApproval) {
        // Handle bulk approval
        await Promise.all(
          selectedPosts.map(id => dispatch(approvePost({ postId: id })).unwrap())
        );
        setSelectedPosts([]);
      } else {
        // Handle single post approval
        await dispatch(approvePost({ postId: postToApprove! })).unwrap();
      }
      
      // Refresh data after status change
      dispatch(fetchDashboardOverview());
      
      // If we're on a specific tab and this was the last item, go back to page 1
      if (activeTab !== "all" && paginatedConfessions.length === 1 && currentPage > 1) {
        setCurrentPage(1);
      } else {
        refreshPostsData();
      }
      
      // Close the approval modal
      setIsApprovalModalOpen(false);
      setPostToApprove(null);
      setIsBulkApproval(false);
    } catch (error: unknown) {
      console.error("Failed to approve post:", error);
    }
  }, [dispatch, postToApprove, isBulkApproval, selectedPosts, refreshPostsData, activeTab, paginatedConfessions.length, currentPage]);

  // Handle rejection with reason
  const handleRejectWithReason = useCallback(async (reason: string) => {
    if (!postToReject && !isBulkRejection) {
      return;
    }
    
    try {
      if (isBulkRejection) {
        // Handle bulk rejection
        await Promise.all(
          selectedPosts.map(id => dispatch(rejectPost({ postId: id, admin_note: reason })).unwrap())
        );
        setSelectedPosts([]);
      } else {
        // Handle single post rejection
        await dispatch(rejectPost({ postId: postToReject!, admin_note: reason })).unwrap();
      }
      
      // Refresh data after status change
      dispatch(fetchDashboardOverview());
      
      // If we're on a specific tab and this was the last item, go back to page 1
      if (activeTab !== "all" && paginatedConfessions.length === 1 && currentPage > 1) {
        setCurrentPage(1);
      } else {
        refreshPostsData();
      }
      
      // Close the rejection modal
      setIsRejectionModalOpen(false);
      setPostToReject(null);
      setIsBulkRejection(false);
    } catch (error: unknown) {
      console.error("Failed to reject post:", error);
    }
  }, [dispatch, postToReject, isBulkRejection, selectedPosts, refreshPostsData, activeTab, paginatedConfessions.length, currentPage]);

  const handleBulkApprove = useCallback(() => {
    if (selectedPosts.length === 0) return;
    
    // Open approval modal for bulk approval
    setIsBulkApproval(true);
    setPostToApprove(null);
    setIsApprovalModalOpen(true);
  }, [selectedPosts]);

  const handleBulkReject = useCallback(() => {
    if (selectedPosts.length === 0) return;
    
    // Open rejection modal for bulk rejection
    setIsBulkRejection(true);
    setPostToReject(null);
    setIsRejectionModalOpen(true);
  }, [selectedPosts]);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedPosts(paginatedConfessions.map(c => c.id));
    } else {
      setSelectedPosts([]);
    }
  }, [paginatedConfessions]);

  const handleView = useCallback((confession: Confession) => {
    setSelectedPost(confession);
    setIsModalOpen(true);
  }, []);

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    setCurrentPage(1);
    setSelectedPosts([]);
    setIsRefreshing(true);
    
    // Small timeout to ensure the loading state is visible
    setTimeout(() => {
      switch (tabId) {
        case "pending":
          dispatch(fetchPendingPosts({ 
            page: 1, 
            per_page: itemsPerPage,
            search: searchTerm || undefined
          }));
          break;
        case "approved":
          dispatch(fetchApprovedPosts({ 
            page: 1, 
            per_page: itemsPerPage,
            search: searchTerm || undefined
          }));
          break;
        case "rejected":
          dispatch(fetchRejectedPosts({ 
            page: 1, 
            per_page: itemsPerPage,
            search: searchTerm || undefined
          }));
          break;
        default:
          dispatch(fetchAllPosts({ 
            page: 1, 
            per_page: itemsPerPage, 
            search: searchTerm || undefined 
          }));
          break;
      }
      
      // Set refreshing to false after a short delay to ensure smooth transition
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }, 300);
  }, [dispatch, itemsPerPage, searchTerm]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    setIsRefreshing(true);
    
    // Small timeout to ensure the loading state is visible
    setTimeout(() => {
      switch (activeTab) {
        case "pending":
          dispatch(fetchPendingPosts({ 
            page, 
            per_page: itemsPerPage,
            search: searchTerm || undefined
          }));
          break;
        case "approved":
          dispatch(fetchApprovedPosts({ 
            page, 
            per_page: itemsPerPage,
            search: searchTerm || undefined
          }));
          break;
        case "rejected":
          dispatch(fetchRejectedPosts({ 
            page, 
            per_page: itemsPerPage,
            search: searchTerm || undefined
          }));
          break;
        default:
          dispatch(fetchAllPosts({ 
            page, 
            per_page: itemsPerPage, 
            search: searchTerm || undefined 
          }));
          break;
      }
      
      // Set refreshing to false after a short delay to ensure smooth transition
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
  }, [dispatch, activeTab, itemsPerPage, searchTerm]);

  // Updated tabs without time-based filters
  const tabs = [
    { id: "all", label: "All Posts", count: stats.total },
    { id: "pending", label: "Pending", count: stats.pending },
    { id: "approved", label: "Approved", count: stats.approved },
    { id: "rejected", label: "Rejected", count: stats.rejected },
  ];

  // Function to handle search with debounce
  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    
    // Only trigger loading state if there's an actual search
    if (value.length > 0) {
      setIsRefreshing(true);
    }
    
    // Debounce search requests
    const timeoutId = setTimeout(() => {
      switch (activeTab) {
        case "pending":
          dispatch(fetchPendingPosts({ 
            page: 1, 
            per_page: itemsPerPage,
            search: value || undefined
          }));
          break;
        case "approved":
          dispatch(fetchApprovedPosts({ 
            page: 1, 
            per_page: itemsPerPage,
            search: value || undefined
          }));
          break;
        case "rejected":
          dispatch(fetchRejectedPosts({ 
            page: 1, 
            per_page: itemsPerPage,
            search: value || undefined
          }));
          break;
        default:
          dispatch(fetchAllPosts({ 
            page: 1, 
            per_page: itemsPerPage, 
            search: value || undefined 
          }));
          break;
      }
      setCurrentPage(1);
      
      // Turn off refreshing state after a delay
      setTimeout(() => {
        setIsRefreshing(false);
      }, 300);
    }, 500); // 500ms debounce
    
    return () => clearTimeout(timeoutId);
  }, [dispatch, activeTab, itemsPerPage]);

  // Loading state
  if (loading.fetchDashboardOverview && !dashboardOverview) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animate-page-load">
      {/* Header */}
      <div className="animate-header-slide">
        <div className="mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Title Section */}
            <div className="flex flex-col text-left px-4 py-6 space-y-2">
              <h1 className="text-3xl sm:text-2xl lg:text-4xl font-bold text-black">
                Posts Management
              </h1>
              <p className="font-light sm:text-lg text-black">
                Manage and review student posts
              </p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="flex-1 sm:flex-none"
              >
                <List className="h-4 w-4 mr-2" />
                Table
              </Button>
              <Button
                variant={viewMode === "cards" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("cards")}
                className="flex-1 sm:flex-none"
              >
                <Grid3X3 className="h-4 w-4 mr-2" />
                Cards
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-auto">
        {/* Stats Cards */}
        <div className="mb-6 sm:mb-8 animate-stats-cascade stagger-1">
          <StatsCards stats={stats} />
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-4 sm:mb-6 animate-fade-in stagger-2">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`whitespace-nowrap py-2 sm:py-3 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 transition-all duration-200 ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
                <Badge
                  variant="secondary"
                  className={`text-xs transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {tab.count}
                </Badge>
              </button>
            ))}
          </nav>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6 animate-fade-in stagger-3">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 w-full sm:w-80 text-gray-600 bg-white"
                />
              </div>

              {/* Bulk Actions */}
              {selectedPosts.length > 0 && (
                <div className="flex gap-2 animate-slide-up">
                  <Button
                    size="sm"
                    onClick={handleBulkApprove}
                    disabled={loading.approvePost}
                    className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve ({selectedPosts.length})
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleBulkReject}
                    disabled={loading.rejectPost}
                    className="flex-1 sm:flex-none"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject with Reason ({selectedPosts.length})
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading States */}
        {(loading.fetchPendingPosts || loading.fetchApprovedPosts || loading.fetchRejectedPosts || loading.fetchAllPosts) && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}

        {/* Content */}
        <div className="animate-content-reveal stagger-4 relative">
          {/* Refreshing overlay */}
          {isRefreshing && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-sm text-blue-600 font-medium">Updating list...</p>
              </div>
            </div>
          )}
          
          {viewMode === "table" ? (
            <ConfessionTableModern
              confessions={paginatedConfessions}
              selectedConfessions={selectedPosts}
              onSelectionChange={setSelectedPosts}
              onSelectAll={handleSelectAll}
              onStatusChange={handleStatusChange}
              onView={handleView}
            />
          ) : (
            <ConfessionCards
              confessions={paginatedConfessions}
              selectedConfessions={selectedPosts}
              onSelectionChange={setSelectedPosts}
              onStatusChange={handleStatusChange}
              onView={handleView}
            />
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 sm:mt-8 px-4 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm animate-fade-in stagger-5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex items-center gap-2 overflow-x-auto">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                const isActive = currentPage === page;

                return (
                  <Button
                    key={page}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className={`w-8 h-8 p-0 flex-shrink-0 ${
                      isActive ? "bg-black text-white hover:bg-black" : ""
                    }`}
                  >
                    {page}
                  </Button>
                );
              })}
              {totalPages > 5 && (
                <>
                  <span className="text-gray-500 flex-shrink-0">...</span>
                  <Button
                    variant={currentPage === totalPages ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(totalPages)}
                    className={`w-8 h-8 p-0 flex-shrink-0 ${
                      currentPage === totalPages
                        ? "bg-black text-white hover:bg-black"
                        : ""
                    }`}
                  >
                    {totalPages}
                  </Button>
                </>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="w-full sm:w-auto"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>

      {/* Modal */}
      <div className="animate-modal-entrance">
        <ConfessionModal
          confession={selectedPost}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onStatusChange={handleStatusChange}
        />
      </div>

      {/* Rejection Reason Modal */}
      <RejectionReasonModal
        isOpen={isRejectionModalOpen}
        onClose={() => {
          setIsRejectionModalOpen(false);
          setPostToReject(null);
          setIsBulkRejection(false);
        }}
        onSubmit={handleRejectWithReason}
        isBulk={isBulkRejection}
        isLoading={loading.rejectPost}
      />

      {/* Approval Confirmation Modal */}
      <ApprovalConfirmationModal
        isOpen={isApprovalModalOpen}
        onClose={() => {
          setIsApprovalModalOpen(false);
          setPostToApprove(null);
          setIsBulkApproval(false);
        }}
        onSubmit={handleApproveConfirmation}
        isBulk={isBulkApproval}
        isLoading={loading.approvePost}
      />
    </div>
  );
}
