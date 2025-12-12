/**
 * Centralized role name constants for frontend
 * 
 * IMPORTANT: These role names are hardcoded throughout the system.
 * Changing these values will break functionality. Always use these constants
 * instead of hardcoded strings.
 * 
 * @see ROLE_DEPENDENCIES_ANALYSIS.md for dependency details
 */

// Executive Level
export const SUPER_ADMIN = 'Super Admin';
export const CEO = 'CEO';
export const DIRECTOR = 'Director';
export const HEAD_OF_DEPARTMENT = 'Head of Department';

// Management Level
export const IT_MANAGER = 'IT Manager';
export const OPERATIONS_MANAGER = 'Operations Manager';
export const FINANCE_MANAGER = 'Finance Manager';
export const HR_MANAGER = 'HR Manager';
export const PROCUREMENT_MANAGER = 'Procurement Manager';
export const SAFETY_MANAGER = 'Safety Manager';
export const LINE_MANAGER = 'Line Manager';
export const MANAGER = 'Manager';
export const PROJECT_MANAGER = 'Project Manager';

// Operations Level
export const IT_ADMINISTRATOR = 'IT Administrator';
export const SENIOR_AGENT = 'Senior Agent';
export const AGENT = 'Agent';

// User Level
export const REQUESTER = 'Requester';
export const CONTRACTOR = 'Contractor';

/**
 * Get all critical roles that cannot be deleted or renamed
 */
export const getProtectedRoles = (): string[] => {
  return [
    SUPER_ADMIN,
    LINE_MANAGER,
    MANAGER,
    AGENT,
    SENIOR_AGENT,
    HEAD_OF_DEPARTMENT,
  ];
};

/**
 * Get all executive roles
 */
export const getExecutiveRoles = (): string[] => {
  return [
    SUPER_ADMIN,
    CEO,
    DIRECTOR,
  ];
};

/**
 * Get all management roles
 */
export const getManagementRoles = (): string[] => {
  return [
    IT_MANAGER,
    OPERATIONS_MANAGER,
    FINANCE_MANAGER,
    HR_MANAGER,
    PROCUREMENT_MANAGER,
    SAFETY_MANAGER,
    LINE_MANAGER,
    MANAGER,
    PROJECT_MANAGER,
  ];
};

/**
 * Get all agent roles
 */
export const getAgentRoles = (): string[] => {
  return [
    AGENT,
    SENIOR_AGENT,
  ];
};

/**
 * Check if a role is protected (cannot be deleted/renamed)
 */
export const isProtectedRole = (roleName: string): boolean => {
  return getProtectedRoles().includes(roleName);
};

