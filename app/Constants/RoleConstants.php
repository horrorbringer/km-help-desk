<?php

namespace App\Constants;

/**
 * Centralized role name constants
 * 
 * IMPORTANT: These role names are hardcoded throughout the system.
 * Changing these values will break functionality. Always use these constants
 * instead of hardcoded strings.
 * 
 * @see ROLE_DEPENDENCIES_ANALYSIS.md for dependency details
 */
class RoleConstants
{
    // Executive Level
    public const SUPER_ADMIN = 'Super Admin';
    public const CEO = 'CEO';
    public const DIRECTOR = 'Director';
    public const HEAD_OF_DEPARTMENT = 'Head of Department';

    // Management Level
    public const IT_MANAGER = 'IT Manager';
    public const OPERATIONS_MANAGER = 'Operations Manager';
    public const FINANCE_MANAGER = 'Finance Manager';
    public const HR_MANAGER = 'HR Manager';
    public const PROCUREMENT_MANAGER = 'Procurement Manager';
    public const SAFETY_MANAGER = 'Safety Manager';
    public const LINE_MANAGER = 'Line Manager';
    public const MANAGER = 'Manager';
    public const PROJECT_MANAGER = 'Project Manager';

    // Operations Level
    public const IT_ADMINISTRATOR = 'IT Administrator';
    public const SENIOR_AGENT = 'Senior Agent';
    public const AGENT = 'Agent';

    // User Level
    public const REQUESTER = 'Requester';
    public const CONTRACTOR = 'Contractor';

    /**
     * Get all critical roles that cannot be deleted or renamed
     * 
     * @return array<string>
     */
    public static function getProtectedRoles(): array
    {
        return [
            self::SUPER_ADMIN,
            self::LINE_MANAGER,
            self::MANAGER,
            self::AGENT,
            self::SENIOR_AGENT,
            self::HEAD_OF_DEPARTMENT,
        ];
    }

    /**
     * Get all executive roles
     * 
     * @return array<string>
     */
    public static function getExecutiveRoles(): array
    {
        return [
            self::SUPER_ADMIN,
            self::CEO,
            self::DIRECTOR,
        ];
    }

    /**
     * Get all management roles
     * 
     * @return array<string>
     */
    public static function getManagementRoles(): array
    {
        return [
            self::IT_MANAGER,
            self::OPERATIONS_MANAGER,
            self::FINANCE_MANAGER,
            self::HR_MANAGER,
            self::PROCUREMENT_MANAGER,
            self::SAFETY_MANAGER,
            self::LINE_MANAGER,
            self::MANAGER,
            self::PROJECT_MANAGER,
        ];
    }

    /**
     * Get all agent roles
     * 
     * @return array<string>
     */
    public static function getAgentRoles(): array
    {
        return [
            self::AGENT,
            self::SENIOR_AGENT,
        ];
    }

    /**
     * Get all approval roles (for approval workflow)
     * 
     * @return array<string>
     */
    public static function getApprovalRoles(): array
    {
        return [
            self::MANAGER,
            self::LINE_MANAGER,
            self::SUPER_ADMIN,
        ];
    }

    /**
     * Check if a role is protected (cannot be deleted/renamed)
     * 
     * @param string $roleName
     * @return bool
     */
    public static function isProtected(string $roleName): bool
    {
        return in_array($roleName, self::getProtectedRoles(), true);
    }

    /**
     * Get all role names
     * 
     * @return array<string>
     */
    public static function getAllRoles(): array
    {
        return [
            // Executive
            self::SUPER_ADMIN,
            self::CEO,
            self::DIRECTOR,
            self::HEAD_OF_DEPARTMENT,
            // Management
            self::IT_MANAGER,
            self::OPERATIONS_MANAGER,
            self::FINANCE_MANAGER,
            self::HR_MANAGER,
            self::PROCUREMENT_MANAGER,
            self::SAFETY_MANAGER,
            self::LINE_MANAGER,
            self::MANAGER,
            self::PROJECT_MANAGER,
            // Operations
            self::IT_ADMINISTRATOR,
            self::SENIOR_AGENT,
            self::AGENT,
            // User
            self::REQUESTER,
            self::CONTRACTOR,
        ];
    }
}

