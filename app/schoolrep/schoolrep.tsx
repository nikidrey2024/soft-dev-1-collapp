'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Bell, LogOut, Settings, User } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import './schoolrep.css';

interface Applicant {
  id: number;
  studentId: string;
  studentName: string;
  collegeId: number;
  collegeName: string;
  program: string;
  status: 'Pending' | 'Under Review' | 'Accepted' | 'Rejected';
  appliedDate: string;
  updatedAt: string;
  documents?: { name: string; url?: string | null }[];
  notes?: string;
  initials: string;
}


interface College {
  id: number;
  name: string;
  program?: string;
  description?: string;
  location: string;
  status: 'Available' | 'Unavailable';
  applicationDeadline?: string;
  requirements: string | string[];
  contactEmail?: string;
}

interface CollegeFormState {
  id: number;
  name: string;
  program: string;
  location: string;
  status: 'Available' | 'Unavailable';
  applicationDeadline: string;
  requirements: string;
  contactEmail: string;
}

export default function SchoolRepPage() {
  const router = useRouter();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [declinedApplicants, setDeclinedApplicants] = useState<Applicant[]>([]);
  const [showApproved, setShowApproved] = useState(false);
  const [showDeclined, setShowDeclined] = useState(false);
  const [approvedSearch, setApprovedSearch] = useState('');
  const [declinedSearch, setDeclinedSearch] = useState('');
  const [selectedApplicantId, setSelectedApplicantId] = useState<number | null>(null);
  const [collegeForm, setCollegeForm] = useState<CollegeFormState>({
    id: 0,
    name: '',
    program: '',
    location: '',
    status: 'Available',
    applicationDeadline: '',
    requirements: '',
    contactEmail: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [repCollegeName, setRepCollegeName] = useState<string | null>(null);

  const pendingCount = applicants.filter((applicant) => applicant.status === 'Pending' || applicant.status === 'Under Review').length;
  const pendingApplicants = applicants.filter((applicant) => applicant.status === 'Pending' || applicant.status === 'Under Review');
  const approvedApplicants = applicants.filter((applicant) => applicant.status === 'Accepted');
  const filteredApprovedApplicants = approvedApplicants.filter((applicant) => {
    const search = approvedSearch.trim().toLowerCase();
    if (!search) return true;
    return (
      applicant.studentName.toLowerCase().includes(search) ||
      applicant.program.toLowerCase().includes(search)
    );
  });
  const filteredDeclinedApplicants = declinedApplicants.filter((applicant) => {
    const search = declinedSearch.trim().toLowerCase();
    if (!search) return true;
    return (
      applicant.studentName.toLowerCase().includes(search) ||
      applicant.program.toLowerCase().includes(search)
    );
  });
  const selectedApplicant =
    applicants.find((applicant) => applicant.id === selectedApplicantId) ?? null;

  const updateStatus = async (id: number, status: 'Accepted' | 'Pending' | 'Rejected') => {
    try {
      const response = await fetch(`/server/applications?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update application status');
      }

      const updatedApplication: Applicant = await response.json();
      const mappedApplication = {
        ...updatedApplication,
        initials: updatedApplication.studentName.split(' ').map(n => n[0]).join('').toUpperCase(),
      };

      setApplicants((prev) =>
        prev.map((applicant) => (applicant.id === id ? mappedApplication : applicant))
      );

      // Update declinedApplicants if status changed to/from Rejected
      if (status === 'Rejected') {
        setDeclinedApplicants((prev) => [...prev, mappedApplication]);
      } else {
        setDeclinedApplicants((prev) => prev.filter((app) => app.id !== id));
      }
    } catch (err) {
      console.error('Error updating application status:', err);
      alert(err instanceof Error ? err.message : 'Could not update status');
    }
  };

  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    const verifyRep = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
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
          collegeId: number | null;
          collegeName: string | null;
        };
        if (profile.role !== 'school_rep') {
          router.replace('/');
          return;
        }
        if (profile.collegeId == null) {
          router.replace('/');
          return;
        }

        setRepCollegeName(profile.collegeName);
        setAuthReady(true);
      } catch {
        router.replace('/');
      }
    };

    verifyRep();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!authReady) return;

    const fetchColleges = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/server/colleges');
        if (!response.ok) {
          throw new Error('Failed to load colleges');
        }

        const data: College[] = await response.json();
        setColleges(data);
      } catch (err) {
        console.error('Error loading colleges:', err);
        setError(err instanceof Error ? err.message : 'Unable to load colleges');
      } finally {
        setLoading(false);
      }
    };

    fetchColleges();
  }, [authReady]);

  useEffect(() => {
    if (!authReady) return;

    const fetchApplications = async () => {
      try {
        const response = await fetch('/server/applications');
        if (!response.ok) {
          throw new Error('Failed to load applications');
        }

        const data: Applicant[] = await response.json();
        const mappedData = data.map((app) => ({
          ...app,
          initials: app.studentName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase(),
        }));
        setApplicants(mappedData);
        setDeclinedApplicants(mappedData.filter((app) => app.status === 'Rejected'));
      } catch (err) {
        console.error('Error loading applications:', err);
      }
    };

    fetchApplications();
  }, [authReady]);

  const toggleCollegeAvailability = async (id: number) => {
    const college = colleges.find((item) => item.id === id);
    if (!college) return;

    const updatedCollege: College = {
      ...college,
      status: college.status === 'Available' ? 'Unavailable' : 'Available',
    };

    try {
      const response = await fetch(`/server/colleges?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedCollege),
      });

      if (!response.ok) {
        throw new Error('Failed to update college availability');
      }

      const savedCollege: College = await response.json();
      setColleges((prev) => prev.map((item) => (item.id === id ? savedCollege : item)));
    } catch (err) {
      console.error('Error updating college availability:', err);
      alert(err instanceof Error ? err.message : 'Could not update availability');
    }
  };

  const handleCollegeFormChange = (field: keyof CollegeFormState, value: string) => {
    setCollegeForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetCollegeForm = () => {
    setCollegeForm({
      id: 0,
      name: '',
      program: '',
      location: '',
      status: 'Available',
      applicationDeadline: '',
      requirements: '',
      contactEmail: '',
    });
  };

  const saveCollege = async () => {
    if (!collegeForm.name || !collegeForm.program || !collegeForm.location) {
      alert('Name, program, and location are required.');
      return;
    }

    try {
      const payload = {
        name: collegeForm.name,
        program: collegeForm.program,
        location: collegeForm.location,
        status: collegeForm.status,
        applicationDeadline: collegeForm.applicationDeadline,
        requirements: collegeForm.requirements,
        contactEmail: collegeForm.contactEmail,
      };

      if (collegeForm.id === 0) {
        const response = await fetch('/server/colleges', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error('Failed to create college');
        }

        const createdCollege: College = await response.json();
        setColleges((prev) => [...prev, createdCollege]);
      } else {
        const response = await fetch(`/server/colleges?id=${collegeForm.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error('Failed to save college changes');
        }

        const updatedCollege: College = await response.json();
        setColleges((prev) => prev.map((item) => (item.id === updatedCollege.id ? updatedCollege : item)));
      }

      resetCollegeForm();
    } catch (err) {
      console.error('Error saving college:', err);
      alert(err instanceof Error ? err.message : 'Could not save college');
    }
  };

  const editCollege = (college: College) => {

    const requirements = Array.isArray(college.requirements)
      ? college.requirements.join(', ')
      : college.requirements || '';

    setCollegeForm({
      id: college.id,
      name: college.name,
      program: college.program || college.description || '',
      location: college.location,
      status: college.status,
      applicationDeadline: college.applicationDeadline ?? ' ',
      requirements,
      contactEmail: college.contactEmail ?? '',
    });
  };

  const declineApplicant = async (id: number) => {
    await updateStatus(id, 'Rejected');
    setSelectedApplicantId(null);
  };

  const restoreApplicant = async (id: number) => {
    await updateStatus(id, 'Pending');
  };

  const collegeListContent = loading ? (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
      Loading colleges...
    </div>
  ) : error ? (
    <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-700">
      {error}
    </div>
  ) : colleges.length === 0 ? (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
      No colleges found. Add one using the form.
    </div>
  ) : (
    colleges.map((college) => (
      <div key={college.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">{college.name}</p>
            <p className="text-xs text-slate-500">{college.program || college.description}</p>
            <p className="text-sm text-slate-600 mt-2">{college.location}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              college.status === 'Available'
                ? 'bg-gray-300 text-black'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            {college.status}
          </span>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Deadline</p>
            <p className="text-sm text-slate-700">{college.applicationDeadline || 'TBD'}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => toggleCollegeAvailability(college.id)}
              className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-900 transition"
            >
              {college.status === 'Available' ? 'Mark Unavailable' : 'Mark Available'}
            </button>
            <button
              onClick={() => editCollege(college)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    ))
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-6 py-5 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-slate-900 to-slate-700 flex items-center justify-center text-white">
              <Building2 size={24} />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">COLLAPP</p>
              <h1 className="text-xl font-semibold text-slate-900">School Representative Dashboard</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-50 transition">
              <Bell size={20} />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-black text-white text-xs font-semibold flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-semibold hover:bg-slate-800 transition"
              >
                SR
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
                  <button
                    onClick={() => {
                      alert('Viewing profile...');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-100 transition text-left"
                  >
                    <User size={18} className="text-slate-600" />
                    <span className="text-slate-900">View Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      alert('Opening settings...');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-100 transition text-left"
                  >
                    <Settings size={18} className="text-slate-600" />
                    <span className="text-slate-900">Settings</span>
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
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-rose-50 transition text-left"
                  >
                    <LogOut size={18} className="text-rose-600" />
                    <span className="text-rose-600">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <section className="rounded-4xl bg-linear-to-r from-slate-900 via-slate-800 to-slate-700 p-8 text-white shadow-xl">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-300">Welcome back</p>
              <h2 className="mt-3 text-3xl font-semibold">
                {repCollegeName ? `${repCollegeName} — Rep dashboard` : 'School Rep dashboard'}
              </h2>
              <p className="mt-2 max-w-2xl text-gray-200 leading-7">
                You only see applications for your campus. Students applying to other schools are hidden by design.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-4 text-slate-100 shadow-lg min-w-36">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-300">Pending</p>
              <p className="mt-3 text-3xl font-semibold">{pendingCount}</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                View applicants
              </p>
              <h3 className="text-2xl font-semibold text-slate-900 mt-2">Applicant list</h3>
            </div>
            <p className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              Pending requests: {pendingCount}
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Pending applicants ({pendingApplicants.length})
            </p>
            {pendingApplicants.map((applicant) => (
              <div
                key={applicant.id}
                onClick={() => setSelectedApplicantId(applicant.id)}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:p-5 md:flex md:items-center md:justify-between gap-4 cursor-pointer hover:border-slate-300 hover:shadow-sm transition"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-300 text-slate-700 font-semibold flex items-center justify-center">
                    {applicant.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{applicant.studentName}</p>
                    <p className="text-sm text-slate-600">Applied to {applicant.collegeName} for {applicant.program}</p>
                  </div>
                </div>

                <div className="mt-4 md:mt-0 flex items-center gap-2">
                  <span className="rounded-full px-3 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800">
                    {applicant.status}
                  </span>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      updateStatus(applicant.id, 'Accepted');
                    }}
                    className="rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800 transition"
                  >
                    Accept
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      declineApplicant(applicant.id);
                    }}
                    className="rounded-lg bg-gray-700 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800 transition"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}

            <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-slate-700">
                Approved applicants: {approvedApplicants.length}
              </p>
              <button
                onClick={() => setShowApproved((prev) => !prev)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                {showApproved ? 'Hide Approved' : 'View Approved'}
              </button>
            </div>

            {showApproved && (
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <input
                  type="text"
                  value={approvedSearch}
                  onChange={(event) => setApprovedSearch(event.target.value)}
                  placeholder="Search approved applicants"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
                {filteredApprovedApplicants.length === 0 ? (
                  <p className="text-sm text-slate-500">No approved applicants found.</p>
                ) : (
                  filteredApprovedApplicants.map((applicant) => (
                    <div
                      key={applicant.id}
                      onClick={() => setSelectedApplicantId(applicant.id)}
                      className="rounded-xl border border-gray-300 bg-gray-100 p-3 flex items-center justify-between gap-3 cursor-pointer hover:shadow-sm transition"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{applicant.studentName}</p>
                        <p className="text-sm text-slate-600">Applied to {applicant.collegeName} for {applicant.program}</p>
                      </div>
                      <span className="rounded-full px-3 py-1 text-xs font-semibold bg-gray-300 text-black">
                        {applicant.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-slate-700">
                Declined applicants: {declinedApplicants.length}
              </p>
              <button
                onClick={() => setShowDeclined((prev) => !prev)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                {showDeclined ? 'Hide Declined' : 'View Declined'}
              </button>
            </div>

            {showDeclined && (
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <input
                  type="text"
                  value={declinedSearch}
                  onChange={(event) => setDeclinedSearch(event.target.value)}
                  placeholder="Search declined applicants"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
                {filteredDeclinedApplicants.length === 0 ? (
                  <p className="text-sm text-slate-500">No declined applicants right now.</p>
                ) : (
                  filteredDeclinedApplicants.map((applicant) => (
                    <div
                      key={applicant.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{applicant.studentName}</p>
                        <p className="text-sm text-slate-600">Applied to {applicant.collegeName} for {applicant.program}</p>
                      </div>
                      <button
                        onClick={() => restoreApplicant(applicant.id)}
                        className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
                      >
                        Restore
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                College program management
              </p>
              <h3 className="text-2xl font-semibold text-slate-900 mt-2">Available colleges & programs</h3>
            </div>
            <button
              onClick={() => resetCollegeForm()}
              className="rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Add New Program
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              {collegeListContent}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                {collegeForm.id === 0 ? 'Create new college/program' : 'Edit college/program'}
              </p>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">College name</label>
                  <input
                    type="text"
                    value={collegeForm.name}
                    onChange={(event) => handleCollegeFormChange('name', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Program</label>
                  <input
                    type="text"
                    value={collegeForm.program}
                    onChange={(event) => handleCollegeFormChange('program', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Location</label>
                  <input
                    type="text"
                    value={collegeForm.location}
                    onChange={(event) => handleCollegeFormChange('location', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Deadline</label>
                  <input
                    type="date"
                    value={collegeForm.applicationDeadline}
                    onChange={(event) => handleCollegeFormChange('applicationDeadline', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Requirements</label>
                  <textarea
                    rows={3}
                    value={collegeForm.requirements}
                    onChange={(event) => handleCollegeFormChange('requirements', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="Comma-separated list"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Contact email</label>
                  <input
                    type="email"
                    value={collegeForm.contactEmail}
                    onChange={(event) => handleCollegeFormChange('contactEmail', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</label>
                  <select
                    value={collegeForm.status}
                    onChange={(event) => handleCollegeFormChange('status', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  >
                    <option value="Available">Available</option>
                    <option value="Unavailable">Unavailable</option>
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={saveCollege}
                    className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition"
                  >
                    {collegeForm.id === 0 ? 'Create College' : 'Save Changes'}
                  </button>
                  <button
                    onClick={resetCollegeForm}
                    className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {selectedApplicant && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedApplicantId(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-slate-300 text-slate-700 font-semibold flex items-center justify-center">
                  {selectedApplicant.initials}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Applicant details
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-slate-900">{selectedApplicant.studentName}</h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedApplicantId(null)}
                className="rounded-full px-2 py-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-600">Applied to</p>
              <p className="mt-1 font-semibold text-slate-900">{selectedApplicant.collegeName}</p>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-600">Applied program</p>
              <p className="mt-1 font-semibold text-slate-900">{selectedApplicant.program}</p>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-600">Submitted documents</p>
              {selectedApplicant.documents && selectedApplicant.documents.length > 0 ? (
                <ul className="mt-2 list-disc pl-5 text-sm text-slate-800 space-y-1">
                  {selectedApplicant.documents.map((documentName, index) => (
                    <li key={`${selectedApplicant.id}-${documentName.name}-${index}`}>
                      {documentName.url ? (
                        <a href={documentName.url} target="_blank" rel="noopener noreferrer" className="underline text-black">
                          {documentName.name}
                        </a>
                      ) : (
                        documentName.name
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-slate-500">No documents uploaded.</p>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  selectedApplicant.status === 'Accepted'
                    ? 'bg-gray-300 text-black'
                    : selectedApplicant.status === 'Rejected'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {selectedApplicant.status}
              </span>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setSelectedApplicantId(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
              {selectedApplicant.status !== 'Accepted' && selectedApplicant.status !== 'Rejected' && (
                <button
                  onClick={() => declineApplicant(selectedApplicant.id)}
                  className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                >
                  Decline
                </button>
              )}
              {selectedApplicant.status !== 'Accepted' && (
                <button
                  onClick={() => updateStatus(selectedApplicant.id, 'Accepted')}
                  className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                >
                  Accept
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
