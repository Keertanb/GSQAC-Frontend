export const roles = [
  {
    value: "school",
    label: "School",
    description: "School administration login",
    authMethod: "UDISE Code",
    color: "#1e3a8a",
    dashboardRoute: "/school-dashboard",
  },
  {
    value: "parent",
    label: "Parent/Guardian",
    description: "Feedback & grievance portal",
    authMethod: "Mobile Number",
    color: "#f97316",
    dashboardRoute: "/parent-dashboard",
  },
  {
    value: "inspector",
    label: "School Inspector",
    description: "Verification & inspection",
    authMethod: "Employee ID",
    color: "#10b981",
    dashboardRoute: "/inspector-dashboard",
  },
  {
    value: "admin",
    label: "GSQAC Admin",
    description: "Administrative dashboard",
    authMethod: "Admin ID",
    color: "#1e3a8a",
    dashboardRoute: "/admin-dashboard",
  },
];

export const getRoleByValue = (value) => {
  return roles.find((role) => role.value === value);
};

export default roles;

