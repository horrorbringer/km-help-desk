<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\TagRequest;
use App\Models\Tag;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TagController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['q']);

        $tags = Tag::query()
            ->withCount('tickets')
            ->when($filters['q'] ?? null, function ($query, $q) {
                $query->where(function ($qry) use ($q) {
                    $qry->where('name', 'like', "%{$q}%")
                        ->orWhere('slug', 'like', "%{$q}%");
                });
            })
            ->orderBy('tickets_count', 'desc')
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString()
            ->through(fn ($tag) => [
                'id' => $tag->id,
                'name' => $tag->name,
                'slug' => $tag->slug,
                'color' => $tag->color,
                'tickets_count' => $tag->tickets_count,
                'created_at' => $tag->created_at->toDateTimeString(),
            ]);

        return Inertia::render('Admin/Tags/Index', [
            'tags' => $tags,
            'filters' => $filters,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Tags/Form', [
            'tag' => null,
        ]);
    }

    public function store(TagRequest $request): RedirectResponse
    {
        Tag::create($request->validated());

        return redirect()
            ->route('admin.tags.index')
            ->with('success', 'Tag created successfully.');
    }

    public function edit(Tag $tag): Response
    {
        return Inertia::render('Admin/Tags/Form', [
            'tag' => [
                'id' => $tag->id,
                'name' => $tag->name,
                'slug' => $tag->slug,
                'color' => $tag->color,
            ],
        ]);
    }

    public function update(TagRequest $request, Tag $tag): RedirectResponse
    {
        $tag->update($request->validated());

        return redirect()
            ->route('admin.tags.index')
            ->with('success', 'Tag updated successfully.');
    }

    public function destroy(Tag $tag): RedirectResponse
    {
        // Check if tag has tickets
        if ($tag->tickets()->count() > 0) {
            return redirect()
                ->route('admin.tags.index')
                ->with('error', 'Cannot delete tag with assigned tickets. Please remove the tag from tickets first.');
        }

        $tag->delete();

        return redirect()
            ->route('admin.tags.index')
            ->with('success', 'Tag deleted successfully.');
    }
}

