'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Bell, LogOut, Settings, User } from 'lucide-react';

interface College {
  id: number;
  name: string;
  location: string;
  description: string;
  program?: string;
  status: 'Available' | 'Unavailable';
  buttonColor?: 'cyan' | 'yellow' | 'green' | 'teal';
  buttonAction?: string;
  applicationDeadline?: string;
  requirements?: string[];
  contactEmail?: string;
}

export default function StudentColleges() {
  const router = useRouter();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilesByCollege, setSelectedFilesByCollege] = useState<Record<number, File[]>>({});

  // Fetch colleges on component mount
  useEffect(() => {
    const fetchColleges = async () => {
      try {
        setLoading(true);
        const response = await fetch('/server/colleges?status=Available');
        if (!response.ok) {
          throw new Error('Failed to fetch colleges');
        }
        const data = await response.json();
        setColleges(data);
      } catch (err) {
        console.error('Error fetching colleges:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchColleges();
  }, []);

  const getButtonColor = (color?: string) => {
    return 'bg-cyan-400 hover:bg-cyan-500 text-white';
  };

  const handleFileChange = (collegeId: number, event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFilesByCollege((prev) => ({
      ...prev,
      [collegeId]: files,
    }));
  };

  const handleApply = async (college: College) => {
    try {
      // Create application via API
      const selectedFiles = selectedFilesByCollege[college.id] || [];

      const applicationData = {
        studentId: 1, // In a real app, this would come from authentication
        studentName: 'Juan dela Cruz',
        collegeId: college.id,
        collegeName: college.name,
        program: 'General Application', // Could be made dynamic
        documents: selectedFiles.map((file) => file.name),
      };

      const response = await fetch('/server/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit application');
      }

      alert(`Application submitted to ${college.name}!`);
      setSelectedFilesByCollege((prev) => ({
        ...prev,
        [college.id]: [],
      }));
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading colleges...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading colleges: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 md:px-8 py-4 max-w-full mx-auto">
          {/* Left - Menu and Logo */}
          <div className="flex items-center gap-6">
            <Menu size={24} className="text-gray-900 cursor-pointer" />
            <button
              onClick={() => router.push('/StudentDashboard')}
              className="text-xl font-bold text-gray-900 hover:text-gray-700 transition"
            >
              COLLAPP
            </button>
          </div>

          {/* Right - Notification and Profile */}
          <div className="flex items-center gap-6">
            <Bell size={24} className="text-gray-900 cursor-pointer hover:text-gray-600 transition" />
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center cursor-pointer hover:bg-gray-700 transition"
              >
                <span className="text-white font-bold text-sm">J</span>
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 animate-in fade-in duration-200">
                  <button
                    onClick={() => {
                      alert('Viewing profile...');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-all duration-200 text-left"
                  >
                    <User size={18} className="text-gray-600" />
                    <span className="text-gray-900">View Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      alert('Opening settings...');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-all duration-200 text-left"
                  >
                    <Settings size={18} className="text-gray-600" />
                    <span className="text-gray-900">Settings</span>
                  </button>
                  <hr className="my-2" />
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      router.push('/');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 transition-all duration-200 text-left"
                  >
                    <LogOut size={18} className="text-red-600" />
                    <span className="text-red-600">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 md:px-8 py-8">
        <div className="max-w-4xl mx-auto bg-gray-200 rounded-2xl p-8">
          {/* Title Section */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">AVAILABLE COLLEGES</h1>

            {/* Search and Filter Bar */}
            <div className="flex gap-4 mb-8 bg-white rounded-xl p-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="SEARCH"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700">
                  ✕
                </button>
              </div>
              <button className="px-6 py-2 border border-gray-300 rounded-lg text-gray-900 font-medium hover:bg-gray-50 transition">
                REGION ▼
              </button>
            </div>
          </div>

          {/* Colleges List */}
          <div className="space-y-4">
            {colleges.map((college) => (
              <div
                key={college.id}
                className="bg-white border border-gray-300 rounded-xl p-6 hover:shadow-lg transition"
              >
                {/* Header with College Name and Status */}
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{college.name}</h3>
                  <span className="text-xs font-medium text-gray-600">{college.status}</span>
                </div>

                {/* Location and Description */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">{college.location}</p>
                  <p className="text-sm text-gray-700">{college.description}</p>
                </div>

                {/* Required Documents Section */}
                {college.requirements && college.requirements.length > 0 && (
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <p className="text-xs font-bold text-gray-900 mb-2">REQUIRED DOCUMENTS</p>
                    <div className="flex gap-2 flex-wrap">
                      {college.requirements.map((req, index) => (
                        <span key={index} className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded">
                          {req}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-4 pb-4 border-b border-gray-200">
                  <p className="text-xs font-bold text-gray-900 mb-2">UPLOAD DOCUMENTS</p>
                  <input
                    id={`documents-${college.id}`}
                    type="file"
                    multiple
                    onChange={(event) => handleFileChange(college.id, event)}
                    className="block w-full text-xs text-gray-700 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-100 file:px-4 file:py-2 file:font-semibold file:text-cyan-700 hover:file:bg-cyan-200"
                  />
                  {selectedFilesByCollege[college.id] && selectedFilesByCollege[college.id].length > 0 && (
                    <p className="mt-2 text-xs text-gray-600">
                      Selected: {selectedFilesByCollege[college.id].map((file) => file.name).join(', ')}
                    </p>
                  )}
                </div>

                {/* Deadline and Action Button */}
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-600">
                    Deadline: {college.applicationDeadline ? new Date(college.applicationDeadline).toLocaleDateString() : 'TBD'}
                  </p>
                  <button
                    onClick={() => handleApply(college)}
                    className={`px-6 py-2 rounded-full font-bold text-xs transition whitespace-nowrap ${getButtonColor(
                      college.buttonColor
                    )}`}
                  >
                    {college.buttonAction || 'APPLY'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
