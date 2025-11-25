<?php
// app/Http/Controllers/Admin/ProjectController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $q = trim($request->input('q', ''));

        $projects = Project::query()
            ->when($q !== '', function ($query) use ($q) {
                $query->where('title', 'like', "%{$q}%")
                      ->orWhere('client_name', 'like', "%{$q}%")
                      ->orWhere('location', 'like', "%{$q}%");
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Admin/Projects/Index', [
            'projects' => $projects,
            'filters'  => ['q' => $q],
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Projects/Form', [
            'project' => null,
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        Project::create($data);

        return redirect()
            ->route('admin.projects.index')
            ->with('success', 'Project created successfully.');
    }

    public function edit(Project $project)
    {
        return Inertia::render('Admin/Projects/Form', [
            'project' => $project,
        ]);
    }

    public function update(Request $request, Project $project)
    {
        $data = $this->validateData($request);

        $project->update($data);

        return redirect()
            ->route('admin.projects.index')
            ->with('success', 'Project updated successfully.');
    }

    public function destroy(Project $project)
    {
        $project->delete();

        return redirect()
            ->route('admin.projects.index')
            ->with('success', 'Project deleted.');
    }

    protected function validateData(Request $request): array
    {
        return $request->validate([
            'title'             => ['required', 'string', 'max:191'],
            'client_name'       => ['nullable', 'string', 'max:191'],
            'location'          => ['nullable', 'string', 'max:255'],
            'start_date'        => ['nullable', 'date'],
            'end_date'          => ['nullable', 'date', 'after_or_equal:start_date'],
            'status'            => ['required', 'in:planned,in_progress,completed,on_hold,cancelled'],
            'short_description' => ['nullable', 'string'],
            'description'       => ['nullable', 'string'],
            'cover_image'       => ['nullable', 'string', 'max:255'],
            'featured'          => ['boolean'],
        ]);
    }
}
