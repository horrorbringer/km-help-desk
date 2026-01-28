<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ApprovalLevel;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ApprovalLevelController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = ApprovalLevel::query()->ordered();

        if ($request->has('q')) {
            $search = $request->input('q');
            $query->where(function ($q) use ($search) {
                $q->where('label', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->has('is_active') && $request->input('is_active') !== '__all') {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->has('is_system_level') && $request->input('is_system_level') !== '__all') {
            $query->where('is_system_level', $request->boolean('is_system_level'));
        }

        $approvalLevels = $query->get();
        $roles = Role::pluck('name')->toArray();

        return Inertia::render('Admin/ApprovalLevels/Index', [
            'approvalLevels' => $approvalLevels,
            'filters' => $request->only(['q', 'is_active', 'is_system_level']),
            'formOptions' => [
                'roles' => $roles,
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $roles = Role::pluck('name')->toArray();

        return Inertia::render('Admin/ApprovalLevels/Form', [
            'formOptions' => [
                'roles' => $roles,
            ],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'regex:/^[a-z0-9_-]+$/', 'unique:approval_levels,code'],
            'label' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'role_names' => ['required', 'array', 'min:1'],
            'role_names.*' => ['string', 'exists:roles,name'],
            'hierarchy_order' => ['required', 'integer', 'min:1'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ]);

        ApprovalLevel::create(array_merge($validated, [
            'is_system_level' => false,
        ]));

        return redirect()->route('admin.approval-levels.index')
            ->with('success', 'Approval level created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(ApprovalLevel $approvalLevel)
    {
        // Not implemented as per UI flow
        return redirect()->route('admin.approval-levels.edit', $approvalLevel);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(ApprovalLevel $approvalLevel): Response
    {
        $roles = Role::pluck('name')->toArray();

        return Inertia::render('Admin/ApprovalLevels/Form', [
            'approvalLevel' => $approvalLevel,
            'formOptions' => [
                'roles' => $roles,
            ],
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ApprovalLevel $approvalLevel)
    {
        $rules = [
            'label' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'role_names' => ['required', 'array', 'min:1'],
            'role_names.*' => ['string', 'exists:roles,name'],
            'hierarchy_order' => ['required', 'integer', 'min:1'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ];

        // Only validate code uniqueness if it changed and it's not a system level
        // (System levels shouldn't have code changes, but UI enforces that disabled state)
        if (! $approvalLevel->is_system_level) {
            $rules['code'] = [
                'required',
                'string',
                'max:50',
                'regex:/^[a-z0-9_-]+$/',
                Rule::unique('approval_levels', 'code')->ignore($approvalLevel->id),
            ];
        }

        $validated = $request->validate($rules);

        // Protect system level code from being changed even if request contains it
        if ($approvalLevel->is_system_level) {
            unset($validated['code']);
        }

        $approvalLevel->update($validated);

        return redirect()->route('admin.approval-levels.index')
            ->with('success', 'Approval level updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ApprovalLevel $approvalLevel)
    {
        if ($approvalLevel->is_system_level) {
            return back()->with('error', 'System approval levels cannot be deleted.');
        }

        $approvalLevel->delete();

        return redirect()->route('admin.approval-levels.index')
            ->with('success', 'Approval level deleted successfully.');
    }

    /**
     * Toggle the status of the specified resource.
     */
    public function toggleStatus(ApprovalLevel $approvalLevel)
    {
        $approvalLevel->update([
            'is_active' => ! $approvalLevel->is_active,
        ]);

        return back()->with('success', 'Approval level status updated.');
    }
}
