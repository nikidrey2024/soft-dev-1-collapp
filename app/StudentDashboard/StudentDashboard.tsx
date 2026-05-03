'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, CheckCircle, Clock, MapPin, Bell, LogOut, Settings, User, Menu } from 'lucide-react';
import './StudentDashboard.css';

interface ApplicationStats {
  id: number;
  title: string;
  count: number;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
}

interface Application {
  id: number;
  universityName: string;
  program: string;
  status: 'Accepted' | 'Under Review' | 'Pending';
}

export default function StudentDashboard() {
  const router = useRouter();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [selectedStat, setSelectedStat] = useState<ApplicationStats | null>(null);
  const [applications, setApplications] = useState<Application[]>([
    {
      id: 1,
      universityName: 'Ateneo de Manila University',
      program: 'Business Administration',
      status: 'Under Review',
    },
    {
      id: 2,
      universityName: 'De La Salle University',
      program: 'Industrial Engineering',
      status: 'Accepted',
    },
  ]);

  const [stats] = useState<ApplicationStats[]>([
    {
      id: 1,
      title: 'TOTAL APPLICATIONS',
      count: 2,
      icon: <FileText size={40} className="text-gray-700" strokeWidth={1.5} />,
      bgColor: 'bg-gray-300',
      textColor: 'text-gray-900',
    },
    {
      id: 2,
      title: 'ACCEPTED',
      count: 1,
      icon: <CheckCircle size={40} className="text-white" strokeWidth={1.5} />,
      bgColor: 'bg-linear-to-r from-emerald-400 to-green-500',
      textColor: 'text-white',
    },
    {
      id: 3,
      title: 'UNDER REVIEW',
      count: 1,
      icon: <Clock size={40} className="text-gray-900" strokeWidth={1.5} />,
      bgColor: 'bg-yellow-300',
      textColor: 'text-gray-900',
    },
    {
      id: 4,
      title: 'AVAILABLE COLLEGES',
      count: 3,
      icon: <MapPin size={40} className="text-gray-700" strokeWidth={1.5} />,
      bgColor: 'bg-gray-300',
      textColor: 'text-gray-900',
    },
  ]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Accepted':
        return 'bg-linear-to-r from-emerald-400 to-green-500 text-white';
      case 'Under Review':
        return 'bg-yellow-300 text-gray-900';
      case 'Pending':
        return 'bg-gray-300 text-gray-900';
      default:
        return 'bg-gray-200 text-gray-900';
    }
  };

  const handleApplicationClick = (id: number) => {
    alert(`Application ${id} - More details opening soon!`);
  };

  const handleStatClick = (stat: ApplicationStats) => {
    if (stat.title === 'AVAILABLE COLLEGES') {
      router.push('/Colleges');
      return;
    }
    setSelectedStat(stat);
  };

  const getStatPillStyle = (title: string) => {
    switch (title) {
      case 'ACCEPTED':
        return 'bg-linear-to-r from-emerald-400 to-green-500 text-white';
      case 'UNDER REVIEW':
        return 'bg-yellow-300 text-gray-900';
      case 'AVAILABLE COLLEGES':
        return 'bg-cyan-100 text-cyan-700';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  const getHighlightedApplication = (title: string) => {
    if (title === 'ACCEPTED') {
      return applications.find((app) => app.status === 'Accepted') ?? null;
    }

    if (title === 'UNDER REVIEW') {
      return applications.find((app) => app.status === 'Under Review') ?? null;
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navbar */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 md:px-8 py-4">
          {/* Left - COLLAPP Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 border-2 border-black bg-white flex items-center justify-start pl-2 clip-path-polygon"
            >
              <div className="w-1.5 h-full bg-black rounded-full"></div>
            </div>
            <span className="text-lg font-bold text-gray-900">COLLAPP</span>
          </div>

          {/* Right - Notification and Profile */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <button className="relative p-2 hover:bg-gray-100 rounded-full transition-all duration-200">
              <Bell size={24} className="text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-full transition-all duration-200"
              >
                <div className="w-8 h-8 bg-linear-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  JD
                </div>
              </button>

              {/* Dropdown Menu */}
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
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          STUDENT
        </h1>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
          DASHBOARD
        </h2>
      </div>

      <div className="grid gap-6 mb-8 md:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-3xl border border-gray-200 bg-slate-50 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Student profile
          </p>
          <h3 className="mt-4 text-2xl font-bold text-slate-900">Welcome, None</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            This student dashboard is a UI placeholder for future interactive features, with student name and next feature design points.
          </p>
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between rounded-2xl bg-white p-4 border border-gray-200">
              <span className="text-sm font-medium text-slate-600">Student name</span>
              <span className="text-sm font-semibold text-slate-900">None</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-white p-4 border border-gray-200">
              <span className="text-sm font-medium text-slate-600">Current feature</span>
              <span className="text-sm font-semibold text-slate-900">College match preview</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Next feature
          </p>
          <h3 className="mt-4 text-xl font-semibold text-slate-900">Application roadmap</h3>
          <p className="mt-3 text-sm text-slate-600">
            Future interactions will guide students from school shortlist to submission tracking and personalized planning.
          </p>
          <div className="mt-6 grid gap-3">
            <div className="rounded-2xl bg-slate-50 p-4 border border-gray-200">
              <p className="text-sm font-semibold text-slate-900">Review deadlines</p>
              <p className="text-xs text-slate-500 mt-1">Track your next tasks in one place.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 border border-gray-200">
              <p className="text-sm font-semibold text-slate-900">Guidance tools</p>
              <p className="text-xs text-slate-500 mt-1">Add planning helpers and reminders here.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="space-y-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.id}
            onClick={() => handleStatClick(stat)}
            className={`${stat.bgColor} ${stat.textColor} rounded-2xl p-6 flex items-center justify-between transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer`}
          >
            <div>
              <p className="text-sm font-semibold tracking-wide opacity-80">
                {stat.title}
              </p>
              <p className="text-5xl font-bold mt-2">{stat.count}</p>
            </div>
            <div className="text-right">{stat.icon}</div>
          </div>
        ))}
      </div>

      {/* Recent Applications */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          RECENT APPLICATIONS
        </h3>

        <div className="space-y-4">
          {applications.map((app) => (
            <button
              key={app.id}
              onClick={() => handleApplicationClick(app.id)}
              className="w-full bg-gray-100 hover:bg-gray-200 rounded-xl p-4 flex items-center justify-between transition-all duration-200 transform hover:scale-105 active:scale-95 text-left border border-gray-200 hover:border-gray-300"
            >
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {app.universityName}
                </p>
                <p className="text-sm text-gray-600 mt-1">{app.program}</p>
              </div>
              <span
                className={`${getStatusBadgeColor(
                  app.status
                )} px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ml-4`}
              >
                {app.status}
              </span>
            </button>
          ))}
        </div>

      </div>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <p className="text-sm text-gray-600 mb-6">COLLAPP</p>

        <div className="grid grid-cols-3 gap-8 md:gap-16 mb-8">
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-3">Topics</p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <a href="#" className="hover:text-gray-900">
                  Page
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-gray-900">
                  Page
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-gray-900">
                  Page
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-3">Topic</p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <a href="#" className="hover:text-gray-900">
                  Page
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-gray-900">
                  Page
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-gray-900">
                  Page
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-3">Topic</p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <a href="#" className="hover:text-gray-900">
                  Page
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-gray-900">
                  Page
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-gray-900">
                  Page
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex gap-4">
          <a href="#" className="text-gray-400 hover:text-gray-600">
            <span className="text-xl">f</span>
          </a>
          <a href="#" className="text-gray-400 hover:text-gray-600">
            <span className="text-xl">in</span>
          </a>
          <a href="#" className="text-gray-400 hover:text-gray-600">
            <span className="text-xl">tw</span>
          </a>
          <a href="#" className="text-gray-400 hover:text-gray-600">
            <span className="text-xl">ig</span>
          </a>
        </div>
      </div>
      </div>

      {selectedStat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            {(() => {
              const highlightedApplication = getHighlightedApplication(selectedStat.title);

              return (
                <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                  Dashboard stat
                </p>
                <h3 className="mt-2 text-xl font-bold text-gray-900">{selectedStat.title}</h3>
                <span
                  className={`${getStatPillStyle(
                    selectedStat.title
                  )} mt-3 inline-flex rounded-full px-4 py-1 text-xs font-semibold`}
                >
                  {selectedStat.title === 'TOTAL APPLICATIONS' ? 'Total Applications' : selectedStat.title}
                </span>
                {highlightedApplication && (
                  <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-sm font-semibold text-gray-900">{highlightedApplication.universityName}</p>
                    <p className="mt-1 text-xs text-gray-600">{highlightedApplication.program}</p>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedStat(null)}
                className="rounded-full px-2 py-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <p className="mt-4 text-sm text-gray-600">
              You currently have <span className="font-semibold text-gray-900">{selectedStat.count}</span>{' '}
              item(s) in this category. Data details will be connected once Supabase is ready.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setSelectedStat(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                Close
              </button>
              {selectedStat.title === 'AVAILABLE COLLEGES' && (
                <button
                  onClick={() => {
                    setSelectedStat(null);
                    router.push('/Colleges');
                  }}
                  className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-600"
                >
                  Go to Colleges
                </button>
              )}
            </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}