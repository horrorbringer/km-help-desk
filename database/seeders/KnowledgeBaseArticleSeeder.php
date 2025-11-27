<?php

namespace Database\Seeders;

use App\Models\KnowledgeBaseArticle;
use App\Models\TicketCategory;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class KnowledgeBaseArticleSeeder extends Seeder
{
    public function run(): void
    {
        // Get author (prefer Super Admin)
        $author = User::role('Super Admin')->first()
            ?? User::where('email', 'makara@kimmix.com')->first()
            ?? User::first();

        if (!$author) {
            $this->command->error('No users found. Please run UserSeeder first.');
            return;
        }

        // Get categories
        $categories = TicketCategory::whereIn('slug', [
            'it-support',
            'hardware',
            'network-vpn',
            'application-access',
            'site-operations',
            'equipment-failure',
            'safety-compliance',
            'incident-reporting',
        ])->get()->keyBy('slug');

        $articles = [
            [
                'title' => 'How to Connect to Company VPN',
                'excerpt' => 'Step-by-step guide to connecting to the company VPN from remote locations.',
                'content' => "## Connecting to Company VPN\n\n### Prerequisites\n- Valid company email account\n- VPN client installed on your device\n- Internet connection\n\n### Steps\n\n1. **Open VPN Client**\n   - Launch the VPN application on your device\n   - Enter your company email address\n\n2. **Enter Credentials**\n   - Username: Your company email\n   - Password: Your network password\n   - If prompted, enter your MFA code\n\n3. **Select Server**\n   - Choose the nearest server location\n   - Click 'Connect'\n\n4. **Troubleshooting**\n   - If connection fails, check your internet connection\n   - Verify your credentials are correct\n   - Contact IT Support if issues persist\n\n### Common Issues\n\n- **Error 809**: Usually indicates certificate or gateway issues. Contact IT Support.\n- **Slow Connection**: Try connecting to a different server location.\n- **Authentication Failed**: Verify your password and MFA settings.",
                'category_slug' => 'network-vpn',
                'status' => 'published',
                'is_featured' => true,
                'published_at' => now()->subDays(30),
            ],
            [
                'title' => 'Password Reset Guide',
                'excerpt' => 'Learn how to reset your password and unlock your account.',
                'content' => "## Password Reset Guide\n\n### Self-Service Password Reset\n\n1. Go to the login page\n2. Click 'Forgot Password'\n3. Enter your email address\n4. Check your email for reset link\n5. Follow the instructions to set a new password\n\n### Password Requirements\n\n- Minimum 12 characters\n- At least one uppercase letter\n- At least one lowercase letter\n- At least one number\n- At least one special character\n\n### Account Locked?\n\nIf your account is locked after multiple failed login attempts:\n\n1. Wait 15 minutes for automatic unlock\n2. Contact IT Support if still locked\n3. Provide your employee ID for verification\n\n### Still Need Help?\n\nContact IT Service Desk at support@kimmix.com or call extension 100.",
                'category_slug' => 'application-access',
                'status' => 'published',
                'is_featured' => true,
                'published_at' => now()->subDays(25),
            ],
            [
                'title' => 'Reporting Safety Incidents',
                'excerpt' => 'Complete guide on how to report workplace safety incidents and near misses.',
                'content' => "## Reporting Safety Incidents\n\n### When to Report\n\nReport immediately if:\n- Someone is injured\n- Property is damaged\n- There's a near miss (could have caused injury)\n- Environmental incident occurs\n\n### How to Report\n\n1. **Immediate Actions**\n   - Ensure the area is safe\n   - Provide first aid if trained\n   - Call emergency services if needed\n\n2. **Create a Ticket**\n   - Log into the ticketing system\n   - Select 'Safety & Compliance' category\n   - Choose 'Incident Reporting' subcategory\n   - Fill in all required details\n\n3. **Provide Details**\n   - Date and time of incident\n   - Location (be specific)\n   - Description of what happened\n   - Names of witnesses\n   - Photos if available\n\n### Follow-Up\n\n- HSE team will contact you within 1 hour for critical incidents\n- Investigation will begin within 24 hours\n- You may be asked to provide additional information\n\n### Confidentiality\n\nAll reports are confidential. Retaliation for reporting is strictly prohibited.",
                'category_slug' => 'incident-reporting',
                'status' => 'published',
                'is_featured' => true,
                'published_at' => now()->subDays(20),
            ],
            [
                'title' => 'Equipment Maintenance Request Process',
                'excerpt' => 'How to request maintenance or report equipment failures on construction sites.',
                'content' => "## Equipment Maintenance Request Process\n\n### When to Request Maintenance\n\n- Equipment is not functioning properly\n- Preventive maintenance is due\n- Safety concerns with equipment\n- Unusual noises or vibrations\n\n### Creating a Maintenance Request\n\n1. **Create a Ticket**\n   - Select 'Site Operations' category\n   - Choose 'Equipment Failure' subcategory\n   - Provide equipment details:\n     - Equipment type and model\n     - Serial number or asset tag\n     - Location on site\n     - Description of issue\n\n2. **Priority Guidelines**\n   - **Critical**: Equipment failure affecting safety or major delays\n   - **High**: Equipment down but workaround available\n   - **Medium**: Minor issues, equipment still operational\n   - **Low**: Preventive maintenance\n\n3. **Attach Photos**\n   - Take clear photos of the issue\n   - Include equipment identification tags\n   - Show any visible damage or problems\n\n### Response Times\n\n- Critical: 1 hour\n- High: 4 hours\n- Medium: 24 hours\n- Low: 48 hours\n\n### Follow-Up\n\nField Engineering team will:\n- Acknowledge your request\n- Schedule inspection or repair\n- Update ticket with progress\n- Mark as resolved when complete",
                'category_slug' => 'equipment-failure',
                'status' => 'published',
                'is_featured' => false,
                'published_at' => now()->subDays(15),
            ],
            [
                'title' => 'Procurement Request Guidelines',
                'excerpt' => 'Step-by-step process for submitting procurement requests and purchase orders.',
                'content' => "## Procurement Request Guidelines\n\n### Before Submitting\n\n1. **Check Inventory**\n   - Verify if item is already in stock\n   - Check with warehouse team\n\n2. **Get Approvals**\n   - Manager approval required for items over $500\n   - Department head approval for items over $2,000\n   - Finance approval for items over $10,000\n\n3. **Gather Information**\n   - Item description and specifications\n   - Quantity needed\n   - Preferred vendor (if any)\n   - Budget code\n   - Expected delivery date\n\n### Submitting the Request\n\n1. Create a ticket in 'Procurement Requests' category\n2. Fill in all required fields\n3. Attach quotes or specifications if available\n4. Add any special instructions\n\n### Processing Timeline\n\n- **Standard Items**: 3-5 business days\n- **Custom Orders**: 1-2 weeks\n- **International Orders**: 2-4 weeks\n\n### Tracking Your Request\n\n- You'll receive email updates\n- Check ticket status in the system\n- Contact Procurement team for urgent requests\n\n### Tips\n\n- Submit requests early to avoid delays\n- Provide complete specifications\n- Include alternative options if available",
                'category_slug' => 'procurement-requests',
                'status' => 'published',
                'is_featured' => false,
                'published_at' => now()->subDays(10),
            ],
            [
                'title' => 'Laptop Setup for New Employees',
                'excerpt' => 'Complete checklist for setting up laptops for new team members.',
                'content' => "## Laptop Setup for New Employees\n\n### Initial Setup\n\n1. **Unbox and Inspect**\n   - Check for physical damage\n   - Verify all accessories are included\n   - Note serial number\n\n2. **Power On**\n   - Connect to power adapter\n   - Press power button\n   - Wait for initial boot\n\n3. **Windows Setup**\n   - Follow on-screen instructions\n   - Connect to Wi-Fi\n   - Sign in with company account\n\n### Software Installation\n\n1. **Required Software**\n   - Microsoft Office 365\n   - VPN Client\n   - Antivirus software\n   - Company communication tools\n\n2. **Access Setup**\n   - Email configuration\n   - Shared drive mapping\n   - Printer setup\n\n### Security Configuration\n\n1. **Enable BitLocker**\n   - Encrypt hard drive\n   - Save recovery key securely\n\n2. **MFA Setup**\n   - Configure multi-factor authentication\n   - Set up backup codes\n\n3. **Password Manager**\n   - Install company password manager\n   - Import credentials\n\n### Final Steps\n\n1. Test all applications\n2. Verify network access\n3. Test VPN connection\n4. Contact IT if issues arise\n\n### Support\n\nFor assistance, contact IT Service Desk or create a ticket.",
                'category_slug' => 'hardware',
                'status' => 'published',
                'is_featured' => false,
                'published_at' => now()->subDays(5),
            ],
            [
                'title' => 'Understanding SLA Policies',
                'excerpt' => 'Learn about Service Level Agreements and response times for different ticket priorities.',
                'content' => "## Understanding SLA Policies\n\n### What is an SLA?\n\nService Level Agreement (SLA) defines the expected response and resolution times for support tickets based on priority.\n\n### Priority Levels\n\n1. **Critical**\n   - Response: 15 minutes\n   - Resolution: 2 hours\n   - Examples: Safety incidents, system outages\n\n2. **High**\n   - Response: 1 hour\n   - Resolution: 8 hours\n   - Examples: Equipment failures, urgent requests\n\n3. **Medium**\n   - Response: 2 hours\n   - Resolution: 24 hours\n   - Examples: Standard support requests\n\n4. **Low**\n   - Response: 4 hours\n   - Resolution: 48 hours\n   - Examples: General inquiries, non-urgent issues\n\n### SLA Breach\n\nIf SLA is breached:\n- Ticket is automatically escalated\n- Manager is notified\n- Additional resources are allocated\n\n### Tracking\n\n- Check ticket for SLA status\n- First response time is tracked\n- Resolution time is monitored\n- You'll be notified of any delays\n\n### Questions?\n\nContact your department manager or create a ticket for clarification.",
                'category_slug' => 'it-support',
                'status' => 'published',
                'is_featured' => false,
                'published_at' => now()->subDays(3),
            ],
        ];

        foreach ($articles as $article) {
            $slug = Str::slug($article['title']);
            $category = $categories[$article['category_slug']] ?? null;

            KnowledgeBaseArticle::updateOrCreate(
                ['slug' => $slug],
                [
                    'title' => $article['title'],
                    'slug' => $slug,
                    'excerpt' => $article['excerpt'],
                    'content' => $article['content'],
                    'category_id' => $category?->id,
                    'author_id' => $author->id,
                    'status' => $article['status'],
                    'is_featured' => $article['is_featured'] ?? false,
                    'views_count' => rand(10, 500),
                    'helpful_count' => rand(5, 100),
                    'not_helpful_count' => rand(0, 10),
                    'sort_order' => 0,
                    'published_at' => $article['published_at'] ?? now(),
                ]
            );
        }
    }
}
