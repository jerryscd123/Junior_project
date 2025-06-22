import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  FaqState,
  initialFaqState,
  GetFaqsParams,
  CreateFaqPayload,
  UpdateFaqPayload,
  SetFaqFiltersPayload,
} from '../types/faq';
import {
  getFaqs as apiGetFaqs,
  createFaq as apiCreateFaq,
  updateFaq as apiUpdateFaq,
  deleteFaq as apiDeleteFaq,
} from '../services/faqService';

/**
 * Async Thunks
 */

// Fetch FAQs
export const fetchFaqs = createAsyncThunk(
  'faqs/fetchFaqs',
  async (params: GetFaqsParams = {}, { rejectWithValue }) => {
    try {
      const response = await apiGetFaqs(params);
      return response;
    } catch (error: unknown) {
      return rejectWithValue((error as { message?: string })?.message || 'Failed to fetch FAQs');
    }
  }
);

// Create FAQ (admin only)
export const createFaq = createAsyncThunk(
  'faqs/createFaq',
  async (payload: CreateFaqPayload, { rejectWithValue }) => {
    try {
      const response = await apiCreateFaq(payload);
      return response;
    } catch (error: unknown) {
      return rejectWithValue((error as { message?: string })?.message || 'Failed to create FAQ');
    }
  }
);

// Update FAQ (admin only)
export const updateFaq = createAsyncThunk(
  'faqs/updateFaq',
  async (payload: UpdateFaqPayload, { rejectWithValue }) => {
    try {
      const response = await apiUpdateFaq(payload);
      return response;
    } catch (error: unknown) {
      return rejectWithValue((error as { message?: string })?.message || 'Failed to update FAQ');
    }
  }
);

// Delete FAQ (admin only)
export const deleteFaq = createAsyncThunk(
  'faqs/deleteFaq',
  async (faqId: number, { rejectWithValue }) => {
    try {
      const response = await apiDeleteFaq(faqId);
      return { ...response, faqId };
    } catch (error: unknown) {
      return rejectWithValue((error as { message?: string })?.message || 'Failed to delete FAQ');
    }
  }
);

/**
 * FAQ Slice
 */
const faqSlice = createSlice({
  name: 'faqs',
  initialState: initialFaqState,
  reducers: {
    // Set FAQ filters
    setFilters: (state, action: PayloadAction<SetFaqFiltersPayload>) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    // Clear FAQs list
    clearFaqs: (state) => {
      state.faqs = [];
      state.adminFaqs = [];
      state.pagination = null;
      state.error = null;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Reset FAQ state
    resetState: () => initialFaqState,
  },
  extraReducers: (builder) => {
    // Fetch FAQs
    builder
      .addCase(fetchFaqs.pending, (state) => {
        state.loading.fetchFaqs = true;
        state.error = null;
      })
      .addCase(fetchFaqs.fulfilled, (state, action) => {
        state.loading.fetchFaqs = false;
        // FAQs are now nested in data.data
        state.faqs = action.payload.data.data;
        state.adminFaqs = action.payload.data.data; // Same data for admin view
        
        // Set pagination information
        state.pagination = {
          current_page: action.payload.data.current_page,
          last_page: action.payload.data.last_page,
          per_page: action.payload.data.per_page,
          total: action.payload.data.total,
          from: action.payload.data.from,
          to: action.payload.data.to,
          first_page_url: action.payload.data.first_page_url,
          last_page_url: action.payload.data.last_page_url,
          next_page_url: action.payload.data.next_page_url,
          prev_page_url: action.payload.data.prev_page_url,
          path: action.payload.data.path,
          links: action.payload.data.links,
        };
      })
      .addCase(fetchFaqs.rejected, (state, action) => {
        state.loading.fetchFaqs = false;
        state.error = action.payload as string;
      });

    // Create FAQ
    builder
      .addCase(createFaq.pending, (state) => {
        state.loading.createFaq = true;
        state.error = null;
      })
      .addCase(createFaq.fulfilled, (state, action) => {
        state.loading.createFaq = false;
        // FAQ object is now directly in data, not data.faq
        const newFaq = action.payload.data;
        state.faqs = [newFaq, ...state.faqs];
        state.adminFaqs = [newFaq, ...state.adminFaqs];
      })
      .addCase(createFaq.rejected, (state, action) => {
        state.loading.createFaq = false;
        state.error = action.payload as string;
      });

    // Update FAQ
    builder
      .addCase(updateFaq.pending, (state) => {
        state.loading.updateFaq = true;
        state.error = null;
      })
      .addCase(updateFaq.fulfilled, (state, action) => {
        state.loading.updateFaq = false;
        // FAQ object is now directly in data, not data.faq
        const updatedFaq = action.payload.data;
        
        // Update FAQ in both lists
        const faqIndex = state.faqs.findIndex(faq => faq.id === updatedFaq.id);
        if (faqIndex !== -1) {
          state.faqs[faqIndex] = updatedFaq;
        }
        
        const adminFaqIndex = state.adminFaqs.findIndex(faq => faq.id === updatedFaq.id);
        if (adminFaqIndex !== -1) {
          state.adminFaqs[adminFaqIndex] = updatedFaq;
        }
      })
      .addCase(updateFaq.rejected, (state, action) => {
        state.loading.updateFaq = false;
        state.error = action.payload as string;
      });

    // Delete FAQ
    builder
      .addCase(deleteFaq.pending, (state) => {
        state.loading.deleteFaq = true;
        state.error = null;
      })
      .addCase(deleteFaq.fulfilled, (state, action) => {
        state.loading.deleteFaq = false;
        const { faqId } = action.payload;
        
        // Remove FAQ from both lists
        state.faqs = state.faqs.filter(faq => faq.id !== faqId);
        state.adminFaqs = state.adminFaqs.filter(faq => faq.id !== faqId);
      })
      .addCase(deleteFaq.rejected, (state, action) => {
        state.loading.deleteFaq = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const {
  setFilters,
  clearFaqs,
  clearError,
  resetState,
} = faqSlice.actions;

// Export reducer
export default faqSlice.reducer;

/**
 * Selectors
 */
export const selectFaqs = (state: { faqs: FaqState }) => state.faqs.faqs || [];
export const selectAdminFaqs = (state: { faqs: FaqState }) => state.faqs.adminFaqs || [];
export const selectFaqPagination = (state: { faqs: FaqState }) => state.faqs.pagination;
export const selectFaqFilters = (state: { faqs: FaqState }) => state.faqs.filters;
export const selectFaqLoading = (state: { faqs: FaqState }) => state.faqs.loading;
export const selectFaqError = (state: { faqs: FaqState }) => state.faqs.error;

export const selectFaqById = (faqId: number) => (state: { faqs: FaqState }) =>
  state.faqs.faqs?.find(faq => faq.id === faqId); 