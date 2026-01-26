<?php

namespace App\Constants;

/**
 * Approval Level Constants
 * 
 * Defines approval levels for ticket approval workflows.
 * 
 * IMPORTANT: These are the default approval levels. The system supports
 * dynamic approval levels through workflow templates, but these constants
 * provide backward compatibility and common defaults.
 * 
 * Approval levels map to roles:
 * - 'lm' → Line Manager (with DLM fallback)
 * - 'dlm' → Deputy Line Manager (explicit, not fallback)
 * - 'hod' → Head of Department (with DHOD fallback)
 * - 'dhod' → Deputy Head of Department (explicit, not fallback)
 * - 'ceo' → CEO (with Director fallback)
 * - 'dceo' → Deputy CEO (explicit, not fallback)
 * - Custom levels can be added via workflow templates
 */
class ApprovalLevelConstants
{
    // Standard approval levels (backward compatible)
    public const LINE_MANAGER = 'lm';
    public const HEAD_OF_DEPARTMENT = 'hod';
    public const CEO = 'ceo';

    // Deputy/Explicit approval levels (for companies that want separate approval)
    public const DEPUTY_LINE_MANAGER = 'dlm';
    public const DEPUTY_HEAD_OF_DEPARTMENT = 'dhod';
    public const DEPUTY_CEO = 'dceo';

    // Extended approval levels (for future expansion)
    public const DIRECTOR = 'director';
    public const FINANCE_MANAGER = 'finance_manager';
    public const PROCUREMENT_MANAGER = 'procurement_manager';
    public const IT_MANAGER = 'it_manager';

    /**
     * Get all default approval levels
     * 
     * @return array<string>
     */
    public static function getDefaultLevels(): array
    {
        return [
            self::LINE_MANAGER,
            self::DEPUTY_LINE_MANAGER,
            self::HEAD_OF_DEPARTMENT,
            self::DEPUTY_HEAD_OF_DEPARTMENT,
            self::CEO,
            self::DEPUTY_CEO,
        ];
    }

    /**
     * Get standard approval levels (backward compatible)
     * 
     * @return array<string>
     */
    public static function getStandardLevels(): array
    {
        return [
            self::LINE_MANAGER,
            self::HEAD_OF_DEPARTMENT,
            self::CEO,
        ];
    }

    /**
     * Get deputy/explicit approval levels
     * 
     * @return array<string>
     */
    public static function getDeputyLevels(): array
    {
        return [
            self::DEPUTY_LINE_MANAGER,
            self::DEPUTY_HEAD_OF_DEPARTMENT,
            self::DEPUTY_CEO,
        ];
    }

    /**
     * Get all available approval levels (defaults + extended)
     * 
     * @return array<string>
     */
    public static function getAllLevels(): array
    {
        return array_merge(
            self::getDefaultLevels(),
            [
                self::DIRECTOR,
                self::FINANCE_MANAGER,
                self::PROCUREMENT_MANAGER,
                self::IT_MANAGER,
            ]
        );
    }

    /**
     * Get approval level label for display
     * 
     * @param string $level
     * @return string
     */
    public static function getLabel(string $level): string
    {
        return match ($level) {
            self::LINE_MANAGER => 'Line Manager',
            self::DEPUTY_LINE_MANAGER => 'Deputy Line Manager',
            self::HEAD_OF_DEPARTMENT => 'Head of Department',
            self::DEPUTY_HEAD_OF_DEPARTMENT => 'Deputy Head of Department',
            self::CEO => 'CEO',
            self::DEPUTY_CEO => 'Deputy CEO',
            self::DIRECTOR => 'Director',
            self::FINANCE_MANAGER => 'Finance Manager',
            self::PROCUREMENT_MANAGER => 'Procurement Manager',
            self::IT_MANAGER => 'IT Manager',
            default => ucfirst(str_replace('_', ' ', $level)),
        };
    }

    /**
     * Get role name(s) that correspond to an approval level
     * 
     * @param string $level
     * @return array<string> Array of role names (primary and fallback)
     */
    public static function getRolesForLevel(string $level): array
    {
        return match ($level) {
            self::LINE_MANAGER => [
                RoleConstants::LINE_MANAGER,
                RoleConstants::DEPUTY_LINE_MANAGER, // Fallback
            ],
            self::DEPUTY_LINE_MANAGER => [
                RoleConstants::DEPUTY_LINE_MANAGER,
            ],
            self::HEAD_OF_DEPARTMENT => [
                RoleConstants::HEAD_OF_DEPARTMENT,
                RoleConstants::DEPUTY_HEAD_OF_DEPARTMENT, // Fallback
            ],
            self::DEPUTY_HEAD_OF_DEPARTMENT => [
                RoleConstants::DEPUTY_HEAD_OF_DEPARTMENT,
            ],
            self::CEO => [
                RoleConstants::CEO,
                RoleConstants::DIRECTOR, // Fallback
            ],
            self::DEPUTY_CEO => [
                // If Deputy CEO role exists, add it here
                RoleConstants::DIRECTOR,
            ],
            self::DIRECTOR => [
                RoleConstants::DIRECTOR,
            ],
            self::FINANCE_MANAGER => [
                RoleConstants::FINANCE_MANAGER,
            ],
            self::PROCUREMENT_MANAGER => [
                RoleConstants::PROCUREMENT_MANAGER,
            ],
            self::IT_MANAGER => [
                RoleConstants::IT_MANAGER,
            ],
            default => [
                // For custom levels, try to match by name
                ucfirst(str_replace('_', ' ', $level)),
            ],
        };
    }

    /**
     * Check if an approval level is valid
     * 
     * @param string $level
     * @return bool
     */
    public static function isValid(string $level): bool
    {
        // Accept any level - dynamic system allows custom levels
        // But validate format (alphanumeric, underscore, hyphen)
        return (bool) preg_match('/^[a-z0-9_-]+$/', $level);
    }

    /**
     * Get approval level options for forms/UI
     * 
     * @return array<array{value: string, label: string}>
     */
    public static function getOptions(): array
    {
        return array_map(function ($level) {
            return [
                'value' => $level,
                'label' => self::getLabel($level),
            ];
        }, self::getDefaultLevels());
    }

    /**
     * Get approval level hierarchy (for determining sequence)
     * Lower number = earlier in approval chain
     * 
     * @param string $level
     * @return int
     */
    public static function getHierarchyOrder(string $level): int
    {
        return match ($level) {
            self::LINE_MANAGER => 1,
            self::DEPUTY_LINE_MANAGER => 1, // Same level as LM
            self::HEAD_OF_DEPARTMENT => 2,
            self::DEPUTY_HEAD_OF_DEPARTMENT => 2, // Same level as HOD
            self::CEO => 3,
            self::DEPUTY_CEO => 3, // Same level as CEO
            self::DIRECTOR => 3, // Same level as CEO
            default => 99, // Custom levels - workflow template defines order
        };
    }
}

