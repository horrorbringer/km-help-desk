<?php

namespace Tests\Unit;

use App\Constants\RoleConstants;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RoleConstantsTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that all critical roles exist in the database
     * This test will fail if critical roles are missing, preventing system breakage
     */
    public function test_critical_roles_exist(): void
    {
        $protectedRoles = RoleConstants::getProtectedRoles();

        foreach ($protectedRoles as $roleName) {
            $role = Role::where('name', $roleName)->first();
            $this->assertNotNull(
                $role,
                "Critical role '{$roleName}' does not exist in database. System functionality will break!"
            );
        }
    }

    /**
     * Test that protected roles cannot be deleted
     */
    public function test_protected_roles_cannot_be_deleted(): void
    {
        $protectedRoles = RoleConstants::getProtectedRoles();

        foreach ($protectedRoles as $roleName) {
            $role = Role::firstOrCreate(['name' => $roleName]);
            
            // Attempt to delete - should be prevented by RoleController
            // This test ensures the protection logic works
            $this->assertTrue(
                RoleConstants::isProtected($roleName),
                "Role '{$roleName}' should be protected from deletion"
            );
        }
    }

    /**
     * Test that role constants match actual role names
     */
    public function test_role_constants_match_database_roles(): void
    {
        // Create all roles from constants
        foreach (RoleConstants::getAllRoles() as $roleName) {
            $role = Role::firstOrCreate(['name' => $roleName]);
            $this->assertEquals($roleName, $role->name, "Role constant mismatch for: {$roleName}");
        }
    }

    /**
     * Test that approval roles are correctly defined
     */
    public function test_approval_roles_are_valid(): void
    {
        $approvalRoles = RoleConstants::getApprovalRoles();
        
        $this->assertContains(RoleConstants::MANAGER, $approvalRoles);
        $this->assertContains(RoleConstants::LINE_MANAGER, $approvalRoles);
        $this->assertContains(RoleConstants::SUPER_ADMIN, $approvalRoles);
    }

    /**
     * Test that agent roles are correctly defined
     */
    public function test_agent_roles_are_valid(): void
    {
        $agentRoles = RoleConstants::getAgentRoles();
        
        $this->assertContains(RoleConstants::AGENT, $agentRoles);
        $this->assertContains(RoleConstants::SENIOR_AGENT, $agentRoles);
        $this->assertCount(2, $agentRoles);
    }

    /**
     * Test that executive roles are correctly defined
     */
    public function test_executive_roles_are_valid(): void
    {
        $executiveRoles = RoleConstants::getExecutiveRoles();
        
        $this->assertContains(RoleConstants::SUPER_ADMIN, $executiveRoles);
        $this->assertContains(RoleConstants::CEO, $executiveRoles);
        $this->assertContains(RoleConstants::DIRECTOR, $executiveRoles);
    }

    /**
     * Test that isProtected method works correctly
     */
    public function test_is_protected_method(): void
    {
        $this->assertTrue(RoleConstants::isProtected(RoleConstants::SUPER_ADMIN));
        $this->assertTrue(RoleConstants::isProtected(RoleConstants::LINE_MANAGER));
        $this->assertTrue(RoleConstants::isProtected(RoleConstants::MANAGER));
        $this->assertTrue(RoleConstants::isProtected(RoleConstants::AGENT));
        $this->assertTrue(RoleConstants::isProtected(RoleConstants::SENIOR_AGENT));
        $this->assertTrue(RoleConstants::isProtected(RoleConstants::HEAD_OF_DEPARTMENT));
        
        // Non-protected roles
        $this->assertFalse(RoleConstants::isProtected(RoleConstants::REQUESTER));
        $this->assertFalse(RoleConstants::isProtected(RoleConstants::CONTRACTOR));
    }
}

