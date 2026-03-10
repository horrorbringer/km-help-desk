<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrgChartController extends Controller
{
    public function index(): Response
    {
        // Get management and executive roles (hierarchy_level > 1)
        // We exclude Requesters and Contractors from the org chart to focus on structure
        $roles = Role::with(['users:id,name,avatar,email', 'parent:id,name'])
            ->where('hierarchy_level', '>', 1)
            ->orderBy('hierarchy_level', 'desc')
            ->get()
            ->map(function ($role) {
            return [
            'id' => $role->id,
            'name' => $role->name,
            'hierarchy_level' => $role->hierarchy_level,
            'parent_id' => $role->parent_role_id,
            'users' => $role->users->map(fn($user) => [
            'id' => $user->id,
            'name' => $user->name,
            'avatar' => $user->avatar,
            'email' => $user->email,
            ]),
            'users_count' => $role->users->count(),
            ];
        });

        // Build hierarchy tree for visualization
        $tree = $this->buildHierarchyTree($roles);

        return Inertia::render('Admin/OrgChart/Index', [
            'roles' => $roles,
            'tree' => $tree,
        ]);
    }

    /**
     * Build a tree structure from flat roles list
     */
    private function buildHierarchyTree($roles): array
    {
        $rolesById = $roles->keyBy('id');
        $tree = [];

        foreach ($roles as $role) {
            if ($role['parent_id'] === null) {
                // Top-level role
                $tree[] = $this->buildNode($role, $rolesById);
            }
        }

        // Sort by hierarchy level descending
        usort($tree, fn($a, $b) => $b['hierarchy_level'] <=> $a['hierarchy_level']);

        return $tree;
    }

    private function buildNode($role, $rolesById): array
    {
        $children = [];
        foreach ($rolesById as $r) {
            if ($r['parent_id'] === $role['id']) {
                $children[] = $this->buildNode($r, $rolesById);
            }
        }

        // Sort children by hierarchy level descending
        usort($children, fn($a, $b) => $b['hierarchy_level'] <=> $a['hierarchy_level']);

        return [
            ...$role,
            'children' => $children,
        ];
    }
}