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
        $author = User::where('email', 'admin@kimmix.test')->first();
        $itCategory = TicketCategory::where('slug', 'it-support')->first();
        $safetyCategory = TicketCategory::where('slug', 'safety-compliance')->first();

        $responses = [
            [
                'title' => 'Acknowledge Ticket Receipt',
                'content' => "Hi {{requester_name}},\n\nWe've received your ticket and an agent will respond shortly.\n\nThank you,\nKimmix Support",
                'category_id' => optional($itCategory)->id,
            ],
            [
                'title' => 'Safety Incident Checklist',
                'content' => "Hello {{requester_name}},\n\nPlease ensure the area is cordoned off and submit any photos or witness statements. HSE will reach out within the hour.\n\nThanks,\nSafety Desk",
                'category_id' => optional($safetyCategory)->id,
            ],
        ];

        foreach ($responses as $response) {
            CannedResponse::updateOrCreate(
                ['title' => $response['title']],
                $response + [
                    'created_by' => optional($author)->id,
                    'is_active' => true,
                ]
            );
        }
    }
}


