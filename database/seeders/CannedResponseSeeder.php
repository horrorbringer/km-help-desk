<?php

namespace Database\Seeders;

use App\Models\CannedResponse;
use App\Models\TicketCategory;
use App\Models\User;
use Illuminate\Database\Seeder;

class CannedResponseSeeder extends Seeder
{
    public function run(): void
    {
        // Clear permission cache to ensure roles are fresh
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Find a Super Admin user, or fall back to first user
        // Try multiple approaches to find a valid user
        $author = null;
        
        // Method 1: Try to find by role (using Spatie)
        try {
            $author = User::role('Super Admin')->first();
        } catch (\Exception $e) {
            // If role lookup fails, continue to next method
        }
        
        // Method 2: Try specific email
        if (!$author) {
            $author = User::where('email', 'makara@kimmix.com')->first();
        }
        
        // Method 3: Try any user with Super Admin role via relationship
        if (!$author) {
            $author = User::whereHas('roles', function ($query) {
                $query->where('name', 'Super Admin');
            })->first();
        }
        
        // Method 4: Fall back to any user
        if (!$author) {
            $author = User::first();
        }

        if (!$author || !$author->id) {
            $this->command->error('No valid user found. Please run UserSeeder first.');
            return;
        }

        // Ensure we have a valid author ID
        $authorId = (int) $author->id;
        if ($authorId <= 0) {
            $this->command->error('Invalid author ID. Please run UserSeeder first.');
            return;
        }

        $categories = TicketCategory::whereIn('slug', [
            'it-support',
            'safety-compliance',
            'purchase-request',
            'invoice-processing',
            'hardware-issues',
            'network-connectivity',
            'equipment-failure',
        ])->get()->keyBy('slug');

        $responses = [
            [
                'title' => 'Acknowledge Ticket Receipt',
                'content' => "Hi {{requester_name}},\n\nWe've received your ticket and an agent will respond shortly.\n\nThank you,\nKimmix Support",
                'category_slug' => 'it-support',
            ],
            [
                'title' => 'Safety Incident Checklist',
                'content' => "Hello {{requester_name}},\n\nPlease ensure the area is cordoned off and submit any photos or witness statements. HSE will reach out within the hour.\n\nThanks,\nSafety Desk",
                'category_slug' => 'safety-compliance',
            ],
            [
                'title' => 'Password Reset Instructions',
                'content' => "Hi {{requester_name}},\n\nTo reset your password:\n1. Go to the login page\n2. Click 'Forgot Password'\n3. Enter your email address\n4. Check your email for reset link\n5. Follow the instructions\n\nIf you need further assistance, please reply to this ticket.\n\nBest regards,\nIT Support",
                'category_slug' => 'it-support',
            ],
            [
                'title' => 'Procurement Request Acknowledged',
                'content' => "Hello {{requester_name}},\n\nWe've received your procurement request and it's being processed. You'll receive updates as we progress through vendor selection and approval.\n\nEstimated processing time: 3-5 business days\n\nRegards,\nProcurement Team",
                'category_slug' => 'purchase-request',
            ],
            [
                'title' => 'Equipment Maintenance Scheduled',
                'content' => "Hi {{requester_name}},\n\nWe've scheduled maintenance for the equipment you reported. Our field engineer will arrive on [DATE] at [TIME].\n\nPlease ensure the equipment is accessible and the area is clear.\n\nThank you,\nField Engineering",
                'category_slug' => 'equipment-failure',
            ],
            [
                'title' => 'Finance Query Under Review',
                'content' => "Hello {{requester_name}},\n\nWe're reviewing your finance query and will get back to you within 2 business days. If you have any supporting documents, please attach them to this ticket.\n\nBest regards,\nFinance Team",
                'category_slug' => 'invoice-processing',
            ],
            [
                'title' => 'VPN Connection Troubleshooting',
                'content' => "Hi {{requester_name}},\n\nTo troubleshoot VPN connection issues:\n1. Check your internet connection\n2. Verify your credentials\n3. Try connecting to a different server\n4. Restart the VPN client\n\nIf the issue persists, please provide:\n- Error message (if any)\n- Your location\n- Device type\n\nIT Support",
                'category_slug' => 'network-connectivity',
            ],
            [
                'title' => 'Hardware Issue - On-Site Visit Required',
                'content' => "Hello {{requester_name}},\n\nWe've reviewed your hardware issue and determined an on-site visit is needed. Our technician will contact you to schedule a convenient time.\n\nPlease ensure the equipment is accessible when we arrive.\n\nThanks,\nIT Support",
                'category_slug' => 'hardware-issues',
            ],
            [
                'title' => 'Ticket Resolved - Follow-up',
                'content' => "Hi {{requester_name}},\n\nYour ticket has been resolved. If you're still experiencing issues or have any questions, please reply to this ticket and we'll be happy to help.\n\nThank you for using Kimmix Support!\n\nBest regards,\nSupport Team",
                'category_slug' => 'it-support',
            ],
            [
                'title' => 'Request for Additional Information',
                'content' => "Hello {{requester_name}},\n\nTo better assist you, we need some additional information:\n\n- [Specific information needed]\n- [Any relevant details]\n\nPlease provide this information at your earliest convenience so we can proceed with resolving your ticket.\n\nThank you,\nSupport Team",
                'category_slug' => 'it-support',
            ],
        ];

        foreach ($responses as $response) {
            $category = $categories[$response['category_slug']] ?? null;
            
            // Prepare data with explicit created_by
            $data = [
                'title' => $response['title'],
                'content' => $response['content'],
                'category_id' => $category?->id,
                'created_by' => $authorId,
                'is_active' => true,
            ];
            
            CannedResponse::updateOrCreate(
                ['title' => $response['title']],
                $data
            );
        }
    }
}


