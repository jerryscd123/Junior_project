import { useAppSelector } from './index'
import { FaqState } from '../types/faq'

/**
 * Custom hook for FAQ state management
 * Provides easy access to FAQ state and computed values
 */
export const useFaqs = () => {
  const faqState = useAppSelector((state) => state.faqs) as FaqState | undefined

  // Provide default values if state is undefined
  const safeState: FaqState = faqState || {
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
  }

  return {
    // FAQ data
    faqs: safeState.faqs || [],
    adminFaqs: safeState.adminFaqs || [],
    
    // Pagination
    pagination: safeState.pagination,
    
    // Filters
    filters: safeState.filters,
    
    // Loading states
    loading: safeState.loading,
    isLoading: safeState.loading?.fetchFaqs || false,
    isCreating: safeState.loading?.createFaq || false,
    isUpdating: safeState.loading?.updateFaq || false,
    isDeleting: safeState.loading?.deleteFaq || false,
    
    // Error state
    error: safeState.error,
    
    // Computed values
    hasFaqs: (safeState.faqs || []).length > 0,
    hasAdminFaqs: (safeState.adminFaqs || []).length > 0,
    isAnyLoading: safeState.loading ? Object.values(safeState.loading).some(loading => loading) : false,
    
    // Quick access to specific FAQ by ID
    getFaqById: (id: number) => (safeState.faqs || []).find(faq => faq.id === id),
    getAdminFaqById: (id: number) => (safeState.adminFaqs || []).find(faq => faq.id === id),
  }
} 