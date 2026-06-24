// Public Routes
export const ROOT_URL = "/";
export const LOGIN_URL = "/login";
export const OTP_VERIFY_URL = "/otp-verify";

// Dashboard Routes
export const SCHOOL_DASHBOARD_URL = "/school-dashboard";
export const SCHOOL_DETAILS_URL = "/school-dashboard/school-details";
export const SCHOOL_SELF_ASSESSMENT_URL = "/school-dashboard/self-assessment";
export const SCHOOL_REPORT_GENERATION_URL = "/school-dashboard/report-generation";
export const PARENT_DASHBOARD_URL = "/parent-dashboard";
export const INSPECTOR_DASHBOARD_URL = "/inspector-dashboard";
export const ADMIN_DASHBOARD_URL = "/admin-dashboard";

// Inspector Dashboard Sub-routes
export const INSPECTOR_ALLOCATED_SCHOOLS_URL = "/inspector-dashboard/allocated-schools";
export const INSPECTOR_SCHOOL_VERIFICATION_URL = "/inspector-dashboard/school-verification";
export const INSPECTOR_COMPLETED_URL = "/inspector-dashboard/completed";

// Admin Dashboard Sub-routes
export const ADMIN_VERIFIER_URL = "/admin-dashboard/verifier";
export const ADMIN_ASSESSMENT_MANAGEMENT_URL = "/admin-dashboard/assessment-management";
export const ADMIN_SCHOOL_ALLOCATION_URL = "/admin-dashboard/school-allocation";
export const ADMIN_SCHOOL_ASSESSMENT_STATUS_URL =
  "/admin-dashboard/school-assessment-status";
export const ADMIN_DISTRICT_NODAL_OFFICERS_URL = "/admin-dashboard/district-nodal-officers";
export const ADMIN_ROLE_MANAGEMENT_URL = "/admin-dashboard/role-management";

// CRC Dashboard Routes
export const CRC_DASHBOARD_URL = "/crc-dashboard";
export const CRC_SCHOOL_ASSESSMENT_URL = "/crc-dashboard/school-assessment";
export const CRC_SCHOOL_ASSESSMENT_DETAIL_URL = "/crc-dashboard/school-assessment/:schoolId";

export const WILDCARD_URL = "*";
