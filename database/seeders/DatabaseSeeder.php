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
            RolePermissionSeeder::class , // Must run first to create roles
            ApprovalLevelSeeder::class , // Approval levels (after roles, before workflow templates)
            DepartmentSeeder::class ,
            TicketCategorySeeder::class ,
            WorkflowTemplateSeeder::class , // Workflow templates (after categories)
            TagSeeder::class ,
            SlaPolicySeeder::class ,
            UserSeeder::class ,
            ProjectSeeder::class ,
            CustomFieldSeeder::class ,
            CannedResponseSeeder::class ,
            NotificationTemplateSeeder::class , // Notification templates
            DefaultAutomationRuleSeeder::class , // Default automation rules (after notification templates)
            KnowledgeBaseArticleSeeder::class ,
            EmailTemplateSeeder::class , // Email templates for notifications
            TicketTemplateSeeder::class , // Must run before TicketSeeder
            TicketSeeder::class ,
            TicketAttachmentSeeder::class , // Must run after TicketSeeder
            TimeEntrySeeder::class , // Must run after TicketSeeder
        ]);
    }
}