<?php

namespace Database\Seeders;

use App\Models\Ticket;
use App\Models\TimeEntry;
use App\Models\User;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class TimeEntrySeeder extends Seeder
{
    public function run(): void
    {
        // Get tickets and users
        $tickets = Ticket::all();
        $users = User::whereHas('roles', function ($query) {
            $query->whereIn('name', ['Agent', 'Manager', 'Super Admin']);
        })->get();

        if ($tickets->isEmpty() || $users->isEmpty()) {
            $this->command->warn('No tickets or users found. Please run TicketSeeder and UserSeeder first.');
            return;
        }

        $activityTypes = TimeEntry::ACTIVITY_TYPES;
        $hourlyRates = [25.00, 30.00, 35.00, 40.00, 45.00, 50.00];

        // Create time entries for the last 30 days
        foreach ($tickets as $ticket) {
            // Randomly decide if this ticket should have time entries (70% chance)
            if (rand(1, 10) > 3) {
                // 1-5 time entries per ticket
                $entryCount = rand(1, 5);
                
                for ($i = 0; $i < $entryCount; $i++) {
                    $user = $users->random();
                    $date = Carbon::now()->subDays(rand(0, 30))->startOfDay();
                    
                    // Random start time between 8 AM and 5 PM
                    $startHour = rand(8, 16);
                    $startMinute = rand(0, 59);
                    $startTimeStr = sprintf('%02d:%02d:00', $startHour, $startMinute);
                    
                    // Duration between 30 minutes and 4 hours
                    $durationMinutes = rand(30, 240);
                    $endHour = $startHour;
                    $endMinute = $startMinute + ($durationMinutes % 60);
                    if ($endMinute >= 60) {
                        $endHour += 1;
                        $endMinute -= 60;
                    }
                    $endHour += intval($durationMinutes / 60);
                    $endTimeStr = sprintf('%02d:%02d:00', $endHour, $endMinute);
                    
                    // Calculate amount
                    $hourlyRate = $hourlyRates[array_rand($hourlyRates)];
                    $hours = $durationMinutes / 60;
                    $amount = round($hours * $hourlyRate, 2);
                    
                    // 80% chance of being billable
                    $isBillable = rand(1, 10) > 2;
                    
                    // 60% chance of being approved
                    $isApproved = rand(1, 10) > 4;
                    $approvedBy = $isApproved ? $users->random()->id : null;
                    $approvedAt = $isApproved ? $date->copy()->addDays(rand(1, 3)) : null;

                    $timeEntry = new TimeEntry([
                        'ticket_id' => $ticket->id,
                        'user_id' => $user->id,
                        'date' => $date->toDateString(),
                        'start_time' => $startTimeStr,
                        'end_time' => $endTimeStr,
                        'duration_minutes' => $durationMinutes,
                        'description' => $this->getDescription($activityTypes[array_rand($activityTypes)]),
                        'activity_type' => $activityTypes[array_rand($activityTypes)],
                        'is_billable' => $isBillable,
                        'hourly_rate' => $isBillable ? $hourlyRate : null,
                        'amount' => $isBillable ? $amount : null,
                        'is_approved' => $isApproved,
                        'approved_by' => $approvedBy,
                        'approved_at' => $approvedAt,
                    ]);
                    
                    // Save without triggering boot method calculations
                    $timeEntry->saveQuietly();
                }
            }
        }

        $this->command->info('Time entries created successfully.');
    }

    private function getDescription(string $activityType): string
    {
        $descriptions = [
            'Development' => [
                'Developed new feature for ticket tracking system',
                'Fixed bug in ticket assignment logic',
                'Implemented automated SLA calculations',
                'Created API endpoint for mobile app',
            ],
            'Support' => [
                'Investigated VPN connection issue',
                'Resolved user access permissions',
                'Troubleshot equipment failure on site',
                'Assisted with procurement request processing',
            ],
            'Meeting' => [
                'Team standup meeting',
                'Client consultation for project requirements',
                'Sprint planning session',
                'Post-incident review meeting',
            ],
            'Research' => [
                'Researched solutions for network connectivity issues',
                'Evaluated new equipment options',
                'Investigated best practices for safety compliance',
                'Studied vendor proposals for procurement',
            ],
            'Documentation' => [
                'Updated knowledge base article',
                'Documented troubleshooting procedures',
                'Created user guide for new system',
                'Wrote incident report',
            ],
            'Testing' => [
                'Tested VPN connection from remote location',
                'Verified equipment functionality after repair',
                'Tested new software deployment',
                'Validated security configurations',
            ],
            'Training' => [
                'Conducted training session for new employees',
                'Provided on-site equipment operation training',
                'Delivered safety compliance training',
                'Trained team on new ticketing system features',
            ],
            'Other' => [
                'General administrative tasks',
                'Follow-up on pending tickets',
                'Coordination with external vendors',
                'System maintenance and updates',
            ],
        ];

        $options = $descriptions[$activityType] ?? ['General work on ticket'];
        return $options[array_rand($options)];
    }
}
