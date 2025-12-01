<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class, // Must run first to create roles
            DepartmentSeeder::class,
            TicketCategorySeeder::class,
            TagSeeder::class,
            SlaPolicySeeder::class,
            UserSeeder::class,
            ProjectSeeder::class,
            CustomFieldSeeder::class,
            CannedResponseSeeder::class,
            KnowledgeBaseArticleSeeder::class,
            EmailTemplateSeeder::class, // Email templates for notifications
            TicketTemplateSeeder::class, // Must run before TicketSeeder
            TicketSeeder::class,
            TicketAttachmentSeeder::class, // Must run after TicketSeeder
            TimeEntrySeeder::class, // Must run after TicketSeeder
        ]);
    }
}
