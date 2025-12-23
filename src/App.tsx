
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Employees } from './pages/Employees';
import { Attendance } from './pages/Attendance';
import { Salary } from './pages/Salary';
import { Documents } from './pages/Documents';
import { Layout } from './components/Layout';
import LeaveApplication from './pages/LeaveApplication';
import Profile from './pages/Profile';


function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={
              <PrivateRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="employees" element={<Employees />} />
                    <Route path="attendance" element={<Attendance />} />
                    <Route path="salary" element={<Salary />} />
                    <Route path="documents" element={<Documents />} />
                    <Route path="LeaveApplication" element={<LeaveApplication />} />
                    <Route path="profile" element={<Profile/>} />
                  </Routes>
                </Layout>
              </PrivateRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;