'use client';

import { FormEvent, useEffect, useState } from 'react';

type CollegeOption = { id: number; name: string };

export default function AdminCreateSchoolRepPage() {
  const [colleges, setColleges] = useState<CollegeOption[]>([]);
  const [loadingColleges, setLoadingColleges] = useState(true);
  const [collegeId, setCollegeId] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/server/colleges');
        if (!res.ok) throw new Error('Could not load colleges');
        const data = (await res.json()) as CollegeOption[];
        if (!cancelled) setColleges(data);
      } catch {
        if (!cancelled) setError('Failed to load colleges.');
      } finally {
        if (!cancelled) setLoadingColleges(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleCollegeChange = (value: string) => {
    setCollegeId(value);
    const college = colleges.find((c) => String(c.id) === value);
    setSchoolName(college?.name ?? '');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setStatus(null);

    const parsedCollegeId = Number(collegeId);
    if (!email.trim() || !password || !username.trim() || !Number.isFinite(parsedCollegeId)) {
      setError('Please complete the college, email, password, and username fields.');
      return;
    }

    const res = await fetch('/server/admin/school-reps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim(),
        password,
        username: username.trim(),
        fullName: fullName.trim(),
        collegeId: parsedCollegeId,
      }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(typeof body.error === 'string' ? body.error : 'Could not create school rep account.');
      return;
    }

    const schoolLabel = schoolName || `college ID ${parsedCollegeId}`;
    setStatus(`Account created for ${schoolLabel}. Share the assigned email/password with the school rep dashboard user.`);
    setEmail('');
    setPassword('');
    setUsername('');
    setFullName('');
    setCollegeId('');
    setSchoolName('');
  };

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
        <h1 className="text-3xl font-semibold text-slate-950">Create school rep dashboard accounts</h1>
        <p className="mt-2 text-sm text-slate-600">
          You can assign the login email and temporary password for their school rep dashboard account.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">
            School / College
            <select
              required
              value={collegeId}
              onChange={(event) => handleCollegeChange(event.target.value)}
              disabled={loadingColleges}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="">Select a school…</option>
              {colleges.map((college) => (
                <option key={college.id} value={college.id}>
                  {college.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Assigned email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Assigned temporary password
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Username
            <input
              type="text"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Full name
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />
          </label>

          <div className="sm:col-span-2">
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {status ? <p className="text-sm text-emerald-700">{status}</p> : null}

            <button
              type="submit"
              className="mt-4 inline-flex items-center rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Create school rep account
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
