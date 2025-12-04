<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\CategoryRequest;
use App\Models\Department;
use App\Models\TicketCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['q', 'parent_id', 'is_active']);

        $categories = TicketCategory::query()
            ->with(['parent:id,name', 'defaultTeam:id,name'])
            ->withCount(['children', 'tickets'])
            ->when($filters['q'] ?? null, function ($query, $q) {
                $query->where(function ($qry) use ($q) {
                    $qry->where('name', 'like', "%{$q}%")
                        ->orWhere('slug', 'like', "%{$q}%")
                        ->orWhere('description', 'like', "%{$q}%");
                });
            })
            ->when(isset($filters['parent_id']), function ($query) use ($filters) {
                if ($filters['parent_id'] === 'root') {
                    $query->whereNull('parent_id');
                } else {
                    $query->where('parent_id', $filters['parent_id']);
                }
            })
            ->when(isset($filters['is_active']), function ($query) use ($filters) {
                $query->where('is_active', $filters['is_active'] === '1');
            })
            ->orderBy('sort_order')
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString()
            ->through(fn ($category) => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'description' => $category->description,
                'parent' => $category->parent ? [
                    'id' => $category->parent->id,
                    'name' => $category->parent->name,
                ] : null,
                'default_team' => $category->defaultTeam ? [
                    'id' => $category->defaultTeam->id,
                    'name' => $category->defaultTeam->name,
                ] : null,
                'is_active' => $category->is_active,
                'sort_order' => $category->sort_order,
                'requires_approval' => $category->requires_approval ?? false,
                'requires_hod_approval' => $category->requires_hod_approval ?? false,
                'hod_approval_threshold' => $category->hod_approval_threshold,
                'children_count' => $category->children_count,
                'tickets_count' => $category->tickets_count,
                'created_at' => $category->created_at->toDateTimeString(),
            ]);

        $rootCategories = TicketCategory::whereNull('parent_id')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Admin/Categories/Index', [
            'categories' => $categories,
            'filters' => $filters,
            'rootCategories' => $rootCategories,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Categories/Form', [
            'category' => null,
            'parentCategories' => TicketCategory::whereNull('parent_id')
                ->orderBy('name')
                ->get(['id', 'name']),
            'departments' => Department::where('is_support_team', true)
                ->orWhere('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function store(CategoryRequest $request): RedirectResponse
    {
        TicketCategory::create($request->validated());

        return redirect()
            ->route('admin.categories.index')
            ->with('success', 'Category created successfully.');
    }

    public function show(TicketCategory $category): Response
    {
        $category->load(['parent:id,name', 'defaultTeam:id,name', 'children', 'tickets']);

        return Inertia::render('Admin/Categories/Show', [
            'category' => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'description' => $category->description,
                'parent' => $category->parent ? [
                    'id' => $category->parent->id,
                    'name' => $category->parent->name,
                ] : null,
                'default_team' => $category->defaultTeam ? [
                    'id' => $category->defaultTeam->id,
                    'name' => $category->defaultTeam->name,
                ] : null,
                'is_active' => $category->is_active,
                'sort_order' => $category->sort_order,
                'requires_approval' => $category->requires_approval ?? false,
                'requires_hod_approval' => $category->requires_hod_approval ?? false,
                'hod_approval_threshold' => $category->hod_approval_threshold,
                'children_count' => $category->children()->count(),
                'tickets_count' => $category->tickets()->count(),
                'created_at' => $category->created_at->toDateTimeString(),
                'updated_at' => $category->updated_at->toDateTimeString(),
            ],
        ]);
    }

    public function edit(TicketCategory $category): Response
    {
        $category->load(['parent:id,name', 'defaultTeam:id,name']);

        return Inertia::render('Admin/Categories/Form', [
            'category' => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'description' => $category->description,
                'parent_id' => $category->parent_id ? $category->parent_id : '__none',
                'default_team_id' => $category->default_team_id ? $category->default_team_id : '',
                'is_active' => $category->is_active,
                'sort_order' => $category->sort_order,
                'requires_approval' => $category->requires_approval ?? false,
                'requires_hod_approval' => $category->requires_hod_approval ?? false,
                'hod_approval_threshold' => $category->hod_approval_threshold ?? null,
            ],
            'parentCategories' => TicketCategory::whereNull('parent_id')
                ->where('id', '!=', $category->id)
                ->orderBy('name')
                ->get(['id', 'name']),
            'departments' => Department::where('is_support_team', true)
                ->orWhere('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function update(CategoryRequest $request, TicketCategory $category): RedirectResponse
    {
        $data = $request->validated();
        
        // Handle parent_id conversion
        if (isset($data['parent_id']) && $data['parent_id'] === '__none') {
            $data['parent_id'] = null;
        } elseif (isset($data['parent_id'])) {
            $data['parent_id'] = (int) $data['parent_id'];
        }
        
        // Prevent category from being its own parent
        if (isset($data['parent_id']) && $data['parent_id'] == $category->id) {
            return redirect()
                ->back()
                ->withErrors(['parent_id' => 'A category cannot be its own parent.']);
        }

        // Prevent circular parent relationships
        if (isset($data['parent_id']) && $data['parent_id']) {
            $descendants = $category->descendants()->pluck('id')->toArray();
            if (in_array($data['parent_id'], $descendants)) {
                return redirect()
                    ->back()
                    ->withErrors(['parent_id' => 'Cannot set parent to a descendant category.']);
            }
        }

        $category->update($data);

        return redirect()
            ->route('admin.categories.index')
            ->with('success', 'Category updated successfully.');
    }

    public function destroy(TicketCategory $category): RedirectResponse
    {
        // Check if category has children
        if ($category->children()->count() > 0) {
            return redirect()
                ->route('admin.categories.index')
                ->with('error', 'Cannot delete category with subcategories. Please delete or move subcategories first.');
        }

        // Check if category has tickets
        if ($category->tickets()->count() > 0) {
            return redirect()
                ->route('admin.categories.index')
                ->with('error', 'Cannot delete category with assigned tickets.');
        }

        $category->delete();

        return redirect()
            ->route('admin.categories.index')
            ->with('success', 'Category deleted successfully.');
    }

    public function bulkUpdate(Request $request): RedirectResponse
    {
        $request->validate([
            'category_ids' => ['required', 'array', 'min:1'],
            'category_ids.*' => ['exists:ticket_categories,id'],
            'action' => ['required', 'string', 'in:activate,deactivate'],
        ]);

        $categoryIds = $request->input('category_ids');
        $action = $request->input('action');

        $categories = TicketCategory::whereIn('id', $categoryIds)->get();

        $updated = 0;
        $skipped = 0;

        foreach ($categories as $category) {
            if ($action === 'activate') {
                $category->update(['is_active' => true]);
                $updated++;
            } elseif ($action === 'deactivate') {
                $category->update(['is_active' => false]);
                $updated++;
            }
        }

        $categoryWord = $updated === 1 ? 'category' : 'categories';
        $message = "Successfully {$action}d {$updated} {$categoryWord}.";
        if ($skipped > 0) {
            $skippedWord = $skipped === 1 ? 'category was' : 'categories were';
            $message .= " {$skipped} {$skippedWord} skipped.";
        }

        return redirect()
            ->route('admin.categories.index')
            ->with('success', $message);
    }

    public function bulkDelete(Request $request): RedirectResponse
    {
        $request->validate([
            'category_ids' => ['required', 'array', 'min:1'],
            'category_ids.*' => ['exists:ticket_categories,id'],
        ]);

        $categoryIds = $request->input('category_ids');
        $categories = TicketCategory::whereIn('id', $categoryIds)->get();

        $deleted = 0;
        $skipped = 0;
        $errors = [];

        foreach ($categories as $category) {
            // Check if category has children
            if ($category->children()->count() > 0) {
                $skipped++;
                $errors[] = "Cannot delete '{$category->name}': has subcategories.";
                continue;
            }

            // Check if category has tickets
            if ($category->tickets()->count() > 0) {
                $skipped++;
                $errors[] = "Cannot delete '{$category->name}': has assigned tickets.";
                continue;
            }

            $category->delete();
            $deleted++;
        }

        if ($deleted > 0) {
            $categoryWord = $deleted === 1 ? 'category' : 'categories';
            $message = "Successfully deleted {$deleted} {$categoryWord}.";
            if ($skipped > 0) {
                $skippedWord = $skipped === 1 ? 'category was' : 'categories were';
                $message .= " {$skipped} {$skippedWord} skipped.";
            }

            return redirect()
                ->route('admin.categories.index')
                ->with('success', $message)
                ->with('bulk_errors', $errors);
        } else {
            return redirect()
                ->route('admin.categories.index')
                ->with('error', 'No categories could be deleted. ' . implode(' ', $errors));
        }
    }

    /**
     * Toggle category status (active/inactive)
     */
    public function toggleStatus(TicketCategory $category): RedirectResponse
    {
        $category->update([
            'is_active' => !$category->is_active,
        ]);

        $status = $category->is_active ? 'activated' : 'deactivated';

        return redirect()
            ->route('admin.categories.index')
            ->with('success', "Category \"{$category->name}\" has been {$status}.");
    }
}

