<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SavedSearch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class SavedSearchController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $type = $request->get('type', 'tickets');

        $searches = SavedSearch::forUser(Auth::id())
            ->forType($type)
            ->orderBy('usage_count', 'desc')
            ->orderBy('name')
            ->get()
            ->map(fn ($search) => [
                'id' => $search->id,
                'name' => $search->name,
                'filters' => $search->filters,
                'usage_count' => $search->usage_count,
                'is_shared' => $search->is_shared,
            ]);

        return response()->json(['searches' => $searches]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', Rule::in(['tickets', 'users'])],
            'filters' => ['required', 'array'],
            'is_shared' => ['boolean'],
        ]);

        $search = SavedSearch::create([
            'user_id' => Auth::id(),
            'name' => $validated['name'],
            'type' => $validated['type'],
            'filters' => $validated['filters'],
            'is_shared' => $validated['is_shared'] ?? false,
        ]);

        return response()->json([
            'success' => true,
            'search' => [
                'id' => $search->id,
                'name' => $search->name,
                'filters' => $search->filters,
            ],
        ]);
    }

    public function destroy(Request $request, SavedSearch $savedSearch): RedirectResponse|JsonResponse
    {
        // Only allow users to delete their own searches (unless admin)
        if ($savedSearch->user_id !== Auth::id() && !Auth::user()->hasRole('Super Admin')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $savedSearch->delete();

        if ($request->wantsJson()) {
            return response()->json(['success' => true]);
        }

        return redirect()->back()->with('success', 'Saved search deleted.');
    }

    public function apply(SavedSearch $savedSearch): JsonResponse
    {
        // Only allow users to use their own searches or shared ones
        if ($savedSearch->user_id !== Auth::id() && !$savedSearch->is_shared) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $savedSearch->incrementUsage();

        return response()->json([
            'success' => true,
            'filters' => $savedSearch->filters,
        ]);
    }
}

