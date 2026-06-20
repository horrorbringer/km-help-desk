<?php

namespace App\Console\Commands;

use App\Models\SoftwareLicense;
use App\Services\NotificationService;
use App\Support\NotificationType;
use Illuminate\Console\Command;

class CheckLicenseExpiry extends Command
{
    protected $signature = 'licenses:check-expiry';

    protected $description = 'Notify license renewal owners before software licenses expire';

    public function handle(NotificationService $notifications): int
    {
        $licenses = SoftwareLicense::query()
            ->with('renewalOwner:id,name')
            ->where('is_active', true)
            ->whereNotNull('renewal_owner_id')
            ->whereDate('expires_at', '<=', today()->addDays(30))
            ->get();

        $created = 0;

        foreach ($licenses as $license) {
            $days = today()->diffInDays($license->expires_at, false);
            $stage = $days < 0 ? 'expired' : ($days <= 7 ? '7-days' : ($days <= 14 ? '14-days' : '30-days'));
            $when = $days < 0 ? 'has expired' : "expires in {$days} day".($days === 1 ? '' : 's');

            $notification = $notifications->create(
                $license->renewal_owner_id,
                NotificationType::LICENSE_EXPIRING,
                $days < 0 ? 'Software License Expired' : 'Software License Renewal Required',
                "{$license->product_name} {$when}. Review renewal and available seats.",
                data: ['software_license_id' => $license->id, 'expires_at' => $license->expires_at->toDateString()],
                dedupeKey: "software-license:{$license->id}:expiry:{$license->expires_at->toDateString()}:{$stage}:user:{$license->renewal_owner_id}"
            );

            $created += $notification->wasRecentlyCreated ? 1 : 0;
        }

        $this->info("Checked {$licenses->count()} licenses; created {$created} renewal alerts.");

        return Command::SUCCESS;
    }
}
