import { Post } from './post';
import { Comment } from './comment';
import { Message } from './message';
import { FAQ } from './faq';
import { TagModel } from './tag';
import { User } from './auth';

// ============================================================================
// DASHBOARD & ANALYTICS TYPES
// ============================================================================

export interface DashboardOverview {
  total_users: number;
  new_users_last_week: number;
  total_confessions: number;
  total_engagement: {
    likes: number;
    comments: number;
    shares: number;
    total: number;
  };
  posts_by_status: {
    pending: number;
    approved: number;
    rejected: number;
  };
  messages_by_status: {
    unread: number;
    read: number;
    responded: number;
    total: number;
  };
}

export interface WeeklyStatistics {
  weekly_confessions: Array<{
    week: string;
    count: number;
  }>;
  weekly_new_users: Array<{
    week: string;
    count: number;
  }>;
  weekly_engagement: Array<{
    week: string;
    likes: number;
    comments: number;
    total: number;
  }>;
}

export interface EngagementStatistics {
  total_posts: number;
  total_likes: number;
  total_comments: number;
  avg_likes_per_post: number;
  avg_comments_per_post: number;
  top_engaged_posts: Array<{
    id: number;
    title: string;
    like_count: number;
    comment_count: number;
    total_engagement: number;
  }>;
  most_active_users: Array<{
    id: number;
    name: string;
    posts_count: number;
    comments_count: number;
    likes_count: number;
    total_activity: number;
  }>;
}

// ============================================================================
// USER MANAGEMENT TYPES
// ============================================================================

export interface AdminUserWithStats extends User {
  statistics: {
    total_posts: number;
    total_comments: number;
    total_likes_given: number;
    total_likes_received: number;
  };
}

export interface UserStatistics {
  total_posts: number;
  total_comments: number;
  total_likes_given: number;
  total_likes_received: number;
  recent_activity: Array<{
    type: 'post' | 'comment' | 'like';
    created_at: string;
    related_post?: {
      id: number;
      title: string;
    };
  }>;
}

export interface BulkUserAction {
  action: 'change_role' | 'suspend' | 'activate' | 'delete';
  user_ids: number[];
  role?: 'user' | 'moderator' | 'admin';
  reason?: string;
}

// ============================================================================
// STATISTICS TYPES
// ============================================================================

export interface PostStatistics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  total_engagement: {
    likes: number;
    comments: number;
    total: number;
  };
}

export interface MessageStatistics {
  total_messages: number;
  unread_count: number;
  read_count: number;
  responded_count: number;
  avg_response_time: string;
  top_users: Array<{
    user_name: string;
    message_count: number;
  }>;
}

export interface FaqStatistics {
  total_faqs: number;
  views_last_week: number;
  most_viewed: Array<{
    id: number;
    question: string;
    views: number;
  }>;
}

// Admin State Interface
export interface AdminState {
  // Dashboard Analytics
  dashboardOverview: DashboardOverview | null;
  weeklyStatistics: WeeklyStatistics | null;
  engagementStatistics: EngagementStatistics | null;

  // User Management
  allUsers: AdminUserWithStats[];
  selectedUser: AdminUserWithStats | null;
  userStatistics: UserStatistics | null;

  // Content Management
  pendingPosts: Post[];
  approvedPosts: Post[];
  rejectedPosts: Post[];
  allPosts: Post[];
  postStatistics: PostStatistics | null;
  
  pendingComments: Comment[];
  allComments: Comment[];
  
  // Message Management
  userMessages: Message[];
  unreadMessages: Message[];
  readMessages: Message[];
  respondedMessages: Message[];
  selectedMessage: Message | null;
  messageStatistics: MessageStatistics | null;
  
  // FAQ Management
  faqs: FAQ[];
  faqStatistics: FaqStatistics | null;
  
  // Tag Management
  tags: TagModel[];
  
  // Pagination for different content types
  pagination: {
    allUsers: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      from: number;
      to: number;
    } | null;
    allPosts: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      from: number;
      to: number;
    } | null;
    pendingPosts: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      from: number;
      to: number;
    } | null;
    approvedPosts: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      from: number;
      to: number;
    } | null;
    rejectedPosts: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      from: number;
      to: number;
    } | null;
    allComments: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      from: number;
      to: number;
    } | null;
    pendingComments: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      from: number;
      to: number;
    } | null;
    allMessages: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      from: number;
      to: number;
    } | null;
    userMessages: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      from: number;
      to: number;
    } | null;
    unreadMessages: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      from: number;
      to: number;
    } | null;
    readMessages: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      from: number;
      to: number;
    } | null;
    respondedMessages: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      from: number;
      to: number;
    } | null;
  };
  
  // Filters
  filters: {
    users: {
      search?: string;
      role?: 'user' | 'moderator' | 'admin';
      sort_by?: 'created_at' | 'name' | 'email';
      sort_order?: 'asc' | 'desc';
      page: number;
      per_page: number;
    };
    posts: {
      status?: 'pending' | 'approved' | 'rejected';
      search?: string;
      user_id?: number;
      created_from?: string;
      created_to?: string;
      sort_by?: 'created_at' | 'most_liked' | 'most_commented';
      sort_order?: 'asc' | 'desc';
      page: number;
      per_page: number;
    };
    comments: {
      status?: 'pending' | 'approved' | 'rejected';
      search?: string;
      post_id?: number;
      page: number;
      per_page: number;
    };
    messages: {
      status?: 'unread' | 'read' | 'responded';
      search?: string;
      user_id?: number;
      date_from?: string;
      date_to?: string;
      sort_by?: 'unread_first' | 'created_at';
      page: number;
      per_page: number;
    };
  };
  
  // Loading states
  loading: {
    fetchUserMessages: unknown;
    // Dashboard
    fetchDashboardOverview: boolean;
    fetchWeeklyStatistics: boolean;
    fetchEngagementStatistics: boolean;
    
    // User Management
    fetchAllUsers: boolean;
    fetchUserDetails: boolean;
    fetchUserStatistics: boolean;
    createUser: boolean;
    updateUser: boolean;
    deleteUser: boolean;
    bulkUserAction: boolean;
    
    // Post Management
    fetchAllPosts: boolean;
    fetchPendingPosts: boolean;
    fetchApprovedPosts: boolean;
    fetchRejectedPosts: boolean;
    fetchPostStatistics: boolean;
    approvePost: boolean;
    rejectPost: boolean;
    
    // Comment Management
    fetchAllComments: boolean;
    fetchPendingComments: boolean;
    approveComment: boolean;
    rejectComment: boolean;
    
    // Message Management
    fetchAllMessages: boolean;
    fetchUnreadMessages: boolean;
    fetchReadMessages: boolean;
    fetchRespondedMessages: boolean;
    fetchMessageDetails: boolean;
    fetchMessageStatistics: boolean;
    replyToMessage: boolean;
    updateMessageStatus: boolean;
    
    // FAQ Management
    fetchFaqStatistics: boolean;
    createFaq: boolean;
    updateFaq: boolean;
    deleteFaq: boolean;
    
    // Tag Management
    createTag: boolean;
    deleteTag: boolean;
  };
  
  // Error handling
  error: string | null;
}

// ============================================================================
// DASHBOARD & ANALYTICS PAYLOADS
// ============================================================================

export interface DashboardOverviewResponse {
  success: boolean;
  message: string;
  data: DashboardOverview;
}

export interface WeeklyStatisticsResponse {
  success: boolean;
  message: string;
  data: WeeklyStatistics;
}

export interface EngagementStatisticsResponse {
  success: boolean;
  message: string;
  data: EngagementStatistics;
}

// ============================================================================
// USER MANAGEMENT PAYLOADS
// ============================================================================

export interface GetAllUsersParams {
  page?: number;
  per_page?: number;
  search?: string;
  role?: 'user' | 'moderator' | 'admin';
  sort_by?: 'created_at' | 'name' | 'email';
  sort_order?: 'asc' | 'desc';
}

export interface GetAllUsersResponse {
  success: boolean;
  message: string;
  data: {
    current_page: number;
    data: AdminUserWithStats[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
  };
}

export interface GetUserDetailsResponse {
  success: boolean;
  message: string;
  data: {
    user: AdminUserWithStats;
  };
}

export interface GetUserStatisticsResponse {
  success: boolean;
  message: string;
  data: UserStatistics;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role?: 'user' | 'moderator' | 'admin';
  bio?: string;
  is_anonymous?: boolean;
}

export interface UpdateUserPayload {
  userId: number;
  name?: string;
  email?: string;
  role?: 'user' | 'moderator' | 'admin';
  bio?: string;
  is_anonymous?: boolean;
}

export interface BulkUserActionResponse {
  success: boolean;
  message: string;
  data: {
    affected_users: number;
    details: string;
  };
}

// ============================================================================
// ENHANCED POST MANAGEMENT PAYLOADS
// ============================================================================

export interface GetAllPostsParams {
  page?: number;
  per_page?: number;
  status?: 'pending' | 'approved' | 'rejected';
  search?: string;
  user_id?: number;
  created_from?: string;
  created_to?: string;
  sort_by?: 'created_at' | 'most_liked' | 'most_commented';
  sort_order?: 'asc' | 'desc';
}

export interface GetPostStatisticsResponse {
  success: boolean;
  message: string;
  data: PostStatistics;
}

// Post Management Payloads (existing)
export interface ApprovePostPayload {
  postId: number;
  admin_note?: string;
}

export interface RejectPostPayload {
  postId: number;
  admin_note?: string;
  reason?: string;
}

export interface ApprovePostResponse {
  success: boolean;
  message: string;
  data: {
    post: Post;
  };
}

export interface RejectPostResponse {
  success: boolean;
  message: string;
  data: {
    post: Post;
  };
}

// ============================================================================
// ENHANCED COMMENT MANAGEMENT PAYLOADS
// ============================================================================

export interface GetAllCommentsParams {
  page?: number;
  per_page?: number;
  status?: 'pending' | 'approved' | 'rejected';
  search?: string;
  post_id?: number;
}

// Comment Management Payloads (existing)
export interface ApproveCommentPayload {
  commentId: number;
  admin_note?: string;
}

export interface RejectCommentPayload {
  commentId: number;
  admin_note?: string;
  reason?: string;
}

export interface ApproveCommentResponse {
  success: boolean;
  message: string;
  data: {
    comment: Comment;
  };
}

export interface RejectCommentResponse {
  success: boolean;
  message: string;
  data: {
    comment: Comment;
  };
}

// ============================================================================
// ENHANCED MESSAGE MANAGEMENT PAYLOADS
// ============================================================================

export interface GetAllMessagesParams {
  page?: number;
  per_page?: number;
  status?: 'unread' | 'read' | 'responded';
  search?: string;
  user_id?: number;
  date_from?: string;
  date_to?: string;
  sort_by?: 'unread_first' | 'created_at';
}

export interface GetMessageDetailsResponse {
  success: boolean;
  message: string;
  data: {
    message: Message;
  };
}

export interface UpdateMessageStatusPayload {
  messageId: number;
  status: 'read' | 'responded';
}

export interface UpdateMessageStatusResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    status: 'read' | 'responded';
    status_display: string;
    updated_at: string;
  };
}

export interface GetMessageStatisticsResponse {
  success: boolean;
  message: string;
  data: MessageStatistics;
}

// Message Management Payloads (reuse from message.ts)
export interface AdminReplyToMessagePayload {
  messageId: number;
  content: string;
}

export interface AdminReplyToMessageResponse {
  success: boolean;
  message: string;
  data: {
    message: Message;
  };
}

// ============================================================================
// FAQ MANAGEMENT PAYLOADS
// ============================================================================

export interface GetFaqStatisticsResponse {
  success: boolean;
  message: string;
  data: FaqStatistics;
}

// ============================================================================
// CONTENT FETCHING PAYLOADS (existing - updated)
// ============================================================================

export interface GetPendingPostsParams {
  page?: number;
  per_page?: number;
  search?: string;
  date_from?: string;
  date_to?: string;
}

export interface GetApprovedPostsParams {
  page?: number;
  per_page?: number;
  search?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: 'most_liked' | 'created_at';
}

export interface GetRejectedPostsParams {
  page?: number;
  per_page?: number;
  search?: string;
  date_from?: string;
  date_to?: string;
}

export interface GetPendingCommentsParams {
  page?: number;
  per_page?: number;
  search?: string;
}

export interface GetAdminUserMessagesParams {
  page?: number;
  per_page?: number;
  status?: 'unread' | 'read' | 'responded';
  search?: string;
}

// Response interfaces (existing)
export interface GetPendingPostsResponse {
  success: boolean;
  message: string;
  data: {
    current_page: number;
    data: Post[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
  };
}

export interface GetPendingCommentsResponse {
  success: boolean;
  message: string;
  data: {
    current_page: number;
    data: Comment[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
  };
}

export interface GetAdminUserMessagesResponse {
  success: boolean;
  message: string;
  data: Message[];
  meta: {
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      from: number;
      to: number;
      has_more_pages: boolean;
    };
    stats: {
      total_messages: number;
      unread_count: number;
      read_count: number;
      responded_count: number;
      messages_today: number;
      messages_this_week: number;
      messages_this_month: number;
    };
    top_users: Array<{
      user_id: number;
      user_name: string;
      user_email: string;
      message_count: number;
    }>;
  };
}

// ============================================================================
// FILTER PAYLOADS
// ============================================================================

export interface SetAdminUserFiltersPayload {
  search?: string;
  role?: 'user' | 'moderator' | 'admin';
  sort_by?: 'created_at' | 'name' | 'email';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface SetAdminPostFiltersPayload {
  status?: 'pending' | 'approved' | 'rejected';
  search?: string;
  user_id?: number;
  created_from?: string;
  created_to?: string;
  sort_by?: 'created_at' | 'most_liked' | 'most_commented';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface SetAdminCommentFiltersPayload {
  status?: 'pending' | 'approved' | 'rejected';
  search?: string;
  post_id?: number;
  page?: number;
  per_page?: number;
}

export interface SetAdminMessageFiltersPayload {
  status?: 'unread' | 'read' | 'responded';
  search?: string;
  user_id?: number;
  date_from?: string;
  date_to?: string;
  sort_by?: 'unread_first' | 'created_at';
  page?: number;
  per_page?: number;
}

// Initial state
export const initialAdminState: AdminState = {
  // Dashboard Analytics
  dashboardOverview: null,
  weeklyStatistics: null,
  engagementStatistics: null,

  // User Management
  allUsers: [],
  selectedUser: null,
  userStatistics: null,

  // Content Management
  pendingPosts: [],
  approvedPosts: [],
  rejectedPosts: [],
  allPosts: [],
  postStatistics: null,
  
  pendingComments: [],
  allComments: [],
  
  // Message Management
  userMessages: [],
  unreadMessages: [],
  readMessages: [],
  respondedMessages: [],
  selectedMessage: null,
  messageStatistics: null,
  
  // FAQ Management
  faqs: [],
  faqStatistics: null,
  
  // Tag Management
  tags: [],
  
  // Pagination for different content types
  pagination: {
    allUsers: null,
    allPosts: null,
    pendingPosts: null,
    approvedPosts: null,
    rejectedPosts: null,
    allComments: null,
    pendingComments: null,
    allMessages: null,
    userMessages: null,
    unreadMessages: null,
    readMessages: null,
    respondedMessages: null,
  },
  
  // Filters
  filters: {
    users: {
      page: 1,
      per_page: 20,
    },
    posts: {
      page: 1,
      per_page: 15,
    },
    comments: {
      page: 1,
      per_page: 15,
    },
    messages: {
      page: 1,
      per_page: 15,
    },
  },
  
  // Loading states
  loading: {
    // Dashboard
    fetchDashboardOverview: false,
    fetchWeeklyStatistics: false,
    fetchEngagementStatistics: false,

    // User Management
    fetchAllUsers: false,
    fetchUserDetails: false,
    fetchUserStatistics: false,
    createUser: false,
    updateUser: false,
    deleteUser: false,
    bulkUserAction: false,

    // Post Management
    fetchAllPosts: false,
    fetchPendingPosts: false,
    fetchApprovedPosts: false,
    fetchRejectedPosts: false,
    fetchPostStatistics: false,
    approvePost: false,
    rejectPost: false,

    // Comment Management
    fetchAllComments: false,
    fetchPendingComments: false,
    approveComment: false,
    rejectComment: false,

    // Message Management
    fetchAllMessages: false,
    fetchUnreadMessages: false,
    fetchReadMessages: false,
    fetchRespondedMessages: false,
    fetchMessageDetails: false,
    fetchMessageStatistics: false,
    replyToMessage: false,
    updateMessageStatus: false,

    // FAQ Management
    fetchFaqStatistics: false,
    createFaq: false,
    updateFaq: false,
    deleteFaq: false,

    // Tag Management
    createTag: false,
    deleteTag: false,
    fetchUserMessages: undefined
  },
  
  // Error handling
  error: null,
}; 