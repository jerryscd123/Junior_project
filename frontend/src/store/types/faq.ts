// FAQ Model
export interface FAQ {
  id: number;
  question: string;
  answer: string;
  created_at: string;
  updated_at: string;
  formatted_question?: string;
  formatted_answer?: string;
  created_by?: {
    id: number;
    name: string;
    role: string;
  };
}

// Pagination Interface
export interface FaqPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
  first_page_url: string;
  last_page_url: string;
  next_page_url: string | null;
  prev_page_url: string | null;
  path: string;
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

// Redux State Interface
export interface FaqState {
  // FAQ lists
  faqs: FAQ[];
  adminFaqs: FAQ[]; // For admin dashboard with full CRUD
  
  // Pagination
  pagination: FaqPagination | null;
  
  // Filters
  filters: {
    search?: string;
    page: number;
    per_page: number;
  };
  
  // Loading states
  loading: {
    fetchFaqs: boolean;
    createFaq: boolean;
    updateFaq: boolean;
    deleteFaq: boolean;
  };
  
  // Error handling
  error: string | null;
}

// API Request/Response Types
export interface GetFaqsParams {
  search?: string;
  page?: number;
  per_page?: number;
}

export interface GetFaqsResponse {
  success: boolean;
  message: string;
  data: {
    current_page: number;
    data: FAQ[]; // FAQs are nested in data.data
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: {
      first: string;
      last: string;
      prev: string | null;
      next: string | null;
    };
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
  };
  meta: {
    stats: {
      total_faqs: number;
      recent_faqs: number;
      latest_faq: FAQ;
    };
    filters: {
      search: string | null;
      sort: string;
      limit: number;
      page: number;
    };
  };
}

export interface CreateFaqPayload {
  question: string;
  answer: string;
}

export interface CreateFaqResponse {
  success: boolean;
  message: string;
  data: FAQ; // FAQ object is directly in data, not data.faq
  meta: {
    total_faqs: number;
  };
}

export interface UpdateFaqPayload {
  faqId: number;
  question?: string;
  answer?: string;
}

export interface UpdateFaqResponse {
  success: boolean;
  message: string;
  data: FAQ; // FAQ object is directly in data, not data.faq
  meta?: {
    total_faqs: number;
  };
}

export interface DeleteFaqResponse {
  success: boolean;
  message: string;
}

// Action Payload Types
export interface SetFaqFiltersPayload {
  search?: string;
  page?: number;
  per_page?: number;
}

// UI Types
export interface FaqItemProps {
  faq: FAQ;
  isAdmin?: boolean;
  onEdit?: (faq: FAQ) => void;
  onDelete?: (faqId: number) => void;
}

export interface FaqListProps {
  faqs: FAQ[];
  loading?: boolean;
  isAdmin?: boolean;
  onEdit?: (faq: FAQ) => void;
  onDelete?: (faqId: number) => void;
}

export interface FaqFormProps {
  faq?: FAQ;
  onSubmit: (payload: CreateFaqPayload | UpdateFaqPayload) => void;
  loading?: boolean;
  isEdit?: boolean;
}

// Initial state
export const initialFaqState: FaqState = {
  faqs: [],
  adminFaqs: [],
  pagination: null,
  filters: {
    page: 1,
    per_page: 15,
  },
  loading: {
    fetchFaqs: false,
    createFaq: false,
    updateFaq: false,
    deleteFaq: false,
  },
  error: null,
}; 