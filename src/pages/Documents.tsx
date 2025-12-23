import React, { useEffect, useState } from 'react';
import { FileText, Upload, Download, Trash2, Search, FolderOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';

// API base URL
const API_BASE_URL = 'http://localhost:5001/api';

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
  employeeName?: string;
  name?: string;
}

export const Documents: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('other');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

  // Load documents from backend
  const loadDocuments = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      let response;

      if (isAdmin) {
        response = await fetch(`${API_BASE_URL}/documents?page=1&limit=50`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } else {
        response = await fetch(`${API_BASE_URL}/documents/employee`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        // Handle validation errors with detailed messages
        let errorMessage = errorData.error || 'Failed to load documents';
        if (errorData.details && Array.isArray(errorData.details)) {
          errorMessage = errorData.details.map((detail: any) => detail.msg || detail.message).join(', ');
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const docs = data.data || [];

      // Transform backend data to match frontend interface
      const transformedDocs = docs.map((doc: any) => ({
        ...doc,
        employeeName: isAdmin && doc.employee ? `${doc.employee.firstName || 'Unknown'} ${doc.employee.lastName || 'User'}` : (user ? `${user.firstName} ${user.lastName}` : 'Unknown'),
        name: doc.originalName || `Document ${doc._id}.pdf`, // Use original filename if available
        category: doc.category,
        uploadDate: doc.createdAt ? new Date(doc.createdAt).toISOString().split('T')[0] : '',
        size: doc.size || 0 // Use actual file size from database
      }));

      setDocuments(transformedDocs);
    } catch (error) {
      console.error('Error loading documents:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [user, isAdmin]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.type !== 'application/pdf') {
      alert('Only PDF files are allowed');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setUploading(true);

    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', selectedDocumentType === 'other' && customCategory ? customCategory : selectedDocumentType);

      const response = await fetch(`${API_BASE_URL}/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Handle validation errors with detailed messages
        let errorMessage = errorData.error || 'Failed to upload document';
        if (errorData.details && Array.isArray(errorData.details)) {
          errorMessage = errorData.details.map((detail: any) => detail.msg || detail.message).join(', ');
        }
        throw new Error(errorMessage);
      }

      // Reload documents to get updated data
      loadDocuments();
      event.target.value = '';
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/documents/download/${doc._id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Handle validation errors with detailed messages
        let errorMessage = errorData.error || 'Failed to download document';
        if (errorData.details && Array.isArray(errorData.details)) {
          errorMessage = errorData.details.map((detail: any) => detail.msg || detail.message).join(', ');
        }
        throw new Error(errorMessage);
      }

      // Check if response is actually a file download (not JSON error)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to download document');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.originalName || doc.name || 'document.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert((error as Error).message || 'Failed to download document. Please try again.');
    }
  };


  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Handle validation errors with detailed messages
        let errorMessage = errorData.error || 'Failed to delete document';
        if (errorData.details && Array.isArray(errorData.details)) {
          errorMessage = errorData.details.map((detail: any) => detail.msg || detail.message).join(', ');
        }
        throw new Error(errorMessage);
      }

      // Reload documents to get updated data
      loadDocuments();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete document. Please try again.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'contract': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'certificate': return 'bg-green-100 text-green-800 border-green-200';
      case 'report': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Doc Of Comminication Address': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Call Letter': return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'Aadhar': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Pan': return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'other': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Documents are already filtered by API (employees get their own, admin gets all)
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      (doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (doc.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesCategory =
      selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesEmployeeId =
      !selectedEmployeeId ||
      doc.employee._id.toString() === selectedEmployeeId;
    return matchesSearch && matchesCategory && matchesEmployeeId;
  });

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'contracts', label: 'Contracts' },
    { value: 'certificates', label: 'Certificates' },
    { value: 'identification', label: 'Identification' },
    { value: 'tax_documents', label: 'Tax Documents' },
    { value: 'medical', label: 'Medical' },
    { value: 'education', label: 'Education' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Management</h1>
        <p className="text-gray-600">
          {isAdmin ? 'Manage all employees documents' : 'Upload and manage your documents'}
        </p>
      </div>

      {/* Upload Section - Only Employees */}
      {!isAdmin && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload New Document</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <select
                  value={selectedDocumentType}
                  onChange={(e) => {
                    setSelectedDocumentType(e.target.value);
                    if (e.target.value !== 'other') {
                      setCustomCategory('');
                    }
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="contracts">Contracts</option>
                  <option value="certificates">Certificates</option>
                  <option value="identification">Identification</option>
                  <option value="tax_documents">Tax Documents</option>
                  <option value="medical">Medical</option>
                  <option value="education">Education</option>
                  <option value="other">Other</option>
                </select>
                {selectedDocumentType === 'other' && (
                  <input
                    type="text"
                    placeholder="Enter custom category"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    maxLength={50}
                  />
                )}
                <label className="relative cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl">
                  <Upload className="h-4 w-4" />
                  <span>{uploading ? 'Uploading...' : 'Choose PDF File'}</span>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
              {uploading && (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-blue-600">Processing...</span>
                </div>
              )}
            </div>
            <div className="text-sm text-gray-600">
              <p>• PDF files only</p>
              <p>• Maximum size: 10MB</p>
            </div>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {isAdmin ? 'All Documents' : 'Your Documents'}
          </h2>
          <div className="flex flex-wrap gap-4 mt-4 sm:mt-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            {isAdmin && (
              <input
                type="text"
                placeholder="Filter by Employee ID"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            )}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <LoadingSpinner />
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="p-12 text-center">
              <FolderOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Found</h3>
              <p className="text-gray-500">
                {searchTerm || selectedCategory !== 'all'
                  ? 'No documents match your search criteria.'
                  : isAdmin
                  ? 'No employee has uploaded documents yet.'
                  : 'Upload your first document to get started.'}
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Document</th>
                  {isAdmin && (
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                  )}
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Upload Date</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDocuments.map((doc) => (
                  <tr key={doc._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-red-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{doc.name || 'Document'}</div>
                          <div className="text-sm text-gray-500">PDF Document</div>
                        </div>
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mr-3">
                            <span className="text-xs font-medium text-white">
                              {doc.employeeName?.split(' ').map((n) => n[0]).join('') || '?'}
                            </span>
                          </div>
                          <div className="text-sm font-medium text-gray-900">{doc.employeeName || 'Unknown'}</div>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(
                          doc.category || 'other'
                        )}`}
                      >
                        {doc.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(doc.size || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleDownload(doc)}
                          className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(doc._id)}
                            className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
