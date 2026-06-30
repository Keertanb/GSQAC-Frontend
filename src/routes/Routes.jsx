import { lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";
import * as ROUTE_URLS from "./routeUrls";
import LazyLoad from "../components/LazyLoad/LazyLoad";
import ProtectedRoute from "../components/ProtectedRoute/ProtectedRoute";
import PublicRoute from "../components/PublicRoute/PublicRoute";

const Dashboard = lazy(() => import("../pages/dashboard/dashboard"));
const Login = lazy(() => import("../pages/login/login"));
const OtpVerify = lazy(() => import("../pages/otp-verify/otp-verify"));

const SchoolDashboard = lazy(() =>
  import("../pages/school-dashboard/school-dashboard")
);
const SchoolDetails = lazy(() =>
  import("../pages/school-dashboard/school-details/SchoolDetails")
);
const SelfAssessment = lazy(() =>
  import("../pages/school-dashboard/self-assessment/SelfAssessment")
);
const ReportGeneration = lazy(() =>
  import("../pages/school-dashboard/report-generation/ReportGeneration")
);
const ParentDashboard = lazy(() =>
  import("../pages/parent-dashboard/parent-dashboard")
);
const InspectorDashboard = lazy(() =>
  import("../pages/inspector-dashboard/inspector-dashboard")
);
const AdminDashboard = lazy(() =>
  import("../pages/admin-dashboard/admin-dashboard")
);
const CRCDashboard = lazy(() =>
  import("../pages/crc-dashboard/crc-dashboard")
);
const CRCAssessment = lazy(() =>
  import("../pages/crc-dashboard/school-assessment/CRCAssessment")
);

export const publicRoutes = [
  {
    path: ROUTE_URLS.ROOT_URL,
    children: [
      {
        path: ROUTE_URLS.ROOT_URL,
        element: (
          <PublicRoute>
          <Suspense fallback={<LazyLoad />}>
            <Dashboard />
          </Suspense>
          </PublicRoute>
        ),
      },
      {
        path: ROUTE_URLS.LOGIN_URL,
        element: (
          <PublicRoute>
            <Suspense fallback={<LazyLoad />}>
              <Login />
            </Suspense>
          </PublicRoute>
        ),
      },
      {
        path: ROUTE_URLS.OTP_VERIFY_URL,
        element: (
          <PublicRoute>
            <Suspense fallback={<LazyLoad />}>
              <OtpVerify />
            </Suspense>
          </PublicRoute>
        ),
      },
    ],
  },
  {
    path: ROUTE_URLS.WILDCARD_URL,
    element: <Navigate to={ROUTE_URLS.ROOT_URL} replace />,
  },
];

// SCHOOL ROUTES
export const schoolRoutes = [
  {
    path: ROUTE_URLS.ROOT_URL,
    children: [
      {
        path: ROUTE_URLS.SCHOOL_DASHBOARD_URL,
        element: (
          <ProtectedRoute requiredRole="school">
            <Suspense fallback={<LazyLoad />}>
              <SchoolDashboard />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTE_URLS.SCHOOL_DETAILS_URL,
        element: (
          <ProtectedRoute requiredRole="school">
            <Suspense fallback={<LazyLoad />}>
              <SchoolDetails />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTE_URLS.SCHOOL_SELF_ASSESSMENT_URL,
        element: (
          <ProtectedRoute requiredRole="school">
            <Suspense fallback={<LazyLoad />}>
              <SelfAssessment />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTE_URLS.SCHOOL_REPORT_GENERATION_URL,
        element: (
          <ProtectedRoute requiredRole="school">
            <Suspense fallback={<LazyLoad />}>
              <ReportGeneration />
            </Suspense>
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: ROUTE_URLS.WILDCARD_URL,
    element: <Navigate to={ROUTE_URLS.SCHOOL_DASHBOARD_URL} replace />,
  },
];

// PARENT ROUTES
export const parentRoutes = [
  {
    path: ROUTE_URLS.ROOT_URL,
    children: [
      {
        path: ROUTE_URLS.PARENT_DASHBOARD_URL,
        element: (
          <ProtectedRoute requiredRole="parent">
            <Suspense fallback={<LazyLoad />}>
              <ParentDashboard />
            </Suspense>
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: ROUTE_URLS.WILDCARD_URL,
    element: <Navigate to={ROUTE_URLS.PARENT_DASHBOARD_URL} replace />,
  },
];

// INSPECTOR ROUTES
export const inspectorRoutes = [
  {
    path: ROUTE_URLS.ROOT_URL,
    children: [
      {
        path: ROUTE_URLS.INSPECTOR_DASHBOARD_URL,
        element: (
          <ProtectedRoute requiredRole="inspector">
            <Suspense fallback={<LazyLoad />}>
              <InspectorDashboard />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTE_URLS.INSPECTOR_ALLOCATED_SCHOOLS_URL,
        element: (
          <ProtectedRoute requiredRole="inspector">
            <Suspense fallback={<LazyLoad />}>
              <InspectorDashboard />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTE_URLS.INSPECTOR_SCHOOL_VERIFICATION_URL,
        element: (
          <ProtectedRoute requiredRole="inspector">
            <Suspense fallback={<LazyLoad />}>
              <InspectorDashboard />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTE_URLS.INSPECTOR_COMPLETED_URL,
        element: (
          <ProtectedRoute requiredRole="inspector">
            <Suspense fallback={<LazyLoad />}>
              <InspectorDashboard />
            </Suspense>
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: ROUTE_URLS.WILDCARD_URL,
    element: <Navigate to={ROUTE_URLS.INSPECTOR_DASHBOARD_URL} replace />,
  },
];

// ADMIN ROUTES
export const adminRoutes = [
  {
    path: ROUTE_URLS.ROOT_URL,
    children: [
      {
        path: ROUTE_URLS.ADMIN_DASHBOARD_URL,
        element: (
          <ProtectedRoute requiredRole="admin">
            <Suspense fallback={<LazyLoad />}>
              <AdminDashboard />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTE_URLS.ADMIN_VERIFIER_URL,
        element: (
          <ProtectedRoute requiredRole="admin">
            <Suspense fallback={<LazyLoad />}>
              <AdminDashboard />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTE_URLS.ADMIN_ASSESSMENT_MANAGEMENT_URL,
        element: (
          <ProtectedRoute requiredRole="admin">
            <Suspense fallback={<LazyLoad />}>
              <AdminDashboard />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTE_URLS.ADMIN_SCHOOL_ALLOCATION_URL,
        element: (
          <ProtectedRoute requiredRole="admin">
            <Suspense fallback={<LazyLoad />}>
              <AdminDashboard />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTE_URLS.ADMIN_SCHOOL_ASSESSMENT_STATUS_URL,
        element: (
          <ProtectedRoute requiredRole="admin">
            <Suspense fallback={<LazyLoad />}>
              <AdminDashboard />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTE_URLS.ADMIN_DISTRICT_NODAL_OFFICERS_URL,
        element: (
          <ProtectedRoute requiredRole="admin">
            <Suspense fallback={<LazyLoad />}>
              <AdminDashboard />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTE_URLS.ADMIN_ROLE_MANAGEMENT_URL,
        element: (
          <ProtectedRoute requiredRole="admin">
            <Suspense fallback={<LazyLoad />}>
              <AdminDashboard />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTE_URLS.ADMIN_PARENT_FEEDBACK_URL,
        element: (
          <ProtectedRoute requiredRole="admin">
            <Suspense fallback={<LazyLoad />}>
              <AdminDashboard />
            </Suspense>
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: ROUTE_URLS.WILDCARD_URL,
    element: <Navigate to={ROUTE_URLS.ADMIN_DASHBOARD_URL} replace />,
  },
];

// CRC ROUTES
export const crcRoutes = [
  {
    path: ROUTE_URLS.ROOT_URL,
    children: [
      {
        path: ROUTE_URLS.CRC_DASHBOARD_URL,
        element: (
          <ProtectedRoute requiredRole="crc">
            <Suspense fallback={<LazyLoad />}>
              <CRCDashboard />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTE_URLS.CRC_SCHOOL_ASSESSMENT_URL,
        element: (
          <ProtectedRoute requiredRole="crc">
            <Suspense fallback={<LazyLoad />}>
              <CRCDashboard />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTE_URLS.CRC_SCHOOL_ASSESSMENT_DETAIL_URL,
        element: (
          <ProtectedRoute requiredRole="crc">
            <Suspense fallback={<LazyLoad />}>
              <CRCDashboard />
            </Suspense>
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: ROUTE_URLS.WILDCARD_URL,
    element: <Navigate to={ROUTE_URLS.CRC_DASHBOARD_URL} replace />,
  },
];
