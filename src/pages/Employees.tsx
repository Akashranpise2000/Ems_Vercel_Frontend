import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Mail, Phone, Calendar, MapPin, Check, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';

// API base URL
const API_BASE_URL = 'http://localhost:5001/api';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position?: string;
  department?: string;
  hireDate?: string;
  role: string;
  salary?: number;
  status: 'active' | 'inactive';
}

export const Employees: React.FC = () => {
  const { isAdmin } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editingSalary, setEditingSalary] = useState<{ id: string; salary: string } | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [employeeDetails, setEmployeeDetails] = useState<any>(null);

  // Load employees from backend
  const loadEmployees = async () => {
    if (!isAdmin) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/employees`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load employees');
      }

      const data = await response.json();
       setEmployees(data.data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [isAdmin]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    position: '',
    department: '',
    hireDate: '',
    role: 'employee',
    salary: '',
    status: 'active' as 'active' | 'inactive',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      let response;

      if (editingEmployee) {
        // Update existing employee
        response = await fetch(`${API_BASE_URL}/employees/${editingEmployee.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            position: formData.position,
            department: formData.department,
            hireDate: formData.hireDate,
            salary: formData.salary,
            status: formData.status
          })
        });
      } else {
        // Create new employee
        response = await fetch(`${API_BASE_URL}/employees`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            password: formData.password,
            phone: formData.phone,
            position: formData.position,
            department: formData.department,
            hireDate: formData.hireDate,
            salary: formData.salary,
            status: formData.status
          })
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        // Handle validation errors with detailed messages
        let errorMessage = errorData.error || 'Failed to save employee';
        if (errorData.details && Array.isArray(errorData.details)) {
          errorMessage = errorData.details.map((detail: any) => detail.msg || detail.message).join(', ');
        }
        throw new Error(errorMessage);
      }

      // Reload employees list
      await loadEmployees();

      // Notify other components about salary update
      window.dispatchEvent(new CustomEvent('salaryUpdated'));

      // Reset form and close modal
      setShowModal(false);
      setEditingEmployee(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        position: '',
        department: '',
        hireDate: '',
        role: 'employee',
        salary: '',
        status: 'active',
      });
    } catch (error) {
      console.error('Error saving employee:', error);
      alert('Failed to save employee. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      password: '', // Don't populate password for editing
      phone: employee.phone || '',
      position: employee.position || '',
      department: employee.department || '',
      hireDate: employee.hireDate || '',
      role: employee.role,
      salary: employee.salary?.toString() || '',
      status: employee.status,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Handle validation errors with detailed messages
        let errorMessage = errorData.error || 'Failed to delete employee';
        if (errorData.details && Array.isArray(errorData.details)) {
          errorMessage = errorData.details.map((detail: any) => detail.msg || detail.message).join(', ');
        }
        throw new Error(errorMessage);
      }

      // Reload employees list
      await loadEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Failed to delete employee. Please try again.');
    }
  };

  const handleShowDetails = async (employeeId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/employees/${employeeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Handle validation errors with detailed messages
        let errorMessage = errorData.error || 'Failed to load employee details';
        if (errorData.details && Array.isArray(errorData.details)) {
          errorMessage = errorData.details.map((detail: any) => detail.msg || detail.message).join(', ');
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setEmployeeDetails(data.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error loading employee details:', error);
      alert('Failed to load employee details. Please try again.');
    }
  };

  const handleQuickSalaryUpdate = async (employeeId: string, newSalary: number) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/employees/${employeeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ salary: newSalary })
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Handle validation errors with detailed messages
        let errorMessage = errorData.error || 'Failed to update salary';
        if (errorData.details && Array.isArray(errorData.details)) {
          errorMessage = errorData.details.map((detail: any) => detail.msg || detail.message).join(', ');
        }
        throw new Error(errorMessage);
      }

      // Reload employees list to reflect changes
      await loadEmployees();
      setEditingSalary(null);

      // Notify other components about salary update
      window.dispatchEvent(new CustomEvent('salaryUpdated'));
    } catch (error) {
      console.error('Error updating salary:', error);
      alert('Failed to update salary. Please try again.');
    }
  };

  const filteredEmployees = employees.filter((employee) =>
    `${employee.firstName} ${employee.lastName} ${employee.email} ${employee.position} ${employee.department}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="text-center py-16 bg-red-50 rounded-xl shadow-lg">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Mail className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Access Denied</h2>
          <p className="text-gray-600">You need admin privileges to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Employees
          </h1>
          <p className="text-gray-600 mt-2">Manage your team members and their information</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <Plus className="h-5 w-5" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees by name, email, position, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors shadow-md"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center">
              <LoadingSpinner />
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  {['Employee', 'Position & Department', 'Contact', 'Role & Status', 'Salary', 'Details', 'Actions'].map((header) => (
                    <th
                      key={header}
                      className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-purple-50 transition-colors group">
                    {/* Employee Info */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center shadow-md">
                            <span className="text-sm font-bold text-white">
                              {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">
                            {employee.firstName} {employee.lastName}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center mt-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            Joined {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Position */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {employee.position || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        {employee.department || 'N/A'}
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Mail className="h-4 w-4 mr-1 text-gray-400" />
                        {employee.email}
                      </div>
                      {employee.phone && (
                        <div className="text-xs text-gray-500 flex items-center mt-1">
                          <Phone className="h-4 w-4 mr-1 text-gray-400" />
                          {employee.phone}
                        </div>
                      )}
                    </td>

                    {/* Role & Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                          employee.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {employee.role}
                        </span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                          employee.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {employee.status}
                        </span>
                      </div>
                    </td>

                    {/* Salary */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {editingSalary?.id === employee.id ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500">$</span>
                          <input
                            type="number"
                            value={editingSalary.salary}
                            onChange={(e) => setEditingSalary({ ...editingSalary, salary: e.target.value })}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            min="0"
                            step="0.01"
                          />
                          <button
                            onClick={() => handleQuickSalaryUpdate(employee.id, parseFloat(editingSalary.salary) || 0)}
                            className="p-1 text-green-600 hover:text-green-800"
                            title="Save"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingSalary(null)}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span>{employee.salary ? `₹${employee.salary.toLocaleString()}` : 'N/A'}</span>
                          <button
                            onClick={() => setEditingSalary({ id: employee.id, salary: employee.salary?.toString() || '0' })}
                            className="p-1 text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Edit Salary"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Details */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleShowDetails(employee.id)}
                        className="text-purple-600 hover:text-purple-900 p-2 rounded-lg hover:bg-purple-100 transition"
                        title="Show Details"
                      >
                        Show Details
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(employee)}
                          className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-100 transition"
                          title="Edit Employee"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(employee.id)}
                          className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-100 transition"
                          title="Delete Employee"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all scale-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
            </h3>
            <form onSubmit={handleSave} className="space-y-6">
              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition shadow-sm"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition shadow-sm"
                />
              </div>

              {!editingEmployee && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    required={!editingEmployee}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition shadow-sm"
                    placeholder="Enter password for new employee"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Hire Date
                  </label>
                  <input
                    type="date"
                    value={formData.hireDate}
                    onChange={(e) => setFormData({...formData, hireDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Position
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition shadow-sm"
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition shadow-sm"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Annual Salary
                  </label>
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({...formData, salary: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition shadow-sm"
                    placeholder="50000"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingEmployee(null);
                  }}
                  className="px-6 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg shadow-md disabled:opacity-50 transition"
                >
                  {loading ? 'Saving...' : editingEmployee ? 'Update Employee' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && employeeDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all scale-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Employee Details: {employeeDetails.firstName} {employeeDetails.lastName}
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Personal Information */}
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h4 className="text-lg font-semibold text-blue-900 mb-4">Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded">Employee ID</label>
                    <p className="text-lg text-gray-900 mt-1">{employeeDetails.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded">First Name</label>
                    <p className="text-lg text-gray-900 mt-1">{employeeDetails.firstName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded">Last Name</label>
                    <p className="text-lg text-gray-900 mt-1">{employeeDetails.lastName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded">DOB</label>
                    <p className="text-lg text-gray-900 mt-1">{employeeDetails.dob || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded">Gender</label>
                    <p className="text-lg text-gray-900 mt-1">{employeeDetails.gender || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded">Blood Group</label>
                    <p className="text-lg text-gray-900 mt-1">{employeeDetails.bloodGroup || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded">Aadhaar</label>
                    <p className="text-lg text-gray-900 mt-1">{employeeDetails.aadhaar || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded">PAN</label>
                    <p className="text-lg text-gray-900 mt-1">{employeeDetails.pan || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <h4 className="text-lg font-semibold text-green-900 mb-4">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">Email</label>
                    <p className="text-lg text-gray-900 mt-1">{employeeDetails.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">Phone</label>
                    <p className="text-lg text-gray-900 mt-1">{employeeDetails.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">Address</label>
                    <p className="text-lg text-gray-900 mt-1">{employeeDetails.address || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">Communication Address</label>
                    <p className="text-lg text-gray-900 mt-1">{employeeDetails.communicationAddress || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">DOC Of Communication Address</label>
                    <p className="text-lg text-gray-900 mt-1">{employeeDetails.docCommunicationAddress || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">Emergency Contact Person</label>
                    <p className="text-lg text-gray-900 mt-1">{employeeDetails.emergencyContactPerson || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">Emergency Contact No.</label>
                    <p className="text-lg text-gray-900 mt-1">{employeeDetails.emergencyContactNo || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Employment Details */}
              <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                <h4 className="text-lg font-semibold text-purple-900 mb-4">Employment Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-purple-700 bg-purple-100 px-2 py-1 rounded">Hire Date</label>
                    <p className="text-lg text-gray-900 mt-1">{employeeDetails.hireDate ? new Date(employeeDetails.hireDate).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-purple-700 bg-purple-100 px-2 py-1 rounded">Position</label>
                    <p className="text-lg text-gray-900 mt-1">{employeeDetails.position || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-purple-700 bg-purple-100 px-2 py-1 rounded">Department</label>
                    <p className="text-lg text-gray-900 mt-1">{employeeDetails.department || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-purple-700 bg-purple-100 px-2 py-1 rounded">Salary</label>
                    <p className="text-lg text-gray-900 mt-1">{employeeDetails.salary ? `₹${employeeDetails.salary.toLocaleString()}` : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-purple-700 bg-purple-100 px-2 py-1 rounded">Role</label>
                    <p className="text-lg text-gray-900 mt-1">{employeeDetails.role}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-purple-700 bg-purple-100 px-2 py-1 rounded">Status</label>
                    <p className="text-lg text-gray-900 mt-1">{employeeDetails.status}</p>
                  </div>
                </div>
              </div>

              {/* Education & Documents */}
              <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                <h4 className="text-lg font-semibold text-orange-900 mb-4">Education & Documents</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-orange-700 bg-orange-100 px-2 py-1 rounded">Education</label>
                    <p className="text-lg text-gray-900 mt-1">{employeeDetails.education || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-orange-700 bg-orange-100 px-2 py-1 rounded">PF No.</label>
                    <p className="text-lg text-gray-900 mt-1">{employeeDetails.pfNo || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-orange-700 bg-orange-100 px-2 py-1 rounded">Medical Insurance</label>
                    <p className="text-lg text-gray-900 mt-1">{employeeDetails.medicalInsurance || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-orange-700 bg-orange-100 px-2 py-1 rounded">Driving Licence</label>
                    <p className="text-lg text-gray-900 mt-1">{employeeDetails.drivingLicence || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-orange-700 bg-orange-100 px-2 py-1 rounded">Vehicle No.</label>
                    <p className="text-lg text-gray-900 mt-1">{employeeDetails.vehicleNo || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-orange-700 bg-orange-100 px-2 py-1 rounded">Call Letter</label>
                    <p className="text-lg text-gray-900 mt-1">{employeeDetails.callLetter || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Documents Submitted */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2 bg-gray-100 px-2 py-1 rounded">Documents Submitted</label>
                {employeeDetails.documentsSubmitted && employeeDetails.documentsSubmitted.length > 0 ? (
                  <ul className="space-y-1 mt-2">
                    {employeeDetails.documentsSubmitted.map((doc: string, index: number) => (
                      <li key={index} className="flex items-center text-sm text-gray-800">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        {doc}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic mt-2">No documents submitted yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
