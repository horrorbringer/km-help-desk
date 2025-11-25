<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\CannedResponseRequest;
use App\Models\CannedResponse;
use App\Models\TicketCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class CannedResponseController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['q', 'category', 'is_active']);

        $responses = CannedResponse::query()
            ->with(['category:id,name', 'author:id,name'])
            ->when($filters['q'] ?? null, function ($query, $q) {
                $query->where(function ($qry) use ($q) {
                    $qry->where('title', 'like', "%{$q}%")
                        ->orWhere('content', 'like', "%{$q}%");
                });
            })
            ->when(isset($filters['category']), function ($query) use ($filters) {
                $query->where('category_id', $filters['category']);
            })
            ->when(isset($filters['is_active']), function ($query) use ($filters) {
                $query->where('is_active', $filters['is_active'] === '1');
            })
            ->orderBy('usage_count', 'desc')
            ->orderBy('title')
            ->paginate(20)
            ->withQueryString()
            ->through(fn ($response) => [
                'id' => $response->id,
                'title' => $response->title,
                'content' => $response->content,
                'category' => $response->category ? [
                    'id' => $response->category->id,
                    'name' => $response->category->name,
                ] : null,
                'author' => $response->author ? [
                    'id' => $response->author->id,
                    'name' => $response->author->name,
                ] : null,
                'is_active' => $response->is_active,
                'usage_count' => $response->usage_count,
                'created_at' => $response->created_at->toDateTimeString(),
            ]);

        $categories = TicketCategory::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Admin/CannedResponses/Index', [
            'responses' => $responses,
            'filters' => $filters,
            'categories' => $categories,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/CannedResponses/Form', [
            'response' => null,
            'categories' => TicketCategory::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function store(CannedResponseRequest $request): RedirectResponse
    {
        CannedResponse::create([
            ...$request->validated(),
            'created_by' => Auth::id(),
        ]);

        return redirect()
            ->route('admin.canned-responses.index')
            ->with('success', 'Canned response created successfully.');
    }

    public function edit(CannedResponse $cannedResponse): Response
    {
        $cannedResponse->load(['category:id,name', 'author:id,name']);

        return Inertia::render('Admin/CannedResponses/Form', [
            'response' => [
                'id' => $cannedResponse->id,
                'title' => $cannedResponse->title,
                'content' => $cannedResponse->content,
                'category_id' => $cannedResponse->category_id ? $cannedResponse->category_id : '__none',
                'is_active' => $cannedResponse->is_active,
            ],
            'categories' => TicketCategory::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function update(CannedResponseRequest $request, CannedResponse $cannedResponse): RedirectResponse
    {
        $data = $request->validated();
        
        if (isset($data['category_id']) && $data['category_id'] === '__none') {
            $data['category_id'] = null;
        }

        $cannedResponse->update($data);

        return redirect()
            ->route('admin.canned-responses.index')
            ->with('success', 'Canned response updated successfully.');
    }

    public function destroy(CannedResponse $cannedResponse): RedirectResponse
    {
        $cannedResponse->delete();

        return redirect()
            ->route('admin.canned-responses.index')
            ->with('success', 'Canned response deleted successfully.');
    }
}

