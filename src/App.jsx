import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/dashboard/dashboard";
import Login from "./pages/login/login";
import OtpVerify from "./pages/otp-verify/otp-verify";
import SchoolDashboard from "./pages/school-dashboard/school-dashboard";
import ParentDashboard from "./pages/parent-dashboard/parent-dashboard";
import InspectorDashboard from "./pages/inspector-dashboard/inspector-dashboard";
import AdminDashboard from "./pages/admin-dashboard/admin-dashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/otp-verify" element={<OtpVerify />} />
        <Route path="/school-dashboard" element={<SchoolDashboard />} />
        <Route path="/parent-dashboard" element={<ParentDashboard />} />
        <Route path="/inspector-dashboard" element={<InspectorDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
