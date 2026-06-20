<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SoftwareLicenseRequest;
use App\Models\SoftwareLicense;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SoftwareLicenseController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['q', 'status']);

        $licenses = SoftwareLicense::query()
            ->with(['renewalOwner:id,name', 'assignedUser:id,name'])
            ->when($filters['q'] ?? null, fn ($query, $q) => $query->where(function ($subquery) use ($q) {
                $subquery->where('product_name', 'like', "%{$q}%")
                    ->orWhere('vendor', 'like', "%{$q}%")
                    ->orWhere('assigned_device', 'like', "%{$q}%");
            }))
            ->when($filters['status'] ?? null, function ($query, $status) {
                if ($status === 'expired') {
                    $query->whereDate('expires_at', '<', today());
                } elseif ($status === 'expiring') {
                    $query->whereBetween('expires_at', [today(), today()->addDays(30)]);
                } elseif ($status === 'active') {
                    $query->where('is_active', true)->whereDate('expires_at', '>', today()->addDays(30));
                }
            })
            ->orderBy('expires_at')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (SoftwareLicense $license) => $this->licensePayload($license));

        return Inertia::render('Admin/SoftwareLicenses/Index', [
            'licenses' => $licenses,
            'filters' => $filters,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/SoftwareLicenses/Form', [
            'license' => null,
            'users' => $this->userOptions(),
        ]);
    }

    public function store(SoftwareLicenseRequest $request): RedirectResponse
    {
        SoftwareLicense::create($request->validated());

        return to_route('admin.software-licenses.index')->with('success', 'Software license added.');
    }

    public function edit(SoftwareLicense $softwareLicense): Response
    {
        return Inertia::render('Admin/SoftwareLicenses/Form', [
            'license' => [
                ...$this->licensePayload($softwareLicense),
                'license_key' => $softwareLicense->license_key,
                'notes' => $softwareLicense->notes,
                'renewal_owner_id' => $softwareLicense->renewal_owner_id,
                'assigned_user_id' => $softwareLicense->assigned_user_id,
            ],
            'users' => $this->userOptions(),
        ]);
    }

    public function update(SoftwareLicenseRequest $request, SoftwareLicense $softwareLicense): RedirectResponse
    {
        $data = $request->validated();

        if (! filled($data['license_key'] ?? null)) {
            unset($data['license_key']);
        }

        $softwareLicense->update($data);

        return to_route('admin.software-licenses.index')->with('success', 'Software license updated.');
    }

    public function destroy(SoftwareLicense $softwareLicense): RedirectResponse
    {
        $softwareLicense->delete();

        return to_route('admin.software-licenses.index')->with('success', 'Software license removed.');
    }

    private function userOptions()
    {
        return User::query()->where('is_active', true)->orderBy('name')->get(['id', 'name']);
    }

    private function licensePayload(SoftwareLicense $license): array
    {
        $daysUntilExpiry = today()->diffInDays($license->expires_at, false);

        return [
            'id' => $license->id,
            'product_name' => $license->product_name,
            'vendor' => $license->vendor,
            'total_seats' => $license->total_seats,
            'assigned_seats' => $license->assigned_seats,
            'available_seats' => $license->total_seats - $license->assigned_seats,
            'expires_at' => $license->expires_at->toDateString(),
            'days_until_expiry' => $daysUntilExpiry,
            'renewal_owner' => $license->renewalOwner?->only(['id', 'name']),
            'assigned_user' => $license->assignedUser?->only(['id', 'name']),
            'assigned_device' => $license->assigned_device,
            'is_active' => $license->is_active,
        ];
    }
}
