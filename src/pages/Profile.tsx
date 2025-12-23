import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  CreditCard,
  Shield,
  Car,
  FileText,
  Heart,
  
  Briefcase,
  
  Edit3,
  Save,
  X,
  Camera,
  
  Trash2,
} from 'lucide-react';

interface EmployeeProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  hireDate: string;
  salary: number;
  status: string;
  // Additional fields (placeholders for now)
  dob?: string;
  gender?: string;
  bloodGroup?: string;
  aadhaar?: string;
  pan?: string;
  education?: string;
  pfNo?: string;
  medicalInsurance?: string;
  drivingLicence?: string;
  vehicleNo?: string;
  callLetter?: string;
  address?: string;
  communicationAddress?: string;
  docCommunicationAddress?: string;
  emergencyContactPerson?: string;
  emergencyContactNo?: string;
  documentsSubmitted?: string[];
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const token = localStorage.getItem('authToken');
  const response = await fetch(`http://localhost:5001/api/employees/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setProfile({
            ...data.data,
            // Additional fields will be undefined if not in DB
            dob: undefined,
            gender: undefined,
            bloodGroup: undefined,
            aadhaar: undefined,
            pan: undefined,
            education: undefined,
            pfNo: undefined,
            medicalInsurance: undefined,
            drivingLicence: undefined,
            vehicleNo: undefined,
            callLetter: undefined,
            address: undefined,
            communicationAddress: undefined,
            docCommunicationAddress: undefined,
            emergencyContactPerson: undefined,
            emergencyContactNo: undefined,
            documentsSubmitted: undefined
          });
        } else {
          // If employee data not found, create profile with user data only
          setProfile({
            id: parseInt(user.id),
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: '',
            position: user.role === 'admin' ? 'Administrator' : 'Employee',
            department: 'General',
            hireDate: '',
            salary: 0,
            status: 'active'
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        // Fallback to user data
        setProfile({
          id: parseInt(user.id),
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: '',
          position: user.role === 'admin' ? 'Administrator' : 'Employee',
          department: 'General',
          hireDate: '',
          salary: 0,
          status: 'active',
          dob: 'Not specified',
          gender: 'Not specified',
          bloodGroup: 'Not specified',
          aadhaar: 'Not provided',
          pan: 'Not provided',
          education: 'Not specified',
          pfNo: 'Not applicable',
          medicalInsurance: 'Not provided',
          drivingLicence: 'Not provided',
          vehicleNo: 'Not provided',
          callLetter: 'Not applicable',
          address: 'Not provided',
          communicationAddress: 'Not provided',
          docCommunicationAddress: 'Not applicable',
          emergencyContactPerson: 'Not provided',
          emergencyContactNo: 'Not provided',
          documentsSubmitted: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !formRef.current) return;

    setSaving(true);
    try {
      const formData = new FormData(formRef.current);
      const data: Partial<EmployeeProfile> = {};

      // Convert FormData to object and handle types properly
      for (const [key, value] of formData.entries()) {
        if (value !== '') {
          // Handle special case for salary which needs to be a number
          if (key === 'salary') {
            data[key] = parseFloat(value as string);
          } else if (key === 'documentsSubmitted') {
            // Handle array type
            data[key] = [value as string];
          } else {
            // For all other string fields
            (data as any)[key] = value as string;
          }
        }
      }

      const token = localStorage.getItem('authToken');
  const response = await fetch(`http://localhost:5001/api/employees/${user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const updatedProfile = { ...profile, ...data } as EmployeeProfile;
        setProfile(updatedProfile);
        setIsEditing(false);
        alert('Profile updated successfully!');
      } else {
        alert('Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Profile Not Found</h1>
          <p className="text-gray-600 mt-2">Unable to load profile information.</p>
        </div>
      </div>
    );
  }

  const ProfileField = ({
    icon: Icon,
    label,
    value,
    field,
    color = "blue",
    type = "text",
    options = [],
    isEditing
  }: {
    icon: any;
    label: string;
    value: string | undefined;
    field: keyof EmployeeProfile;
    color?: string;
    type?: string;
    options?: string[];
    isEditing: boolean;
  }) => {
    const colorClasses = {
      blue: "text-blue-500 bg-blue-50 border-blue-200",
      green: "text-green-500 bg-green-50 border-green-200",
      purple: "text-purple-500 bg-purple-50 border-purple-200",
      orange: "text-orange-500 bg-orange-50 border-orange-200",
      red: "text-red-500 bg-red-50 border-red-200"
    };

    if (isEditing) {
      return (
        <div className={`p-4 ${colorClasses[color as keyof typeof colorClasses]} rounded-xl border shadow-sm`}>
          <label className="block text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">
            {label}
          </label>
          <div className="flex items-center space-x-2">
            <Icon className="h-4 w-4 flex-shrink-0" />
            {type === "select" ? (
              <select
                name={field}
                defaultValue={value || ''}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select {label.toLowerCase()}</option>
                {options.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            ) : (
              <input
                type={type}
                name={field}
                defaultValue={value || ''}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={`Enter ${label.toLowerCase()}`}
              />
            )}
          </div>
        </div>
      );
    }

    return (
      <div className={`flex items-center space-x-3 p-4 ${colorClasses[color as keyof typeof colorClasses]} rounded-xl border shadow-sm hover:shadow-md transition-shadow duration-200`}>
        <Icon className="h-5 w-5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">{label}</p>
          <p className="text-lg text-gray-900 font-semibold">{value || 'Not provided'}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with Profile Picture */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            {/* Profile Picture */}
            <div className="relative group">
              <div className="w-32 h-32 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm border-4 border-white border-opacity-30 shadow-xl overflow-hidden">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-16 w-16 text-white opacity-60" />
                )}
              </div>
              {isEditing && (
                <div className="absolute -bottom-2 -right-2 flex space-x-1">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center shadow-lg transition-colors"
                    title="Upload new picture"
                  >
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                  {profileImage && (
                    <button
                      onClick={handleRemoveImage}
                      className="w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-colors"
                      title="Remove picture"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold mb-2">{profile.firstName} {profile.lastName}</h1>
              <p className="text-xl text-purple-100 mb-1">{profile.position} - {profile.department}</p>
              <p className="text-lg text-pink-100">Employee ID: {profile.id}</p>
              <div className="flex items-center justify-center md:justify-start mt-4">
                <div className="w-3 h-3 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                <span className="text-sm font-medium">Active Employee</span>
              </div>
            </div>

            {/* Edit/Save/Cancel Buttons */}
            <div className="flex space-x-3">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-xl flex items-center space-x-2 transition-all duration-200 backdrop-blur-sm border border-white border-opacity-30"
                >
                  <Edit3 className="h-5 w-5" />
                  <span className="font-medium">Edit Profile</span>
                </button>
              ) : (
                <div className="flex space-x-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-green-400 rounded-xl flex items-center space-x-2 transition-all duration-200"
                  >
                    <Save className="h-5 w-5" />
                    <span className="font-medium">{saving ? 'Saving...' : 'Save'}</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-xl flex items-center space-x-2 transition-all duration-200"
                  >
                    <X className="h-5 w-5" />
                    <span className="font-medium">Cancel</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Employee Details Form Layout */}
        <form ref={formRef} onSubmit={handleSave} className="bg-white shadow-2xl rounded-3xl p-8 border border-gray-100">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Employee Profile Details</h2>

          {/* Personal Information */}
          <div className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ProfileField icon={User} label="First Name" field="firstName" value={profile.firstName} color="blue" isEditing={isEditing} />
              <ProfileField icon={User} label="Last Name" field="lastName" value={profile.lastName} color="blue" isEditing={isEditing} />
              <ProfileField icon={Calendar} label="DOB" field="dob" value={profile.dob} color="green" type="date" isEditing={isEditing} />
              <ProfileField icon={User} label="Gender" field="gender" value={profile.gender} color="purple" type="select" options={["Female", "Male"]} isEditing={isEditing} />
              <ProfileField icon={Heart} label="Blood Group" field="bloodGroup" value={profile.bloodGroup} color="red" type="select" options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]} isEditing={isEditing} />
              <ProfileField icon={CreditCard} label="Aadhaar" field="aadhaar" value={profile.aadhaar} color="orange" isEditing={isEditing} />
              <ProfileField icon={CreditCard} label="PAN" field="pan" value={profile.pan} color="blue" isEditing={isEditing} />
            </div>
          </div>

          {/* Contact Information */}
          <div className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <Phone className="h-5 w-5 text-green-600" />
              </div>
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProfileField icon={Mail} label="Email" field="email" value={profile.email} color="blue" type="email" isEditing={isEditing} />
              <ProfileField icon={Phone} label="Mobile" field="phone" value={profile.phone} color="green" type="tel" isEditing={isEditing} />
              <ProfileField icon={MapPin} label="Address" field="address" value={profile.address} color="purple" isEditing={isEditing} />
              <ProfileField icon={MapPin} label="Communication Address" field="communicationAddress" value={profile.communicationAddress} color="orange" isEditing={isEditing} />
              <ProfileField icon={User} label="Emergency Contact Person" field="emergencyContactPerson" value={profile.emergencyContactPerson} color="blue" isEditing={isEditing} />
              <ProfileField icon={Phone} label="Emergency Contact No." field="emergencyContactNo" value={profile.emergencyContactNo} color="green" type="tel" isEditing={isEditing} />
            </div>
          </div>

          {/* Employment Details */}
          <div className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <Briefcase className="h-5 w-5 text-purple-600" />
              </div>
              Employment Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ProfileField icon={Calendar} label="DOJ" field="hireDate" value={profile.hireDate} color="green" type="date" isEditing={isEditing} />
              <ProfileField icon={Briefcase} label="Designation" field="position" value={profile.position} color="purple" isEditing={isEditing} />
              <ProfileField icon={Briefcase} label="Department" field="department" value={profile.department} color="blue" isEditing={isEditing} />
            </div>
          </div>

          {/* Education & Documents */}
          <div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                <GraduationCap className="h-5 w-5 text-orange-600" />
              </div>
              Education & Documents
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ProfileField icon={GraduationCap} label="Education" field="education" value={profile.education} color="orange" isEditing={isEditing} />
              <ProfileField icon={Shield} label="PF No." field="pfNo" value={profile.pfNo} color="red" isEditing={isEditing} />
              <ProfileField icon={Shield} label="Medical insurance" field="medicalInsurance" value={profile.medicalInsurance} color="blue" isEditing={isEditing} />
              <ProfileField icon={Car} label="Driving Licence" field="drivingLicence" value={profile.drivingLicence} color="green" isEditing={isEditing} />
              <ProfileField icon={Car} label="Vehicle No." field="vehicleNo" value={profile.vehicleNo} color="purple" isEditing={isEditing} />
              <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 shadow-sm col-span-1 md:col-span-2 lg:col-span-3">
                <FileText className="h-6 w-6 text-indigo-600 mb-3" />
                <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Documents Submitted</p>
                {profile.documentsSubmitted && profile.documentsSubmitted.length > 0 ? (
                  <ul className="space-y-1">
                    {profile.documentsSubmitted.map((doc, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-800">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        {doc}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic">No documents submitted yet</p>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;