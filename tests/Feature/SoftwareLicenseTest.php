<?php

use App\Models\HelpDeskNotification;
use App\Models\SoftwareLicense;
use App\Models\User;
use App\Support\NotificationType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;

uses(RefreshDatabase::class);

it('notifies the renewal owner once for the current expiry alert stage', function () {
    $owner = User::factory()->create();
    $license = SoftwareLicense::create([
        'product_name' => 'Microsoft 365 Business Standard',
        'total_seats' => 10,
        'assigned_seats' => 9,
        'expires_at' => today()->addDays(7),
        'renewal_owner_id' => $owner->id,
        'is_active' => true,
    ]);

    Artisan::call('licenses:check-expiry');
    Artisan::call('licenses:check-expiry');

    expect(HelpDeskNotification::query()
        ->where('type', NotificationType::LICENSE_EXPIRING)
        ->where('user_id', $owner->id)
        ->count())->toBe(1);
});

it('requires assigned seats not to exceed total seats', function () {
    $request = new \App\Http\Requests\SoftwareLicenseRequest;
    $rules = $request->rules();

    expect($rules['assigned_seats'])->toContain('lte:total_seats');
});
