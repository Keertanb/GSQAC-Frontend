import {
  Dashboard,
  Assessment,
  People,
  School,
  Settings,
  Feedback,
  ReportProblem,
  Assignment,
  CheckCircle,
  List,
  VerifiedUser,
  Business,
  AccountCircle,
} from "@mui/icons-material";

const DRAWER_WIDTH = {
  xs: 280,
  xl: 320,
};

// School Menu Items
export const schoolMenuItems = [
  //   {
  //     id: "dashboard",
  //     label: "Dashboard",
  //     icon: Dashboard,
  //     url: "/school-dashboard",
  //     activeFinder: ["/school-dashboard"],
  //   },
  {
    id: "school-details",
    label: "School Details",
    icon: School,
    url: "/school-dashboard/school-details",
    activeFinder: ["/school-dashboard/school-details"],
  },
  {
    id: "self-assessment",
    label: "Self-Assessment",
    icon: Assessment,
    url: "/school-dashboard/self-assessment",
    activeFinder: ["/school-dashboard/self-assessment"],
  },
  //   {
  //     id: "students",
  //     label: "Student Management",
  //     icon: People,
  //     url: "/school-dashboard/students",
  //     activeFinder: ["/school-dashboard/students"],
  //   },
  //   {
  //     id: "reports",
  //     label: "Reports",
  //     icon: Assessment,
  //     url: "/school-dashboard/reports",
  //     activeFinder: ["/school-dashboard/reports"],
  //   },
  //   {
  //     id: "settings",
  //     label: "Settings",
  //     icon: Settings,
  //     url: "/school-dashboard/settings",
  //     activeFinder: ["/school-dashboard/settings"],
  //   },
];

// Parent Menu Items
export const parentMenuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: Dashboard,
    url: "/parent-dashboard",
    activeFinder: ["/parent-dashboard"],
  },
  {
    id: "school-info",
    label: "School Information",
    icon: School,
    url: "/parent-dashboard/school-info",
    activeFinder: ["/parent-dashboard/school-info"],
  },
  {
    id: "feedback",
    label: "Feedback",
    icon: Feedback,
    url: "/parent-dashboard/feedback",
    activeFinder: ["/parent-dashboard/feedback"],
  },
  {
    id: "grievance",
    label: "Grievance",
    icon: ReportProblem,
    url: "/parent-dashboard/grievance",
    activeFinder: ["/parent-dashboard/grievance"],
  },
];

// Inspector Menu Items
export const inspectorMenuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: Dashboard,
    url: "/inspector-dashboard",
    activeFinder: ["/inspector-dashboard"],
  },
  {
    id: "pending",
    label: "Pending Inspections",
    icon: List,
    url: "/inspector-dashboard/pending",
    activeFinder: ["/inspector-dashboard/pending"],
  },
  {
    id: "verification",
    label: "Verification Tasks",
    icon: Assignment,
    url: "/inspector-dashboard/verification",
    activeFinder: ["/inspector-dashboard/verification"],
  },
  {
    id: "completed",
    label: "Completed Reports",
    icon: CheckCircle,
    url: "/inspector-dashboard/completed",
    activeFinder: ["/inspector-dashboard/completed"],
  },
];

// Admin Menu Items
export const adminMenuItems = [
  // {
  //   id: "dashboard",
  //   label: "Dashboard",
  //   icon: Dashboard,
  //   url: "/admin-dashboard",
  //   activeFinder: ["/admin-dashboard"],
  // },
  {
    id: "verifier",
    label: "Verifier",
    icon: VerifiedUser,
    url: "/admin-dashboard/verifier",
    activeFinder: ["/admin-dashboard/verifier"],
  },
  {
    id: "assessment-management",
    label: "Assessment Management",
    icon: Assessment,
    url: "/admin-dashboard/assessment-management",
    activeFinder: ["/admin-dashboard/assessment-management"],
  },
  {
    id: "school-allocation",
    label: "School Allocation",
    icon: Business,
    url: "/admin-dashboard/school-allocation",
    activeFinder: ["/admin-dashboard/school-allocation"],
  },
  {
    id: "district-nodal-officers",
    label: "District Nodal Officers",
    icon: AccountCircle,
    url: "/admin-dashboard/district-nodal-officers",
    activeFinder: ["/admin-dashboard/district-nodal-officers"],
  },
];

export { DRAWER_WIDTH };
