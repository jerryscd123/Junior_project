<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateFaqRequest;
use App\Http\Requests\UpdateFaqRequest;
use App\Models\Faq;
use App\Utils\ResponseHelper;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class FaqController extends Controller
{
    /**
     * Display a listing of FAQs.
     * This is a public endpoint accessible to all users.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Get query parameters
            $search = $request->get('search');
            $sort = $request->get('sort', 'latest'); // latest, oldest, question_asc, question_desc
            $limit = min((int) $request->get('limit', 20), 50); // Max 50 per page
            $page = max((int) $request->get('page', 1), 1);

            // Build query
            $query = Faq::query();

            // Apply search filter
            if ($search) {
                $query->search($search);
            }

            // Apply sorting
            switch ($sort) {
                case 'oldest':
                    $query->oldest();
                    break;
                case 'question_asc':
                    $query->orderByQuestion('asc');
                    break;
                case 'question_desc':
                    $query->orderByQuestion('desc');
                    break;
                case 'latest':
                default:
                    $query->latest();
                    break;
            }

            // Get paginated results
            $faqs = $query->paginate($limit, ['*'], 'page', $page);

            // Transform data
            $transformedFaqs = $faqs->getCollection()->map(function ($faq) {
                return [
                    'id' => $faq->id,
                    'question' => $faq->question,
                    'answer' => $faq->answer,
                    'created_at' => $faq->created_at->toISOString(),
                    'updated_at' => $faq->updated_at->toISOString(),
                    'formatted_question' => $faq->getFormattedQuestion(),
                    'formatted_answer' => $faq->getFormattedAnswer(),
                ];
            });

            // Get statistics for additional context
            $stats = Faq::getStatistics();

            return ResponseHelper::success([
                'current_page' => $faqs->currentPage(),
                'data' => $transformedFaqs,
                'first_page_url' => $faqs->url(1),
                'from' => $faqs->firstItem(),
                'last_page' => $faqs->lastPage(),
                'last_page_url' => $faqs->url($faqs->lastPage()),
                'links' => [
                    'first' => $faqs->url(1),
                    'last' => $faqs->url($faqs->lastPage()),
                    'prev' => $faqs->previousPageUrl(),
                    'next' => $faqs->nextPageUrl(),
                ],
                'next_page_url' => $faqs->nextPageUrl(),
                'path' => $faqs->path(),
                'per_page' => $faqs->perPage(),
                'prev_page_url' => $faqs->previousPageUrl(),
                'to' => $faqs->lastItem(),
                'total' => $faqs->total(),
            ], 'FAQs retrieved successfully', 200, [
                'stats' => $stats,
                'filters' => [
                    'search' => $search,
                    'sort' => $sort,
                    'limit' => $limit,
                    'page' => $page,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Error retrieving FAQs', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
            ]);

            return ResponseHelper::error(
                'Failed to retrieve FAQs',
                500,
                ['error' => 'An unexpected error occurred while retrieving FAQs']
            );
        }
    }

    /**
     * Store a newly created FAQ in storage.
     * Admin only endpoint.
     *
     * @param CreateFaqRequest $request
     * @return JsonResponse
     */
    public function store(CreateFaqRequest $request): JsonResponse
    {
        try {
            // Authorization is handled by CreateFaqRequest
            $user = Auth::user();

            DB::beginTransaction();

            // Check if similar question already exists
            if (Faq::questionExists($request->question)) {
                return ResponseHelper::error(
                    'A similar question already exists',
                    422,
                    ['question' => ['A similar question already exists in the FAQ']]
                );
            }

            // Create the FAQ
            $faq = Faq::createFaq($request->question, $request->answer);

            DB::commit();

            // Transform the created FAQ
            $transformedFaq = [
                'id' => $faq->id,
                'question' => $faq->question,
                'answer' => $faq->answer,
                'created_at' => $faq->created_at->toISOString(),
                'updated_at' => $faq->updated_at->toISOString(),
                'formatted_question' => $faq->getFormattedQuestion(),
                'formatted_answer' => $faq->getFormattedAnswer(),
                'created_by' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'role' => $user->role,
                ],
            ];

            Log::info('FAQ created successfully', [
                'faq_id' => $faq->id,
                'admin_id' => $user->id,
                'question_length' => strlen($request->question),
                'answer_length' => strlen($request->answer),
            ]);

            return ResponseHelper::success(
                $transformedFaq,
                'FAQ created successfully',
                200,
                ['total_faqs' => Faq::getCount()]
            );

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Error creating FAQ', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->validated(),
                'admin_id' => Auth::id(),
            ]);

            return ResponseHelper::error(
                'Failed to create FAQ',
                500,
                ['error' => 'An unexpected error occurred while creating the FAQ']
            );
        }
    }

    /**
     * Display the specified FAQ.
     * This is a public endpoint accessible to all users.
     *
     * @param string $id
     * @return JsonResponse
     */
    public function show(string $id): JsonResponse
    {
        try {
            $faq = Faq::findFaq($id);

            if (!$faq) {
                return ResponseHelper::error(
                    'FAQ not found',
                    404,
                    ['id' => ['The specified FAQ does not exist']]
                );
            }

            // Get similar FAQs for better user experience
            $similarFaqs = Faq::getSimilar($faq->question, 3, $faq->id);

            $transformedFaq = [
                'id' => $faq->id,
                'question' => $faq->question,
                'answer' => $faq->answer,
                'created_at' => $faq->created_at->toISOString(),
                'updated_at' => $faq->updated_at->toISOString(),
                'formatted_question' => $faq->getFormattedQuestion(),
                'formatted_answer' => $faq->getFormattedAnswer(),
            ];

            $transformedSimilar = $similarFaqs->map(function ($similarFaq) {
                return [
                    'id' => $similarFaq->id,
                    'question' => $similarFaq->getFormattedQuestion(),
                    'created_at' => $similarFaq->created_at->toISOString(),
                ];
            });

            return ResponseHelper::success(
                $transformedFaq,
                'FAQ retrieved successfully',
                200,
                ['similar_faqs' => $transformedSimilar]
            );

        } catch (\Exception $e) {
            Log::error('Error retrieving FAQ', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'faq_id' => $id,
            ]);

            return ResponseHelper::error(
                'Failed to retrieve FAQ',
                500,
                ['error' => 'An unexpected error occurred while retrieving the FAQ']
            );
        }
    }

    /**
     * Update the specified FAQ in storage.
     * Admin only endpoint.
     *
     * @param UpdateFaqRequest $request
     * @param string $id
     * @return JsonResponse
     */
    public function update(UpdateFaqRequest $request, string $id): JsonResponse
    {
        try {
            // Authorization is handled by UpdateFaqRequest
            $user = Auth::user();

            $faq = Faq::findFaq($id);

            if (!$faq) {
                return ResponseHelper::error(
                    'FAQ not found',
                    404,
                    ['id' => ['The specified FAQ does not exist']]
                );
            }

            DB::beginTransaction();

            // Check if updated question conflicts with existing FAQs
            if ($request->has('question') && 
                Faq::questionExists($request->question, $faq->id)) {
                return ResponseHelper::error(
                    'A similar question already exists',
                    422,
                    ['question' => ['A similar question already exists in the FAQ']]
                );
            }

            // Store original data for logging
            $originalData = [
                'question' => $faq->question,
                'answer' => $faq->answer,
            ];

            // Update the FAQ
            $updateData = [];
            if ($request->has('question')) {
                $updateData['question'] = $request->question;
            }
            if ($request->has('answer')) {
                $updateData['answer'] = $request->answer;
            }

            if (!empty($updateData)) {
                $faq->update($updateData);
                $faq->refresh();
            }

            DB::commit();

            // Transform the updated FAQ
            $transformedFaq = [
                'id' => $faq->id,
                'question' => $faq->question,
                'answer' => $faq->answer,
                'created_at' => $faq->created_at->toISOString(),
                'updated_at' => $faq->updated_at->toISOString(),
                'formatted_question' => $faq->getFormattedQuestion(),
                'formatted_answer' => $faq->getFormattedAnswer(),
                'updated_by' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'role' => $user->role,
                ],
            ];

            Log::info('FAQ updated successfully', [
                'faq_id' => $faq->id,
                'admin_id' => $user->id,
                'original_data' => $originalData,
                'updated_data' => $updateData,
            ]);

            return ResponseHelper::success(
                $transformedFaq,
                'FAQ updated successfully'
            );

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Error updating FAQ', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'faq_id' => $id,
                'request_data' => $request->validated(),
                'admin_id' => Auth::id(),
            ]);

            return ResponseHelper::error(
                'Failed to update FAQ',
                500,
                ['error' => 'An unexpected error occurred while updating the FAQ']
            );
        }
    }

    /**
     * Remove the specified FAQ from storage.
     * Admin only endpoint.
     *
     * @param string $id
     * @return JsonResponse
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            // Check admin authorization
            $user = Auth::user();
            if (!$user || $user->role !== 'admin') {
                return ResponseHelper::error(
                    'Unauthorized',
                    403,
                    ['error' => 'Only administrators can delete FAQs']
                );
            }

            $faq = Faq::findFaq($id);

            if (!$faq) {
                return ResponseHelper::error(
                    'FAQ not found',
                    404,
                    ['id' => ['The specified FAQ does not exist']]
                );
            }

            DB::beginTransaction();

            // Store FAQ data for logging before deletion
            $faqData = [
                'id' => $faq->id,
                'question' => $faq->question,
                'answer' => $faq->answer,
                'created_at' => $faq->created_at,
            ];

            // Delete the FAQ
            $deleted = $faq->delete();

            if (!$deleted) {
                DB::rollBack();
                return ResponseHelper::error(
                    'Failed to delete FAQ',
                    500,
                    ['error' => 'The FAQ could not be deleted']
                );
            }

            DB::commit();

            Log::info('FAQ deleted successfully', [
                'deleted_faq' => $faqData,
                'admin_id' => $user->id,
                'admin_name' => $user->name,
            ]);

            return ResponseHelper::success(
                [
                    'deleted_faq' => [
                        'id' => $faqData['id'],
                        'question' => $faqData['question'],
                        'deleted_at' => now()->toISOString(),
                    ],
                    'deleted_by' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'role' => $user->role,
                    ],
                ],
                'FAQ deleted successfully',
                200,
                ['total_faqs' => Faq::getCount()]
            );

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Error deleting FAQ', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'faq_id' => $id,
                'admin_id' => Auth::id(),
            ]);

            return ResponseHelper::error(
                'Failed to delete FAQ',
                500,
                ['error' => 'An unexpected error occurred while deleting the FAQ']
            );
        }
    }

    /**
     * Get FAQ statistics for admin dashboard.
     * Admin only endpoint.
     *
     * @return JsonResponse
     */
    public function stats(): JsonResponse
    {
        try {
            // Check admin authorization
            $user = Auth::user();
            if (!$user || $user->role !== 'admin') {
                return ResponseHelper::error(
                    'Unauthorized',
                    403,
                    ['error' => 'Only administrators can view FAQ statistics']
                );
            }

            $stats = Faq::getStatistics();
            $recentFaqs = Faq::getRecent(5);

            $transformedRecent = $recentFaqs->map(function ($faq) {
                return [
                    'id' => $faq->id,
                    'question' => $faq->getFormattedQuestion(),
                    'created_at' => $faq->created_at->toISOString(),
                ];
            });

            return ResponseHelper::success([
                'statistics' => $stats,
                'recent_faqs' => $transformedRecent,
                'generated_at' => now()->toISOString(),
            ], 'FAQ statistics retrieved successfully');

        } catch (\Exception $e) {
            Log::error('Error retrieving FAQ statistics', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'admin_id' => Auth::id(),
            ]);

            return ResponseHelper::error(
                'Failed to retrieve FAQ statistics',
                500,
                ['error' => 'An unexpected error occurred while retrieving statistics']
            );
        }
    }

    /**
     * Search FAQs by keyword.
     * Public endpoint.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function search(Request $request): JsonResponse
    {
        try {
            $keyword = $request->get('q', '');
            $limit = min((int) $request->get('limit', 10), 20);

            if (strlen(trim($keyword)) < 3) {
                return ResponseHelper::error(
                    'Search keyword too short',
                    422,
                    ['q' => ['Search keyword must be at least 3 characters long']]
                );
            }

            $faqs = Faq::searchByKeyword($keyword);
            $limitedFaqs = $faqs->take($limit);

            $transformedFaqs = $limitedFaqs->map(function ($faq) {
                return [
                    'id' => $faq->id,
                    'question' => $faq->question,
                    'answer' => $faq->answer,
                    'formatted_question' => $faq->getFormattedQuestion(),
                    'formatted_answer' => $faq->getFormattedAnswer(150),
                    'created_at' => $faq->created_at->toISOString(),
                ];
            });

            return ResponseHelper::success(
                $transformedFaqs,
                'Search results retrieved successfully',
                200,
                [
                    'keyword' => $keyword,
                    'total_found' => $faqs->count(),
                    'showing' => $limitedFaqs->count(),
                    'limit' => $limit,
                ]
            );

        } catch (\Exception $e) {
            Log::error('Error searching FAQs', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'keyword' => $request->get('q'),
            ]);

            return ResponseHelper::error(
                'Failed to search FAQs',
                500,
                ['error' => 'An unexpected error occurred while searching FAQs']
            );
        }
    }
}
