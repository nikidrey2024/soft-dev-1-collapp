'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { FileText, CheckCircle, Clock, MapPin, Bell, LogOut, Settings, User, RefreshCw } from 'lucide-react';
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
  studentId: string;
  studentName: string;
  collegeId: number;
  collegeName: string;
  program: string;
  status: 'Accepted' | 'Under Review' | 'Pending' | 'Rejected';
  appliedDate: string;
  updatedAt: string;
  documents?: string[];
  notes?: string;
}

interface College {
  id: number;
  name: string;
  location: string;
  description: string;
  status: 'Available' | 'Unavailable';
  applicationDeadline?: string;
  requirements?: string[];
  contactEmail?: string;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [selectedStat, setSelectedStat] = useState<ApplicationStats | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentName, setStudentName] = useState('Student');
  const [avatarLetters, setAvatarLetters] = useState('S');
  const [sessionReady, setSessionReady] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    username: '',
    description: '',
    status: 'Active Student',
  });
  const [bioDraft, setBioDraft] = useState('');
  const [editingBio, setEditingBio] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const applicationsResponse = await fetch('/server/applications');
      if (!applicationsResponse.ok) {
        throw new Error('Failed to fetch applications');
      }
      const applicationsData = await applicationsResponse.json();
      setApplications(applicationsData);

      const collegesResponse = await fetch('/server/colleges?status=Available');
      if (!collegesResponse.ok) {
        throw new Error('Failed to fetch colleges');
      }
      const collegesData = await collegesResponse.json();
      setColleges(collegesData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    const verifyStudent = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace('/');
          return;
        }

        const profileRes = await fetch('/server/profile');
        if (!profileRes.ok) {
          router.replace('/');
          return;
        }

        const profile = (await profileRes.json()) as {
          role: string;
          fullName: string;
          username?: string;
          description?: string;
          status?: string;
        };
        if (profile.role !== 'student') {
          router.replace('/');
          return;
        }

        const name = profile.fullName?.trim() || 'Student';
        const parts = name.split(' ');
        setStudentName(name);
        setAvatarLetters(
          parts.length >= 2
            ? `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
            : name.slice(0, 2).toUpperCase()
        );
        setProfileData({
          username: profile.username ?? '',
          description: profile.description ?? '',
          status: profile.status ?? 'Active Student',
        });
        setBioDraft(profile.description ?? '');
        setSessionReady(true);
      } catch {
        router.replace('/');
      }
    };

    verifyStudent();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!sessionReady) return;
    fetchData();
  }, [sessionReady, fetchData]);

  useEffect(() => {
    if (!sessionReady) return;
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, [sessionReady, fetchData]);

  const totalApplications = applications.length;
  const acceptedApplications = applications.filter(
    (app) => app.status === 'Accepted'
  ).length;
  const underReviewApplications = applications.filter(
    (app) => app.status === 'Under Review'
  ).length;
  const availableColleges = colleges.length;

  const stats: ApplicationStats[] = [
    {
      id: 1,
      title: 'TOTAL APPLICATIONS',
      count: totalApplications,
      icon: <FileText size={40} className="text-gray-700" strokeWidth={1.5} />,
      bgColor: 'bg-gray-300',
      textColor: 'text-gray-900',
    },
    {
      id: 2,
      title: 'ACCEPTED',
      count: acceptedApplications,
      icon: <CheckCircle size={40} className="text-white" strokeWidth={1.5} />,
      bgColor: 'bg-linear-to-r from-gray-700 to-black',
      textColor: 'text-white',
    },
    {
      id: 3,
      title: 'UNDER REVIEW',
      count: underReviewApplications,
      icon: <Clock size={40} className="text-gray-900" strokeWidth={1.5} />,
      bgColor: 'bg-gray-300',
      textColor: 'text-gray-900',
    },
    {
      id: 4,
      title: 'AVAILABLE COLLEGES',
      count: availableColleges,
      icon: <MapPin size={40} className="text-gray-700" strokeWidth={1.5} />,
      bgColor: 'bg-gray-300',
      textColor: 'text-gray-900',
    },
  ];


  const renderDataStateCard = ({
    title,
    description,
    ctaLabel,
    onCta,
  }: {
    title: string;
    description: string;
    ctaLabel: string;
    onCta: () => void;
  }) => (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Data status</p>
      <h3 className="mt-3 text-xl font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      <button
        type="button"
        onClick={onCta}
        className="mt-5 rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        {ctaLabel}
      </button>
    </div>
  );

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Accepted':
        return 'bg-linear-to-r from-gray-700 to-black text-white';
      case 'Under Review':
        return 'bg-gray-300 text-gray-900';
      case 'Pending':
        return 'bg-gray-300 text-gray-900';
      case 'Rejected':
        return 'bg-gray-400 text-black';
      default:
        return 'bg-gray-200 text-gray-900';
    }
  };

  const handleApplicationClick = (id: number) => {
    alert(`Application ${id} - More details opening soon!`);
  };

  const saveBio = async () => {
    if (profileSaving) return;
    setProfileSaving(true);
    setProfileMessage('');
    const res = await fetch('/server/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: bioDraft.trim() }),
    });
    if (!res.ok) {
      setProfileMessage('Failed to save bio. Please try again.');
      setProfileSaving(false);
      return;
    }
    setProfileData((prev) => ({ ...prev, description: bioDraft.trim() }));
    setProfileMessage('Bio saved.');
    setEditingBio(false);
    setProfileSaving(false);
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
        return 'bg-linear-to-r from-gray-700 to-black text-white';
      case 'UNDER REVIEW':
        return 'bg-gray-300 text-gray-900';
      case 'AVAILABLE COLLEGES':
        return 'bg-gray-300 text-black';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-6 md:p-8">
        <div className="mx-auto grid max-w-3xl gap-6">
          <div className="h-52 animate-pulse rounded-3xl border border-slate-200 bg-slate-100" />
          <div className="h-28 animate-pulse rounded-3xl border border-slate-200 bg-slate-100" />
          <div className="h-28 animate-pulse rounded-3xl border border-slate-200 bg-slate-100" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white p-6 md:p-8">
        <div className="mx-auto max-w-3xl">
          {renderDataStateCard({
            title: 'We could not load your dashboard',
            description: 'Your data is safe. Refresh the dashboard to try again.',
            ctaLabel: 'Retry loading dashboard',
            onCta: fetchData,
          })}
        </div>
      </div>
    );
  }

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
            {/* Refresh Button */}
            <button
              onClick={fetchData}
              className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200"
              title="Refresh data"
            >
              <RefreshCw size={20} className="text-gray-600" />
            </button>

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
                  {avatarLetters}
                </div>
              </button>

              {/* Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 animate-in fade-in duration-200">
                  <button
                    onClick={() => {
                      setProfileModalOpen(true);
                      setEditingBio(false);
                      setProfileMessage('');
                      setBioDraft(profileData.description);
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-all duration-200 text-left"
                  >
                    <User size={18} className="text-gray-600" />
                    <span className="text-gray-900">View Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      router.push('/settings');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-all duration-200 text-left"
                  >
                    <Settings size={18} className="text-gray-600" />
                    <span className="text-gray-900">Settings</span>
                  </button>
                  <hr className="my-2" />
                  <button
                    onClick={async () => {
                      setProfileDropdownOpen(false);
                      try {
                        const supabase = createSupabaseBrowserClient();
                        await supabase.auth.signOut();
                      } catch {
                        /* still navigate home */
                      }
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
          <h3 className="mt-4 text-2xl font-bold text-slate-900">Welcome, {studentName}</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            This student dashboard shows your active application summary in real time.
          </p>
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between rounded-2xl bg-white p-4 border border-gray-200">
              <span className="text-sm font-medium text-slate-600">Student name</span>
              <span className="text-sm font-semibold text-slate-900">{studentName}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-4 border border-gray-200">
                <p className="text-sm font-medium text-slate-600">Total applications</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{totalApplications}</p>
              </div>
              <div className="rounded-2xl bg-white p-4 border border-gray-200">
                <p className="text-sm font-medium text-slate-600">Accepted</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{acceptedApplications}</p>
              </div>
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
              {stat.title === 'AVAILABLE COLLEGES' && colleges.length > 0 && (
                <p className="mt-2 text-sm text-slate-700">
                  {colleges.slice(0, 3).map((college) => college.name).join(', ')}
                  {colleges.length > 3 ? `, +${colleges.length - 3} more` : ''}
                </p>
              )}
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
          {applications.length === 0 ? (
            renderDataStateCard({
              title: "No applications yet",
              description: "Start your first application to track updates here.",
              ctaLabel: "Browse colleges",
              onCta: () => router.push("/Colleges"),
            })
          ) : applications.map((app) => (
            <button
              key={app.id}
              onClick={() => handleApplicationClick(app.id)}
              className="w-full bg-gray-100 hover:bg-gray-200 rounded-xl p-4 flex items-center justify-between transition-all duration-200 transform hover:scale-105 active:scale-95 text-left border border-gray-200 hover:border-gray-300"
            >
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {app.collegeName}
                </p>
                <p className="text-sm text-gray-600 mt-1">{app.program}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Applied: {new Date(app.appliedDate).toLocaleDateString()}
                </p>
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
                    <p className="text-sm font-semibold text-gray-900">{highlightedApplication.collegeName}</p>
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
              {selectedStat.title === 'AVAILABLE COLLEGES' ? (
                <>There are <span className="font-semibold text-gray-900">{selectedStat.count}</span> colleges currently open for application.</>
              ) : (
                <>You currently have <span className="font-semibold text-gray-900">{selectedStat.count}</span>{' '}item(s) in this category.</>
              )}
            </p>

            {selectedStat.title === 'AVAILABLE COLLEGES' && colleges.length > 0 && (
              <div className="mt-4 rounded-2xl border border-gray-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Open colleges</p>
                <ul className="mt-3 space-y-3 text-sm text-slate-700">
                  {colleges.slice(0, 4).map((college) => (
                    <li key={college.id} className="rounded-2xl bg-white p-3 border border-slate-200">
                      <p className="font-semibold text-slate-900">{college.name}</p>
                      <p className="text-xs text-slate-500">{college.location}</p>
                    </li>
                  ))}
                  {colleges.length > 4 && (
                    <li className="text-xs text-slate-500">and {colleges.length - 4} more available colleges...</li>
                  )}
                </ul>
              </div>
            )}

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

      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Student Profile</h3>
              <button onClick={() => setProfileModalOpen(false)} className="text-sm text-gray-600 hover:text-gray-900">Close</button>
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-500">Username</p>
                <p className="text-sm font-semibold text-gray-900">{profileData.username || '-'}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-500">Description</p>
                <p className="text-sm text-gray-900">Student account profile</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-500">Status</p>
                <p className="text-sm font-semibold text-gray-900">{profileData.status}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">Bio</p>
                  {!editingBio && (
                    <button className="text-xs font-semibold text-blue-700 hover:text-blue-900" onClick={() => setEditingBio(true)}>
                      Edit Profile
                    </button>
                  )}
                </div>
                {editingBio ? (
                  <div className="mt-2">
                    <textarea
                      className="w-full rounded border border-gray-300 p-2 text-sm"
                      rows={4}
                      value={bioDraft}
                      onChange={(e) => setBioDraft(e.target.value)}
                    />
                    <div className="mt-2 flex gap-2">
                      <button onClick={saveBio} disabled={profileSaving} className="rounded bg-black px-3 py-1 text-xs font-semibold text-white disabled:opacity-60">
                        {profileSaving ? 'Saving...' : 'Save'}
                      </button>
                      <button onClick={() => { setEditingBio(false); setBioDraft(profileData.description); }} className="rounded border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">{profileData.description || 'No bio yet.'}</p>
                )}
              </div>
            </div>
            {profileMessage && <p className="mt-3 text-sm text-gray-700">{profileMessage}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
