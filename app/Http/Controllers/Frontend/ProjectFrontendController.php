<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProjectFrontendController extends Controller
{
    public function index(Request $request)
    {
        $q      = trim($request->input('q', ''));
        $status = $request->input('status', '');

        $projects = Project::query()
            ->when($q !== '', function ($query) use ($q) {
                $query->where(function ($qBuilder) use ($q) {
                    $qBuilder->where('title', 'like', "%{$q}%")
                        ->orWhere('client_name', 'like', "%{$q}%")
                        ->orWhere('location', 'like', "%{$q}%");
                });
            })
            ->when($status !== '', function ($query) use ($status) {
                $query->where('status', $status);
            })
            // You can choose to show only completed projects if you want:
            // ->where('status', 'completed')
            ->latest()
            ->paginate(9)
            ->withQueryString();

        return Inertia::render('Frontend/Projects/Index', [
            'projects' => $projects,
            'filters'  => [
                'q'      => $q,
                'status' => $status,
            ],
        ]);
    }

    public function show(string $slug)
    {
        $project = Project::where('slug', $slug)->firstOrFail();

        $relatedProjects = Project::query()
            ->where('id', '!=', $project->id)
            ->latest()
            ->take(3)
            ->get();

        return Inertia::render('Frontend/Projects/Show', [
            'project'         => $project,
            'relatedProjects' => $relatedProjects,
        ]);
    }
}
