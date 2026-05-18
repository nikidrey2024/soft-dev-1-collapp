'use client';

import { useState, useEffect, useMemo, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, CheckCircle, LogOut, Menu, Search, Settings, User, X } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

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

/** Matches GET /server/applications response for the signed-in student */
interface StudentApplication {
  id: number;
  collegeId: number;
  collegeName: string;
  program: string;
  status: 'Pending' | 'Under Review' | 'Accepted' | 'Rejected';
  appliedDate: string;
}

export default function StudentColleges() {
  const router = useRouter();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [colleges, setColleges] = useState<College[]>([]);
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilesByCollege, setSelectedFilesByCollege] = useState<Record<number, File[]>>({});
  const [avatarLetters, setAvatarLetters] = useState('S');
  const [searchQuery, setSearchQuery] = useState('');
  const [applySubmittingId, setApplySubmittingId] = useState<number | null>(null);

  const filteredColleges = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return colleges;
    return colleges.filter((c) => {
      const blob = [
        c.name,
        c.location,
        c.description,
        c.program ?? '',
        ...(c.requirements ?? []),
      ]
        .join(' ')
        .toLowerCase();
      return blob.includes(q);
    });
  }, [colleges, searchQuery]);

  /** Latest application per college (student may have multiple programs in theory). */
  const applicationByCollegeId = useMemo(() => {
    const map = new Map<number, StudentApplication>();
    const sorted = [...applications].sort(
      (a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime()
    );
    for (const app of sorted) {
      if (!map.has(app.collegeId)) {
        map.set(app.collegeId, app);
      }
    }
    return map;
  }, [applications]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const supabase = createSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        // Aborted effect (e.g. Strict Mode remount): never treat as "logged out".
        if (cancelled) return;

        if (!user) {
          setLoading(false);
          router.replace('/');
          return;
        }

        const profileRes = await fetch('/server/profile');
        if (cancelled) return;

        if (!profileRes.ok) {
          setLoading(false);
          router.replace('/');
          return;
        }

        const profile = (await profileRes.json()) as { role: string; fullName: string };
        if (cancelled) return;

        if (profile.role !== 'student') {
          setLoading(false);
          router.replace('/');
          return;
        }

        const name = profile.fullName?.trim() || 'Student';
        const parts = name.split(/\s+/).filter(Boolean);
        const letters =
          parts.length >= 2
            ? `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
            : name.slice(0, 2).toUpperCase();
        setAvatarLetters(letters || 'S');

        const [collegesResponse, appsResponse] = await Promise.all([
          fetch('/server/colleges?status=Available'),
          fetch('/server/applications'),
        ]);
        if (cancelled) return;

        if (!collegesResponse.ok) {
          throw new Error('Failed to fetch colleges');
        }
        const data = await collegesResponse.json();
        if (!cancelled) {
          setColleges(data);
        }

        if (!cancelled && appsResponse.ok) {
          const apps = (await appsResponse.json()) as StudentApplication[];
          setApplications(Array.isArray(apps) ? apps : []);
        }
      } catch (err) {
        console.error('Error fetching colleges:', err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'An error occurred');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const getButtonColor = () => {
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
    const selectedFiles = selectedFilesByCollege[college.id] || [];
    if (selectedFiles.length === 0) {
      alert('Please upload at least one document before applying.');
      return;
    }

    try {
      setApplySubmittingId(college.id);

      const applicationData = {
        collegeId: college.id,
        collegeName: college.name,
        program: college.program || college.description || 'General Application',
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
        const errBody = await response.json().catch(() => ({}));
        const msg =
          typeof errBody === 'object' && errBody !== null && 'error' in errBody
            ? String((errBody as { error?: string }).error)
            : 'Failed to submit application';
        throw new Error(msg);
      }

      alert(`Application submitted to ${college.name}!`);
      setSelectedFilesByCollege((prev) => ({
        ...prev,
        [college.id]: [],
      }));

      const refresh = await fetch('/server/applications');
      if (refresh.ok) {
        const apps = (await refresh.json()) as StudentApplication[];
        setApplications(Array.isArray(apps) ? apps : []);
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      alert(error instanceof Error ? error.message : 'Failed to submit application. Please try again.');
    } finally {
      setApplySubmittingId(null);
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
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
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
          {/* Left — brand */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-6">
            <Menu size={24} className="hidden text-gray-900 cursor-pointer md:block" aria-hidden />
            <button
              type="button"
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
                <span className="text-white font-bold text-sm">{avatarLetters}</span>
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
      <div className="px-6 md:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <button
            type="button"
            onClick={() => router.push('/StudentDashboard')}
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 hover:text-cyan-900 hover:underline"
          >
            <ArrowLeft size={16} aria-hidden />
            Back to main student dashboard
          </button>
        </div>
        <div className="max-w-4xl mx-auto bg-gray-200 rounded-2xl p-8">
          {/* Title Section */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">AVAILABLE COLLEGES</h1>

            {/* Search and Filter Bar */}
            <div className="flex flex-col gap-4 mb-2 sm:flex-row sm:items-stretch">
              <div className="flex flex-1 gap-2 rounded-xl bg-white p-4">
                <div className="relative min-w-0 flex-1">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
                    aria-hidden
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by college name, location, or program…"
                    autoComplete="off"
                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                    aria-label="Search colleges"
                  />
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                      aria-label="Clear search"
                    >
                      <X size={18} />
                    </button>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-xl border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-900 opacity-60"
                title="Region filter coming soon"
                disabled
              >
                REGION ▼
              </button>
            </div>
            <p className="mb-8 text-xs text-gray-600">
              {searchQuery.trim()
                ? `${filteredColleges.length} of ${colleges.length} colleges match your search`
                : `${colleges.length} colleges available`}
            </p>
          </div>

          {/* Colleges List */}
          <div className="space-y-4">
            {colleges.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
                <p className="text-base font-semibold text-gray-900">No colleges available</p>
                <p className="mt-2 text-sm text-gray-600">Check back later or contact support.</p>
              </div>
            ) : filteredColleges.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
                <p className="text-base font-semibold text-gray-900">No colleges match your search</p>
                <p className="mt-2 text-sm text-gray-600">Try different keywords or clear the search box.</p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-600"
                >
                  Clear search
                </button>
              </div>
            ) : (
              filteredColleges.map((college) => {
                const existingApp = applicationByCollegeId.get(college.id);
                const fileCount = selectedFilesByCollege[college.id]?.length ?? 0;
                const canApply = fileCount > 0 && applySubmittingId !== college.id;

                return (
              <div
                key={college.id}
                className={`bg-white border border-gray-300 rounded-xl p-6 transition ${
                  existingApp ? 'border-emerald-200 ring-1 ring-emerald-100' : 'hover:shadow-lg'
                }`}
              >
                {/* Header with College Name and Status */}
                <div className="flex justify-between items-start mb-4 gap-3">
                  <h3 className="text-lg font-semibold text-gray-900">{college.name}</h3>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-xs font-medium text-gray-600">{college.status}</span>
                    {existingApp ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                        <CheckCircle className="size-3.5" aria-hidden />
                        Applied
                      </span>
                    ) : null}
                  </div>
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

                {existingApp ? (
                  <div className="rounded-xl border border-gray-300 bg-gray-100 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-black">
                      Application on file
                    </p>
                    <p className="mt-1 text-sm text-black">
                      Status: <span className="font-semibold">{existingApp.status}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-gray-700">
                      Program: {existingApp.program}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-600">
                      Submitted {new Date(existingApp.appliedDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <p className="text-xs font-bold text-gray-900 mb-1">UPLOAD DOCUMENTS</p>
                      <p className="mb-2 text-xs text-gray-500">
                        You must attach at least one file before you can submit your application.
                      </p>
                      <input
                        id={`documents-${college.id}`}
                        type="file"
                        multiple
                        onChange={(event) => handleFileChange(college.id, event)}
                        disabled={applySubmittingId === college.id}
                        className="block w-full text-xs text-gray-700 file:mr-4 file:rounded-full file:border-0 file:bg-gray-200 file:px-4 file:py-2 file:font-semibold file:text-black hover:file:bg-gray-300 disabled:opacity-50"
                      />
                      {fileCount > 0 ? (
                        <p className="mt-2 text-xs text-gray-600">
                          Selected: {selectedFilesByCollege[college.id]!.map((file) => file.name).join(', ')}
                        </p>
                      ) : (
                        <p className="mt-2 text-xs text-black bg-gray-200 border border-gray-300 rounded-lg px-2 py-1.5 inline-block">
                          No files selected yet — Apply stays disabled until you add at least one.
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-gray-600">
                        Deadline:{' '}
                        {college.applicationDeadline
                          ? new Date(college.applicationDeadline).toLocaleDateString()
                          : 'TBD'}
                      </p>
                      <button
                        type="button"
                        onClick={() => void handleApply(college)}
                        disabled={!canApply}
                        title={
                          fileCount === 0
                            ? 'Upload at least one document to apply'
                            : undefined
                        }
                        className={`px-6 py-2 rounded-full font-bold text-xs transition whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-45 ${getButtonColor()}`}
                      >
                        {applySubmittingId === college.id
                          ? 'Submitting…'
                          : college.buttonAction || 'APPLY'}
                      </button>
                    </div>
                  </>
                )}
              </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
