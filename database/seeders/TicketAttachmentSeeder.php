<?php

namespace Database\Seeders;

use App\Models\Ticket;
use App\Models\TicketAttachment;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class TicketAttachmentSeeder extends Seeder
{
    public function run(): void
    {
        // Get tickets that exist
        $tickets = Ticket::all();
        
        if ($tickets->isEmpty()) {
            $this->command->error('No tickets found. Please run TicketSeeder first.');
            return;
        }

        // Get users for uploaded_by
        $users = User::all();
        if ($users->isEmpty()) {
            $this->command->error('No users found. Please run UserSeeder first.');
            return;
        }

        // Common file types and extensions
        $fileTypes = [
            ['ext' => 'pdf', 'mime' => 'application/pdf', 'name' => 'document'],
            ['ext' => 'docx', 'mime' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'name' => 'document'],
            ['ext' => 'xlsx', 'mime' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'name' => 'spreadsheet'],
            ['ext' => 'png', 'mime' => 'image/png', 'name' => 'screenshot'],
            ['ext' => 'jpg', 'mime' => 'image/jpeg', 'name' => 'photo'],
            ['ext' => 'txt', 'mime' => 'text/plain', 'name' => 'log'],
            ['ext' => 'zip', 'mime' => 'application/zip', 'name' => 'archive'],
        ];

        $attachmentNames = [
            'error-screenshot',
            'system-log',
            'configuration-file',
            'documentation',
            'invoice',
            'report',
            'backup-file',
            'diagnostic-report',
            'user-manual',
            'installation-guide',
        ];

        // Create attachments for a subset of tickets (about 30-40% of tickets)
        $ticketsToAttach = $tickets->random(min(15, $tickets->count()));

        foreach ($ticketsToAttach as $ticket) {
            // Random number of attachments per ticket (1-3)
            $attachmentCount = rand(1, 3);
            
            for ($i = 0; $i < $attachmentCount; $i++) {
                $fileType = $fileTypes[array_rand($fileTypes)];
                $attachmentName = $attachmentNames[array_rand($attachmentNames)];
                
                $originalFilename = $attachmentName . '-' . time() . '-' . $i . '.' . $fileType['ext'];
                $filename = 'ticket_' . $ticket->id . '_' . uniqid() . '.' . $fileType['ext'];
                
                // Create a dummy file path (in real scenario, files would be uploaded)
                $filePath = 'tickets/' . $ticket->id . '/' . $filename;
                
                // Generate a realistic file size (in bytes)
                $fileSize = match($fileType['ext']) {
                    'pdf', 'docx' => rand(50000, 500000), // 50KB - 500KB
                    'xlsx' => rand(100000, 1000000), // 100KB - 1MB
                    'png', 'jpg' => rand(100000, 2000000), // 100KB - 2MB
                    'txt' => rand(1000, 50000), // 1KB - 50KB
                    'zip' => rand(200000, 5000000), // 200KB - 5MB
                    default => rand(10000, 100000),
                };

                TicketAttachment::create([
                    'ticket_id' => $ticket->id,
                    'uploaded_by' => $users->random()->id,
                    'filename' => $filename,
                    'original_filename' => $originalFilename,
                    'mime_type' => $fileType['mime'],
                    'file_size' => $fileSize,
                    'file_path' => $filePath,
                ]);
            }
        }

        $this->command->info('Ticket attachments seeded successfully.');
    }
}

