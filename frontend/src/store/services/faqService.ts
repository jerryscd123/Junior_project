import api from './api';
import {
  GetFaqsParams,
  GetFaqsResponse,
  CreateFaqPayload,
  CreateFaqResponse,
  UpdateFaqPayload,
  UpdateFaqResponse,
  DeleteFaqResponse,
} from '../types/faq';

/**
 * FAQ Service
 * Handles all FAQ-related API calls
 */

/**
 * Get FAQs with optional search filtering and pagination
 * @param params - Query parameters for filtering and paginating FAQs
 * @returns Promise with FAQs data
 */
export const getFaqs = async (
  params: GetFaqsParams = {}
): Promise<GetFaqsResponse> => {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    
    if (params.search) queryParams.append('search', params.search);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());

    const queryString = queryParams.toString();
    const url = `/faqs${queryString ? `?${queryString}` : ''}`;

    const response = await api.get<GetFaqsResponse>(url);
    return response.data;
  } catch (error: unknown) {
    console.error('Get FAQs error:', error);
    throw {
      success: false,
      message: (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to fetch FAQs',
      errors: (error as { response?: { data?: { errors?: unknown } } })?.response?.data?.errors,
    };
  }
};

/**
 * Create a new FAQ (admin only)
 * @param payload - FAQ question and answer
 * @returns Promise with created FAQ data
 */
export const createFaq = async (
  payload: CreateFaqPayload
): Promise<CreateFaqResponse> => {
  try {
    const response = await api.post<CreateFaqResponse>('/faqs', payload);
    return response.data;
  } catch (error: unknown) {
    console.error('Create FAQ error:', error);
    throw {
      success: false,
      message: (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create FAQ',
      errors: (error as { response?: { data?: { errors?: unknown } } })?.response?.data?.errors,
    };
  }
};

/**
 * Update an existing FAQ (admin only)
 * @param payload - FAQ ID and updated data
 * @returns Promise with updated FAQ data
 */
export const updateFaq = async (
  payload: UpdateFaqPayload
): Promise<UpdateFaqResponse> => {
  try {
    const { faqId, ...updateData } = payload;
    const response = await api.put<UpdateFaqResponse>(`/faqs/${faqId}`, updateData);
    return response.data;
  } catch (error: unknown) {
    console.error('Update FAQ error:', error);
    throw {
      success: false,
      message: (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update FAQ',
      errors: (error as { response?: { data?: { errors?: unknown } } })?.response?.data?.errors,
    };
  }
};

/**
 * Delete an FAQ (admin only)
 * @param faqId - ID of the FAQ to delete
 * @returns Promise with deletion confirmation
 */
export const deleteFaq = async (
  faqId: number
): Promise<DeleteFaqResponse> => {
  try {
    const response = await api.delete<DeleteFaqResponse>(`/faqs/${faqId}`);
    return response.data;
  } catch (error: unknown) {
    console.error('Delete FAQ error:', error);
    throw {
      success: false,
      message: (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete FAQ',
      errors: (error as { response?: { data?: { errors?: unknown } } })?.response?.data?.errors,
    };
  }
}; 