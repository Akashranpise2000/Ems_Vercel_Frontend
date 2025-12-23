import React, { useEffect, useState } from "react";
import {
  Users,
  DollarSign,
  FileText,
  TrendingUp,
  Award,
  UserCheck,
  CheckCircle,
  Clock,
  Eye,
  Download,
  User,
  Calendar,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { motion } from "framer-motion";
  // for redirect option

interface Document {
  _id: string;
  employee: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  category: string;
  originalName: string;
  size: number;
  createdAt: string;
}

interface Leave {
  _id: string;
  employee: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: string;
  createdAt: string;
}

export const Dashboard: React.FC = () => {
  const { isAdmin, user } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    totalSalaryPaid: 0,
    documentsUploaded: 0,
    attendanceRate: 0,
    avgSalary: 0,
    approvedLeaves: 0,
    pendingLeaves: 0,
  });
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
  const [recentLeaves, setRecentLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      const fetchStats = async () => {
        try {
          const token = localStorage.getItem('authToken');
          const response = await fetch('http://localhost:5001/api/dashboard/stats', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            throw new Error('Failed to fetch dashboard stats');
          }

          const data = await response.json();
           setStats(data.data.stats);
        } catch (error) {
          console.error('Error fetching dashboard stats:', error);
          // Fallback to zero values
          setStats({
            totalEmployees: 0,
            presentToday: 0,
            totalSalaryPaid: 0,
            documentsUploaded: 0,
            attendanceRate: 0,
            avgSalary: 0,
            approvedLeaves: 0,
            pendingLeaves: 0,
          });
        }
      };

      const fetchRecentData = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem('authToken');

          // Fetch recent documents
          const docsResponse = await fetch('http://localhost:5001/api/documents?page=1&limit=5', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (docsResponse.ok) {
            const docsData = await docsResponse.json();
            setRecentDocuments(docsData.data || []);
          }

          // Fetch recent leave applications
          const leavesResponse = await fetch('http://localhost:5001/api/leaves?page=1&limit=5', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (leavesResponse.ok) {
            const leavesData = await leavesResponse.json();
            setRecentLeaves(leavesData.data || []);
          }
        } catch (error) {
          console.error('Error fetching recent data:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchStats();
      fetchRecentData();

      // Set up polling for real-time updates every 30 seconds
      const interval = setInterval(fetchRecentData, 30000);

      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  // ✅ Restrict dashboard to only admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied 🚫</h1>
          <p className="text-gray-600 mt-2">
            You don’t have permission to view this page.
          </p>
          {/* Or redirect to another page */}
          {/* return <Navigate to="/profile" replace />; */}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Employees",
      value: stats.totalEmployees.toString(),
      icon: Users,
      color: "border-blue-500",
      iconBg: "bg-blue-500",
    },
    {
      title: "Present Today",
      value: stats.presentToday.toString(),
      icon: UserCheck,
      color: "border-green-500",
      iconBg: "bg-green-500",
    },
    {
      title: "Total Salary Paid",
      value: `₹${stats.totalSalaryPaid.toLocaleString()}`,
      icon: DollarSign,
      color: "border-emerald-500",
      iconBg: "bg-emerald-500",
    },
    {
      title: "Documents",
      value: stats.documentsUploaded.toString(),
      icon: FileText,
      color: "border-purple-500",
      iconBg: "bg-purple-500",
    },
    {
      title: "Attendance Rate",
      value: `${stats.attendanceRate}%`,
      icon: TrendingUp,
      color: "border-indigo-500",
      iconBg: "bg-indigo-500",
    },
    {
      title: "Avg. Salary",
      value: `₹${Math.round(stats.avgSalary).toLocaleString()}`,
      icon: Award,
      color: "border-orange-500",
      iconBg: "bg-orange-500",
    },
    {
      title: "Approved Leaves",
      value: stats.approvedLeaves.toString(),
      icon: CheckCircle,
      color: "border-teal-500",
      iconBg: "bg-teal-500",
    },
    {
      title: "Pending Leaves",
      value: stats.pendingLeaves.toString(),
      icon: Clock,
      color: "border-yellow-500",
      iconBg: "bg-yellow-500",
    },
  ];

  const COLORS = [
    "#22c55e",
    "#ef4444",
    "#3b82f6",
    "#f59e0b",
    "#14b8a6",
    "#eab308",
  ];

  const attendanceData = [
    { name: "Present", value: stats.presentToday },
    { name: "Absent", value: stats.totalEmployees - stats.presentToday },
  ];

  const salaryData = [
    { name: "Salary", value: stats.totalSalaryPaid },
    { name: "Avg Salary", value: stats.avgSalary * stats.totalEmployees },
  ];

  const leaveData = [
    { name: "Approved Leaves", value: stats.approvedLeaves },
    { name: "Pending Leaves", value: stats.pendingLeaves },
  ];

  const handleDownloadDocument = async (docId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5001/api/documents/download/${docId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download document');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'document.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download document. Please try again.');
    }
  };

  const handleViewLeave = async (leaveId: string) => {
    // For now, just show an alert. In a real app, you might open a modal or navigate to a detail page
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5001/api/leaves/${leaveId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const leaveData = await response.json();
        const leave = leaveData.data;
        alert(`Leave Details:\nEmployee: ${leave.employee?.firstName || 'Unknown'} ${leave.employee?.lastName || 'User'}\nType: ${leave.leaveType}\nDates: ${leave.startDate} to ${leave.endDate}\nDays: ${leave.totalDays}\nStatus: ${leave.status}\nReason: ${leave.reason}`);
      } else {
        alert('Failed to fetch leave details');
      }
    } catch (error) {
      console.error('Error fetching leave details:', error);
      alert('Failed to fetch leave details');
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Welcome Section */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.firstName} 👋
        </h1>
        <p className="text-gray-600 mt-2">
          Here's a quick overview of today’s activity.
        </p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            className={`p-6 rounded-xl shadow-lg bg-white hover:shadow-2xl transition-all duration-300 border-l-4 ${stat.color}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="flex items-center">
              <div
                className={`p-3 rounded-xl ${stat.iconBg} bg-opacity-90 shadow-md`}
              >
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-600">
                  {stat.title}
                </h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stat.value}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Documents */}
        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Documents</h2>
            <FileText className="h-5 w-5 text-purple-600" />
          </div>
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : recentDocuments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent documents</p>
          ) : (
            <div className="space-y-3">
              {recentDocuments.slice(0, 5).map((doc) => (
                <div key={doc._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-32">{doc.originalName}</p>
                      <p className="text-xs text-gray-500">
                        {doc.employee?.firstName || 'Unknown'} {doc.employee?.lastName || 'User'} • {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                      {doc.category}
                    </span>
                    <button
                      onClick={() => handleDownloadDocument(doc._id)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Leave Applications */}
        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Leave Applications</h2>
            <Calendar className="h-5 w-5 text-teal-600" />
          </div>
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : recentLeaves.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent leave applications</p>
          ) : (
            <div className="space-y-3">
              {recentLeaves.slice(0, 5).map((leave) => (
                <div key={leave._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {leave.employee?.firstName || 'Unknown'} {leave.employee?.lastName || 'User'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {leave.leaveType} • {leave.totalDays} days • {new Date(leave.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                      leave.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {leave.status}
                    </span>
                    <button
                      onClick={() => handleViewLeave(leave._id)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Pie Chart */}
        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Attendance Overview
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={attendanceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={90}
                dataKey="value"
              >
                {attendanceData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Salary Bar Chart */}
        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Salary Distribution
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={salaryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" barSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Leaves Pie Chart */}
        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Leave Status
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={leaveData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={90}
                dataKey="value"
              >
                {leaveData.map((_, index) => (
                  <Cell key={index} fill={COLORS[(index + 4) % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
