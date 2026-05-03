'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Bell, LogOut, Settings, User } from 'lucide-react';

interface Applicant {
  id: number;
  initials: string;
  name: string;
  program: string;
  status: 'Pending' | 'Approved';
}

export default function SchoolRepPage() {
  const router = useRouter();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [applicants, setApplicants] = useState<Applicant[]>([
    { id: 1, initials: 'JD', name: 'John Doe', program: 'Computer Science', status: 'Pending' },
    { id: 2, initials: 'JS', name: 'Jane Smith', program: 'Business Administration', status: 'Pending' },
    { id: 3, initials: 'AS', name: 'Alice Smith', program: 'Arts', status: 'Approved' },
  ]);
  const [declinedApplicants, setDeclinedApplicants] = useState<Applicant[]>([]);
  const [showApproved, setShowApproved] = useState(false);
  const [showDeclined, setShowDeclined] = useState(false);
  const [approvedSearch, setApprovedSearch] = useState('');
  const [declinedSearch, setDeclinedSearch] = useState('');
  const [selectedApplicantId, setSelectedApplicantId] = useState<number | null>(null);

  const pendingCount = applicants.filter((applicant) => applicant.status === 'Pending').length;
  const pendingApplicants = applicants.filter((applicant) => applicant.status === 'Pending');
  const approvedApplicants = applicants.filter((applicant) => applicant.status === 'Approved');
  const filteredApprovedApplicants = approvedApplicants.filter((applicant) => {
    const search = approvedSearch.trim().toLowerCase();
    if (!search) return true;
    return (
      applicant.name.toLowerCase().includes(search) ||
      applicant.program.toLowerCase().includes(search)
    );
  });
  const filteredDeclinedApplicants = declinedApplicants.filter((applicant) => {
    const search = declinedSearch.trim().toLowerCase();
    if (!search) return true;
    return (
      applicant.name.toLowerCase().includes(search) ||
      applicant.program.toLowerCase().includes(search)
    );
  });
  const selectedApplicant =
    applicants.find((applicant) => applicant.id === selectedApplicantId) ?? null;

  const updateStatus = (id: number, status: 'Approved' | 'Pending') => {
    setApplicants((prev) =>
      prev.map((applicant) => (applicant.id === id ? { ...applicant, status } : applicant))
    );
  };

  const declineApplicant = (id: number) => {
    const applicant = applicants.find((item) => item.id === id);
    if (!applicant) return;

    setApplicants((prev) => prev.filter((item) => item.id !== id));
    setDeclinedApplicants((prev) =>
      prev.some((item) => item.id === id) ? prev : [...prev, { ...applicant, status: 'Pending' }]
    );
    setSelectedApplicantId(null);
  };

  const restoreApplicant = (id: number) => {
    const applicant = declinedApplicants.find((item) => item.id === id);
    if (!applicant) return;

    setDeclinedApplicants((prev) => prev.filter((item) => item.id !== id));
    setApplicants((prev) =>
      prev.some((item) => item.id === id) ? prev : [...prev, { ...applicant, status: 'Pending' }]
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-6 py-5 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center text-white">
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
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-xs font-semibold flex items-center justify-center">
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
                    onClick={() => {
                      setProfileDropdownOpen(false);
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
        <section className="rounded-[2rem] bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 p-8 text-white shadow-xl">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-300">Welcome back</p>
              <h2 className="mt-3 text-3xl font-semibold">School Rep dashboard</h2>
              <p className="mt-2 max-w-2xl text-slate-200 leading-7">
                Review student applications and decide who gets accepted.
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
                    <p className="font-semibold text-slate-900">{applicant.name}</p>
                    <p className="text-sm text-slate-600">Applied for {applicant.program}</p>
                  </div>
                </div>

                <div className="mt-4 md:mt-0 flex items-center gap-2">
                  <span className="rounded-full px-3 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800">
                    {applicant.status}
                  </span>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      updateStatus(applicant.id, 'Approved');
                    }}
                    className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600 transition"
                  >
                    Accept
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      declineApplicant(applicant.id);
                    }}
                    className="rounded-lg bg-rose-500 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-600 transition"
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
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                />
                {filteredApprovedApplicants.length === 0 ? (
                  <p className="text-sm text-slate-500">No approved applicants found.</p>
                ) : (
                  filteredApprovedApplicants.map((applicant) => (
                    <div
                      key={applicant.id}
                      onClick={() => setSelectedApplicantId(applicant.id)}
                      className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 flex items-center justify-between gap-3 cursor-pointer hover:shadow-sm transition"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{applicant.name}</p>
                        <p className="text-sm text-slate-600">Applied for {applicant.program}</p>
                      </div>
                      <span className="rounded-full px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700">
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
                        <p className="font-semibold text-slate-900">{applicant.name}</p>
                        <p className="text-sm text-slate-600">Applied for {applicant.program}</p>
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
                  <h3 className="mt-1 text-xl font-semibold text-slate-900">{selectedApplicant.name}</h3>
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
              <p className="text-sm text-slate-600">Applied program</p>
              <p className="mt-1 font-semibold text-slate-900">{selectedApplicant.program}</p>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  selectedApplicant.status === 'Approved'
                    ? 'bg-emerald-100 text-emerald-700'
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
              {selectedApplicant.status !== 'Approved' && (
                <button
                  onClick={() => declineApplicant(selectedApplicant.id)}
                  className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600"
                >
                  Decline
                </button>
              )}
              {selectedApplicant.status !== 'Approved' && (
                <button
                  onClick={() => updateStatus(selectedApplicant.id, 'Approved')}
                  className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
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
