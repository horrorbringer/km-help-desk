<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\KnowledgeBaseArticleRequest;
use App\Models\KnowledgeBaseArticle;
use App\Models\TicketCategory;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class KnowledgeBaseArticleController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['q', 'category', 'status', 'is_featured']);

        $articles = KnowledgeBaseArticle::query()
            ->with(['category:id,name', 'author:id,name'])
            ->when($filters['q'] ?? null, function ($query, $q) {
                $query->where(function ($qry) use ($q) {
                    $qry->where('title', 'like', "%{$q}%")
                        ->orWhere('content', 'like', "%{$q}%")
                        ->orWhere('excerpt', 'like', "%{$q}%");
                });
            })
            ->when(isset($filters['category']), function ($query) use ($filters) {
                $query->where('category_id', $filters['category']);
            })
            ->when(isset($filters['status']), function ($query) use ($filters) {
                $query->where('status', $filters['status']);
            })
            ->when(isset($filters['is_featured']), function ($query) use ($filters) {
                $query->where('is_featured', $filters['is_featured'] === '1');
            })
            ->orderBy('sort_order')
            ->orderBy('created_at', 'desc')
            ->paginate(20)
            ->withQueryString()
            ->through(fn ($article) => [
                'id' => $article->id,
                'title' => $article->title,
                'slug' => $article->slug,
                'excerpt' => $article->excerpt,
                'category' => $article->category ? [
                    'id' => $article->category->id,
                    'name' => $article->category->name,
                ] : null,
                'author' => $article->author ? [
                    'id' => $article->author->id,
                    'name' => $article->author->name,
                ] : null,
                'status' => $article->status,
                'is_featured' => $article->is_featured,
                'views_count' => $article->views_count,
                'helpful_count' => $article->helpful_count,
                'not_helpful_count' => $article->not_helpful_count,
                'published_at' => $article->published_at?->toDateTimeString(),
                'created_at' => $article->created_at?->toDateTimeString(),
            ]);

        $categories = TicketCategory::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Admin/KnowledgeBase/Index', [
            'articles' => $articles,
            'filters' => $filters,
            'categories' => $categories,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/KnowledgeBase/Form', [
            'article' => null,
            'categories' => TicketCategory::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function store(KnowledgeBaseArticleRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['author_id'] = Auth::id();
        
        // Set published_at if status is published and published_at is not set
        if ($data['status'] === 'published' && empty($data['published_at'])) {
            $data['published_at'] = now();
        }

        KnowledgeBaseArticle::create($data);

        return redirect()
            ->route('admin.knowledge-base.index')
            ->with('success', 'Article created successfully.');
    }

    public function show(KnowledgeBaseArticle $article): Response
    {
        $article->load(['category:id,name', 'author:id,name,email']);

        return Inertia::render('Admin/KnowledgeBase/Show', [
            'article' => [
                'id' => $article->id,
                'title' => $article->title,
                'slug' => $article->slug,
                'content' => $article->content,
                'excerpt' => $article->excerpt,
                'category' => $article->category ? [
                    'id' => $article->category->id,
                    'name' => $article->category->name,
                ] : null,
                'author' => $article->author ? [
                    'id' => $article->author->id,
                    'name' => $article->author->name,
                    'email' => $article->author->email,
                ] : null,
                'status' => $article->status,
                'is_featured' => $article->is_featured,
                'views_count' => $article->views_count,
                'helpful_count' => $article->helpful_count,
                'not_helpful_count' => $article->not_helpful_count,
                'sort_order' => $article->sort_order,
                'published_at' => $article->published_at?->toDateTimeString(),
                'created_at' => $article->created_at?->toDateTimeString(),
                'updated_at' => $article->updated_at?->toDateTimeString(),
            ],
        ]);
    }

    public function edit(KnowledgeBaseArticle $article): Response
    {
        return Inertia::render('Admin/KnowledgeBase/Form', [
            'article' => [
                'id' => $article->id,
                'title' => $article->title,
                'slug' => $article->slug,
                'content' => $article->content,
                'excerpt' => $article->excerpt,
                'category_id' => $article->category_id ? $article->category_id : '__none',
                'status' => $article->status,
                'is_featured' => $article->is_featured,
                'sort_order' => $article->sort_order,
                'published_at' => $article->published_at?->toDateString(),
            ],
            'categories' => TicketCategory::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function update(KnowledgeBaseArticleRequest $request, KnowledgeBaseArticle $article): RedirectResponse
    {
        $data = $request->validated();
        
        // Handle category_id conversion
        if (isset($data['category_id']) && $data['category_id'] === '__none') {
            $data['category_id'] = null;
        } elseif (isset($data['category_id'])) {
            $data['category_id'] = (int) $data['category_id'];
        }

        // Set published_at if status is published and published_at is not set
        if ($data['status'] === 'published' && empty($data['published_at'])) {
            $data['published_at'] = $article->published_at ?? now();
        }

        $article->update($data);

        return redirect()
            ->route('admin.knowledge-base.index')
            ->with('success', 'Article updated successfully.');
    }

    public function destroy(KnowledgeBaseArticle $article): RedirectResponse
    {
        $article->delete();

        return redirect()
            ->route('admin.knowledge-base.index')
            ->with('success', 'Article deleted successfully.');
    }
}

