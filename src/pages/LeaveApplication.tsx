import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

// API base URL
const API_BASE_URL = 'http://localhost:5001/api';

interface Leave {
  id: number;
  employee_id: number;
  leave_type: string;
  department: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

const LeaveApplication: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">(isAdmin ? "pending" : "all");
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });

  // Employee form state
  const [leaveType, setLeaveType] = useState("sick");
  const [department, setDepartment] = useState("Logistic");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  // Load data from backend
  const loadLeaves = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      let endpoint = '';

      if (isAdmin) {
        endpoint = `${API_BASE_URL}/leaves?page=1&limit=50&status=${filter}&employee=${search}`;
      } else {
        endpoint = `${API_BASE_URL}/leaves`;
      }

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const leavesData = data.data || [];
        // Transform backend data to match frontend interface
        const transformedLeaves = leavesData.map((leave: any) => ({
          id: leave._id,
          employee_id: leave.employee?._id || leave.employee,
          leave_type: leave.leaveType,
          department: leave.employee?.department || 'N/A',
          start_date: new Date(leave.startDate).toLocaleDateString(),
          end_date: new Date(leave.endDate).toLocaleDateString(),
          days: leave.totalDays,
          reason: leave.reason,
          status: leave.status,
          firstName: leave.employee?.firstName || 'Unknown',
          lastName: leave.employee?.lastName || 'User',
          email: leave.employee?.email || 'N/A',
          phone: leave.employee?.phone || 'N/A'
        }));
        setLeaves(transformedLeaves);
      } else {
        const errorData = await response.json();
        console.error('Error loading leaves:', errorData.error);
        setLeaves([]);
      }
    } catch (error) {
      console.error('Error loading leaves:', error);
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!isAdmin) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/leaves/stats/admin`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  useEffect(() => {
    loadLeaves();
    if (isAdmin) {
      loadStats();
    }
  }, [isAdmin, user, filter, search]);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !startDate || !endDate || !reason) return;

    // Validate dates
    if (new Date(startDate) > new Date(endDate)) {
      alert('End date must be after start date');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/leaves`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          leaveType: leaveType === "Sick Leave" ? "sick" : leaveType === "Casual Leave" ? "annual" : "other",
          startDate,
          endDate,
          reason
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Handle validation errors with detailed messages
        let errorMessage = errorData.error || 'Failed to submit leave application';
        if (errorData.details && Array.isArray(errorData.details)) {
          errorMessage = errorData.details.map((detail: any) => detail.msg || detail.message).join(', ');
        }
        throw new Error(errorMessage);
      }

      // Reset form
      setLeaveType("sick");
      setDepartment("Web Developer");
      setStartDate("");
      setEndDate("");
      setReason("");

      // Reload leaves
      await loadLeaves();
      alert('Leave application submitted successfully!');
    } catch (error) {
      console.error('Error submitting leave:', error);
      // Show the specific error message from backend if available
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit leave application. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/leaves/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'approved' })
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Handle validation errors with detailed messages
        let errorMessage = errorData.error || 'Failed to approve leave';
        if (errorData.details && Array.isArray(errorData.details)) {
          errorMessage = errorData.details.map((detail: any) => detail.msg || detail.message).join(', ');
        }
        throw new Error(errorMessage);
      }

      await loadLeaves();
      await loadStats();
      alert('Leave approved successfully!');
    } catch (error) {
      console.error('Error approving leave:', error);
      alert('Failed to approve leave. Please try again.');
    }
  };

  const handleReject = async (id: number) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/leaves/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'rejected' })
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Handle validation errors with detailed messages
        let errorMessage = errorData.error || 'Failed to reject leave';
        if (errorData.details && Array.isArray(errorData.details)) {
          errorMessage = errorData.details.map((detail: any) => detail.msg || detail.message).join(', ');
        }
        throw new Error(errorMessage);
      }

      await loadLeaves();
      await loadStats();
      alert('Leave rejected successfully!');
    } catch (error) {
      console.error('Error rejecting leave:', error);
      alert('Failed to reject leave. Please try again.');
    }
  };

  // Filter leaves for display
  const filteredLeaves = leaves.filter((leave) => {
    const matchesSearch = isAdmin ?
      (leave.firstName + ' ' + leave.lastName).toLowerCase().includes(search.toLowerCase()) ||
      leave.email?.toLowerCase().includes(search.toLowerCase()) :
      true;
    const matchesFilter = filter === "all" || leave.status === filter;
    return matchesSearch && matchesFilter;
  });

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-xl p-6 mb-6 shadow-lg">
          <h1 className="text-3xl font-bold">My Leave Applications</h1>
          <p className="mt-2 text-lg">Apply for leave or view your requests</p>
        </div>

        {/* Apply Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200 max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Apply for Leave</h2>
          <form onSubmit={handleApplyLeave}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Leave Type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                >
                  <option value="sick">Sick Leave</option>
                  <option value="annual">Annual Leave</option>
                  <option value="other">Other Leave</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Web Development">Web Development</option>
                <option value="Marketing">Marketing</option>
                  <option value="Operations">Operations</option>
                  <option value="HR">HR</option>
                  <option value="App Development">App Development</option>
                  <option value="Sales">Sales</option>
                  <option value="Visual Designing">Visual Designing</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="Enter reason for leave..."
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-500 to-blue-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-teal-600 hover:to-blue-600 transition-all disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Leave Request'}
              </button>
            </div>
          </form>
        </div>

        {/* Employee's Leave History */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">My Leave History</h2>
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : leaves.length === 0 ? (
              <p className="text-gray-500 text-center">No leave requests yet. Apply above to get started.</p>
            ) : null}
          </div>
          {leaves.length > 0 && !loading && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLeaves.map((leave, index) => (
                    <tr key={leave.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{leave.leave_type}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{`${leave.start_date} to ${leave.end_date}`}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{leave.days}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            leave.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : leave.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {leave.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedLeave(leave)}
                          className="px-3 py-1 text-sm bg-teal-500 text-white rounded-md hover:bg-teal-600"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Admin view
  return (
    <div className="p-6">
      <div className="bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-xl p-6 mb-6 shadow-lg">
        <h1 className="text-3xl font-bold">Employee Leave Management</h1>
        <p className="mt-2 text-lg">Track and manage leave requests efficiently</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Requests</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          <div className="text-sm text-gray-600">Approved</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          <div className="text-sm text-gray-600">Rejected</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
        <input
          type="text"
          placeholder="Search By Name or Email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-md px-3 py-2 w-full sm:w-1/3 focus:ring-2 focus:ring-teal-500 outline-none shadow-sm"
        />

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 rounded-md font-medium ${filter === "pending" ? "bg-yellow-500 text-white shadow" : "bg-gray-200"}`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter("approved")}
            className={`px-4 py-2 rounded-md font-medium ${filter === "approved" ? "bg-green-500 text-white shadow" : "bg-gray-200"}`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilter("rejected")}
            className={`px-4 py-2 rounded-md font-medium ${filter === "rejected" ? "bg-red-500 text-white shadow" : "bg-gray-200"}`}
          >
            Rejected
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-md font-medium ${filter === "all" ? "bg-teal-500 text-white shadow" : "bg-gray-200"}`}
          >
            All
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0.5">
          <thead>
            <tr className="bg-gray-100 text-left text-sm font-semibold">
              <th className="px-4 py-2 rounded-tl-md">S No</th>
              <th className="px-4 py-2">Employee</th>
              <th className="px-4 py-2">Leave Type</th>
              <th className="px-4 py-2">Department</th>
              <th className="px-4 py-2">Days</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 rounded-tr-md">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-3 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : filteredLeaves.length > 0 ? (
              filteredLeaves.map((leave, index) => (
                <tr
                  key={leave.id}
                  className="hover:shadow-lg hover:scale-105 transition-transform bg-white rounded-md mb-1 text-sm"
                >
                  <td className="px-4 py-2">{index + 1}</td>
                  <td className="px-4 py-2">
                    <div>
                      <div className="font-medium">{leave.firstName} {leave.lastName}</div>
                      <div className="text-xs text-gray-500">{leave.email}</div>
                    </div>
                  </td>
                  <td className="px-4 py-2">{leave.leave_type}</td>
                  <td className="px-4 py-2">{leave.department}</td>
                  <td className="px-4 py-2">{leave.days}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        leave.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : leave.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {leave.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedLeave(leave)}
                        className="px-3 py-1 text-sm bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-md hover:from-teal-600 hover:to-blue-600 shadow"
                      >
                        View
                      </button>
                      {leave.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(leave.id)}
                            className="px-3 py-1 text-sm bg-green-500 text-white rounded-md hover:bg-green-600"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(leave.id)}
                            className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-3 text-center text-gray-500">
                  No leaves found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View Modal */}
      {selectedLeave && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-3 text-teal-600">Leave Details</h2>
            <p><strong>Employee:</strong> {selectedLeave.firstName} {selectedLeave.lastName} ({selectedLeave.email})</p>
            <p><strong>Type:</strong> {selectedLeave.leave_type}</p>
            <p><strong>Department:</strong> {selectedLeave.department}</p>
            <p><strong>Start Date:</strong> {selectedLeave.start_date}</p>
            <p><strong>End Date:</strong> {selectedLeave.end_date}</p>
            <p><strong>Days:</strong> {selectedLeave.days}</p>
            <p><strong>Reason:</strong> {selectedLeave.reason}</p>
            <p>
              <strong>Status:</strong>{" "}
              <span
                className={`px-2 py-1 rounded text-sm ${
                  selectedLeave.status === "approved"
                    ? "bg-green-100 text-green-800"
                    : selectedLeave.status === "rejected"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {selectedLeave.status}
              </span>
            </p>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedLeave(null)}
                className="px-4 py-2 rounded-md bg-teal-500 text-white hover:bg-teal-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveApplication;
