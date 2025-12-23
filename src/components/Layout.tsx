import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Users,
  Clock,
  DollarSign,
  FileText,
  LayoutDashboard,
  Menu,
  X,
  User,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

interface SalaryStats {
  totalPaid: number;
  totalPending: number;
  averageSalary: number;
  totalRecords: number;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [salaryStats, setSalaryStats] = useState<SalaryStats | null>(null);
  const { signOut, user, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // API base URL
  const API_BASE_URL = 'http://localhost:5001/api';

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, adminOnly: true },
    { name: 'Employees', href: '/employees', icon: Users, adminOnly: true },
    { name: 'Attendance', href: '/attendance', icon: Clock },
    { name: 'Salary', href: '/Salary', icon: DollarSign },
    { name: 'Documents', href: '/documents', icon: FileText },
    { name: 'LeaveApplication', href: '/LeaveApplication', icon: Calendar },
     { name: 'Profile', href: '/profile', icon: User, employeeOnly: true },
  ];

  const handleSignOut = () => {
    signOut();
    navigate('/login');
  };

  const filteredNavigation = navigation.filter(
    (item) => (!item.adminOnly || (item.adminOnly && isAdmin)) && (!item.employeeOnly || (item.employeeOnly && !isAdmin))
  );

  // Load salary stats for employees and admins
  const loadSalaryStats = async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/salaries/stats/employee`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSalaryStats(data.data);
      } else {
        const errorData = await response.json();
        console.error('Error loading salary stats:', errorData.error);
      }
    } catch (error) {
      console.error('Error loading salary stats:', error);
    }
  };

  useEffect(() => {
    loadSalaryStats();

    // Listen for salary updates to refresh stats
    const handleSalaryUpdate = () => {
      loadSalaryStats();
    };

    window.addEventListener('salaryUpdated', handleSalaryUpdate);

    return () => {
      window.removeEventListener('salaryUpdated', handleSalaryUpdate);
    };
  }, [user, isAdmin]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          sidebarOpen ? 'block' : 'hidden'
        }`}
      >
        <div
          className="fixed inset-0 bg-gray-900/50"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed top-0 left-0 w-64 h-full bg-gray-800 text-white shadow-xl flex flex-col">
          {/* Sidebar header */}
          <div className="bg-teal-600 h-16 flex items-center justify-center relative">
            <h2 className="text-lg font-pacifico">
              <span className="text-xl">Employee</span>{' '}
              <span className="text-2xl font-bold">MS</span>
            </h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute right-3 p-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 mt-4 space-y-1">
            {filteredNavigation.map((item) => {
              const isActive =
                item.href === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`block w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-teal-700 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Salary Section */}
          {salaryStats && (
            <div className="p-4 border-t border-gray-700">
              <div className="flex items-center space-x-2 mb-3">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium text-white">Salary Overview</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300">Total Paid:</span>
                  <span className="text-green-400 font-medium">₹{salaryStats.totalPaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300">Pending:</span>
                  <span className="text-yellow-400 font-medium">₹{salaryStats.totalPending.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300">Average:</span>
                  <span className="text-blue-400 font-medium">₹{Math.round(salaryStats.averageSalary).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300">Records:</span>
                  <span className="text-purple-400 font-medium">{salaryStats.totalRecords}</span>
                </div>
              </div>
            </div>
          )}

          {/* Salary Section */}
          {salaryStats && (
            <div className="p-4 border-t border-gray-700">
              <div className="flex items-center space-x-2 mb-3">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium text-white">Salary Overview</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300">Total Paid:</span>
                  <span className="text-green-400 font-medium">${salaryStats.totalPaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300">Pending:</span>
                  <span className="text-yellow-400 font-medium">${salaryStats.totalPending.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300">Average:</span>
                  <span className="text-blue-400 font-medium">${Math.round(salaryStats.averageSalary).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300">Records:</span>
                  <span className="text-purple-400 font-medium">{salaryStats.totalRecords}</span>
                </div>
              </div>
            </div>
          )}

          {/* Profile at bottom */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-gray-300">{user?.email}</div>
              </div>
            </div>
            {isAdmin && (
              <span className="mt-2 inline-block px-2 py-0.5 text-xs font-medium bg-white/20 rounded">
                Admin
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:fixed lg:w-64 lg:left-0 lg:top-0 lg:bottom-0 z-30">
        <div className="flex flex-col w-64 bg-gray-800 text-white h-full">
          {/* Sidebar header */}
          <div className="bg-teal-600 h-16 flex items-center justify-center">
            <h2 className="text-lg font-pacifico">
              <span className="text-xl">Employee</span>{' '}
              <span className="text-2xl font-bold">MS</span>
            </h2>
          </div>

          {/* Nav links */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 py-4 space-y-9">
              {filteredNavigation.map((item) => {
                const isActive =
                  item.href === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`block w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-teal-700 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Profile at bottom */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-gray-300">{user?.email}</div>
              </div>
            </div>
            {isAdmin && (
              <span className="mt-2 inline-block px-2 py-0.5 text-xs font-medium bg-white/20 rounded">
                Admin
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 min-h-screen lg:ml-64">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 h-16 bg-teal-600 z-20 shadow-sm">
          <div className="flex items-center justify-between h-full px-4 lg:px-6 lg:pl-64">
            {/* Mobile menu button */}
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-md hover:bg-teal-700 lg:hidden transition-colors text-white"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-white font-pacifico text-lg ml-2 lg:hidden">
                <span className="text-2xl">Employee</span>{' '}
                <span className="text-3xl font-bold">MS</span>
              </h1>
            </div>

            {/* Right side: Welcome + Logout */}
            <div className="flex items-center space-x-4">
              <span className="text-white  iteam-center font-medium hidden sm:inline">
                Welcome {isAdmin ? 'Admin' : 'Employee'}
              </span>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm font-medium rounded-md bg-teal-800 text-white hover:bg-teal-900 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="pt-16 p-4">{children}</main>
      </div>
    </div>
  );
};