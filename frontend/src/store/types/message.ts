// Message Model
export interface Message {
  id: number;
  subject: string;
  content: string;
  status: 'unread' | 'read' | 'responded';
  status_display: string;
  status_color: string;
  admin_name: string | null;
  is_unread: boolean;
  is_read: boolean;
  is_responded: boolean;
  created_at: string;
  updated_at: string;
  sender?: {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
  };
  admin?: {
    id: number | null;
    name: string | null;
  };
  user?: {
    id: number;
    name: string;
    email: string;
  };
  admin_reply?: {
    content: string;
    replied_at: string;
    admin_name: string;
  };
}

// Redux State Interface
export interface MessageState {
  // Message lists
  userMessages: Message[];
  adminMessages: Message[]; // For admin dashboard
  
  // Pagination
  userPagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    has_more_pages: boolean;
  } | null;
  
  adminPagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    has_more_pages: boolean;
  } | null;
  
  // Filters
  userFilters: {
    status?: 'unread' | 'read' | 'responded';
    search?: string;
    page: number;
    per_page: number;
  };
  
  adminFilters: {
    status?: 'unread' | 'read' | 'responded';
    search?: string;
    page: number;
    per_page: number;
  };
  
  // Loading states
  loading: {
    fetchUserMessages: boolean;
    sendMessage: boolean;
    fetchAdminMessages: boolean;
    replyToMessage: boolean;
  };
  
  // Error handling
  error: string | null;
}

// API Request/Response Types
export interface GetUserMessagesParams {
  page?: number;
  per_page?: number;
  status?: 'unread' | 'read' | 'responded';
  search?: string;
}

export interface GetUserMessagesResponse {
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
    };
  };
}

export interface SendMessagePayload {
  subject: string;
  content: string;
}

export interface SendMessageResponse {
  success: boolean;
  message: string;
  data: {
    message: Message;
  };
}

export interface GetAdminMessagesParams {
  page?: number;
  per_page?: number;
  status?: 'unread' | 'read' | 'responded';
  search?: string;
}

export interface GetAdminMessagesResponse {
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
    };
  };
}

export interface ReplyToMessagePayload {
  messageId: number;
  content: string;
}

export interface ReplyToMessageResponse {
  success: boolean;
  message: string;
  data: {
    message: Message;
  };
}

// Action Payload Types
export interface SetUserMessageFiltersPayload {
  status?: 'unread' | 'read' | 'responded';
  search?: string;
  page?: number;
  per_page?: number;
}

export interface SetAdminMessageFiltersPayload {
  status?: 'unread' | 'read' | 'responded';
  search?: string;
  page?: number;
  per_page?: number;
}

// UI Types
export interface MessageCardProps {
  message: Message;
  isAdmin?: boolean;
  onReply?: (messageId: number, content: string) => void;
}

export interface MessageFiltersProps {
  filters: MessageState['userFilters'] | MessageState['adminFilters'];
  onFiltersChange: (filters: Partial<MessageState['userFilters']> | Partial<MessageState['adminFilters']>) => void;
  loading?: boolean;
}

export interface MessageListProps {
  messages: Message[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isAdmin?: boolean;
  onReply?: (messageId: number, content: string) => void;
}

export interface SendMessageFormProps {
  onSendMessage: (payload: SendMessagePayload) => void;
  loading?: boolean;
}

export interface ReplyFormProps {
  messageId: number;
  onReply: (messageId: number, content: string) => void;
  loading?: boolean;
}

// Initial state
export const initialMessageState: MessageState = {
  userMessages: [],
  adminMessages: [],
  userPagination: null,
  adminPagination: null,
  userFilters: {
    page: 1,
    per_page: 15,
  },
  adminFilters: {
    page: 1,
    per_page: 15,
  },
  loading: {
    fetchUserMessages: false,
    sendMessage: false,
    fetchAdminMessages: false,
    replyToMessage: false,
  },
  error: null,
}; 