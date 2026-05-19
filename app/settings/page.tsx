'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type ProfileData = {
  role: 'student' | 'school_rep' | 'admin';
  fullName: string;
  description: string;
  address: string;
  avatarUrl: string | null;
  email: string;
  collegeName?: string;
  collegeDescription?: string;
  collegeAddress?: string;
  collegeLogoUrl?: string | null;
};

type FieldErrors = Partial<Record<'fullName' | 'email' | 'avatarUrl' | 'password' | 'schoolLogoUrl' | 'form', string>>;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const mapProfileServerError = (status: number, message?: string) => {
  const lower = (message ?? '').toLowerCase();
  if (status === 401 || lower.includes('unauthorized')) return 'Your session expired. Please sign in again.';
  if (status === 404 || lower.includes('profile not found')) return 'We could not find your profile. Please contact support.';
  if (lower.includes('invalid email')) return 'Please enter a valid email address.';
  if (lower.includes('already') && lower.includes('email')) return 'That email address is already in use.';
  if (lower.includes('password') && (lower.includes('weak') || lower.includes('least'))) {
    return 'Password is too weak. Use at least 8 characters with uppercase, lowercase, and a number.';
  }
  return 'Unable to save settings right now. Please try again.';
};

export default function SettingsPage() {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string>>({});
  const [role, setRole] = useState<'student' | 'school_rep' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/server/profile');
      if (!res.ok) {
        router.replace('/');
        return;
      }

      const data = (await res.json()) as ProfileData;
      if (data.role !== 'student' && data.role !== 'school_rep') {
        router.replace('/');
        return;
      }

      setRole(data.role);
      setForm({
        fullName: data.fullName ?? '',
        description: data.description ?? '',
        address: data.address ?? '',
        avatarUrl: data.avatarUrl ?? '',
        email: data.email ?? '',
        password: '',
        schoolName: data.collegeName ?? '',
        schoolDescription: data.collegeDescription ?? '',
        schoolAddress: data.collegeAddress ?? '',
        schoolLogoUrl: data.collegeLogoUrl ?? '',
      });
      setLoading(false);
    };

    load();
  }, [router]);

  const focusFirstInvalid = (nextErrors: FieldErrors) => {
    const order: Array<keyof FieldErrors> = ['fullName', 'email', 'avatarUrl', 'password', 'schoolLogoUrl'];
    const first = order.find((field) => nextErrors[field]);
    if (!first) return;
    const el = document.getElementById(first);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    (el as HTMLInputElement | null)?.focus();
  };

  const validate = () => {
    const nextErrors: FieldErrors = {};
    const normalizedEmail = (form.email ?? '').trim().toLowerCase();
    const normalizedAvatarUrl = (form.avatarUrl ?? '').trim();
    const normalizedSchoolLogoUrl = (form.schoolLogoUrl ?? '').trim();

    if (!(form.fullName ?? '').trim()) nextErrors.fullName = 'Name is required.';

    if (!normalizedEmail) {
      nextErrors.email = 'Email is required.';
    } else if (!EMAIL_REGEX.test(normalizedEmail)) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (normalizedAvatarUrl && !isValidHttpUrl(normalizedAvatarUrl)) {
      nextErrors.avatarUrl = 'Profile picture URL must be a valid http(s) URL.';
    }

    const password = (form.password ?? '').trim();
    if (password) {
      const strong = password.length >= 8 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password);
      if (!strong) nextErrors.password = 'Use at least 8 characters with uppercase, lowercase, and a number.';
    }

    if (role === 'school_rep' && normalizedSchoolLogoUrl && !isValidHttpUrl(normalizedSchoolLogoUrl)) {
      nextErrors.schoolLogoUrl = 'School logo URL must be a valid http(s) URL.';
    }

    return { nextErrors, normalizedEmail, normalizedAvatarUrl, normalizedSchoolLogoUrl };
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const { nextErrors, normalizedEmail, normalizedAvatarUrl, normalizedSchoolLogoUrl } = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setMessage('Please fix the highlighted fields.');
      focusFirstInvalid(nextErrors);
      return;
    }

    setSaving(true);
    setMessage('');
    setErrors({});

    const payload = {
      ...form,
      fullName: (form.fullName ?? '').trim(),
      description: (form.description ?? '').trim(),
      address: (form.address ?? '').trim(),
      schoolName: (form.schoolName ?? '').trim(),
      schoolDescription: (form.schoolDescription ?? '').trim(),
      schoolAddress: (form.schoolAddress ?? '').trim(),
      email: normalizedEmail,
      avatarUrl: normalizedAvatarUrl,
      schoolLogoUrl: normalizedSchoolLogoUrl,
      password: (form.password ?? '').trim(),
    };

    const res = await fetch('/server/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMessage(mapProfileServerError(res.status, data.error));
      setSaving(false);
      return;
    }

    setMessage('Settings updated successfully.');
    setForm((prev) => ({ ...prev, ...payload, password: '' }));
    setSaving(false);
  };

  if (loading || !role) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-3xl rounded-[var(--radius-lg)] border border-slate-200 bg-white p-6 shadow-[var(--shadow-card)]">
        <h1 className="text-2xl font-semibold text-slate-900">Account Settings</h1>
        <p className="mb-6 text-sm text-slate-600">Update your profile and security information.</p>

        <form className="space-y-5" onSubmit={onSubmit} noValidate>
          <label className="block text-sm font-medium text-slate-700" htmlFor="fullName">
            Name
            <input id="fullName" className="mt-1 w-full rounded border border-slate-300 p-2" value={form.fullName ?? ''} onChange={(e) => { setForm((prev) => ({ ...prev, fullName: e.target.value })); setErrors((prev) => ({ ...prev, fullName: undefined })); }} aria-invalid={Boolean(errors.fullName)} aria-describedby={errors.fullName ? 'fullName-error' : undefined} />
            {errors.fullName && <p id="fullName-error" role="alert" className="mt-1 text-xs text-red-700">{errors.fullName}</p>}
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Description
            <textarea className="mt-1 w-full rounded border border-slate-300 p-2" value={form.description ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Address
            <input className="mt-1 w-full rounded border border-slate-300 p-2" value={form.address ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} />
          </label>

          <label className="block text-sm font-medium text-slate-700" htmlFor="avatarUrl">
            Profile picture URL
            <input id="avatarUrl" className="mt-1 w-full rounded border border-slate-300 p-2" value={form.avatarUrl ?? ''} onChange={(e) => { setForm((prev) => ({ ...prev, avatarUrl: e.target.value })); setErrors((prev) => ({ ...prev, avatarUrl: undefined })); }} aria-invalid={Boolean(errors.avatarUrl)} aria-describedby={errors.avatarUrl ? 'avatarUrl-error' : undefined} />
            {errors.avatarUrl && <p id="avatarUrl-error" role="alert" className="mt-1 text-xs text-red-700">{errors.avatarUrl}</p>}
          </label>

          {role === 'school_rep' && (
            <>
              <label className="block text-sm font-medium text-slate-700">
                School name
                <input className="mt-1 w-full rounded border border-slate-300 p-2" value={form.schoolName ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, schoolName: e.target.value }))} />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                School description
                <textarea className="mt-1 w-full rounded border border-slate-300 p-2" value={form.schoolDescription ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, schoolDescription: e.target.value }))} />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                School address
                <input className="mt-1 w-full rounded border border-slate-300 p-2" value={form.schoolAddress ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, schoolAddress: e.target.value }))} />
              </label>
              <label className="block text-sm font-medium text-slate-700" htmlFor="schoolLogoUrl">
                School logo URL
                <input id="schoolLogoUrl" className="mt-1 w-full rounded border border-slate-300 p-2" value={form.schoolLogoUrl ?? ''} onChange={(e) => { setForm((prev) => ({ ...prev, schoolLogoUrl: e.target.value })); setErrors((prev) => ({ ...prev, schoolLogoUrl: undefined })); }} aria-invalid={Boolean(errors.schoolLogoUrl)} aria-describedby={errors.schoolLogoUrl ? 'schoolLogoUrl-error' : undefined} />
                {errors.schoolLogoUrl && <p id="schoolLogoUrl-error" role="alert" className="mt-1 text-xs text-red-700">{errors.schoolLogoUrl}</p>}
              </label>
            </>
          )}

          <label className="block text-sm font-medium text-slate-700" htmlFor="email">
            Email
            <input id="email" type="email" className="mt-1 w-full rounded border border-slate-300 p-2" value={form.email ?? ''} onChange={(e) => { setForm((prev) => ({ ...prev, email: e.target.value })); setErrors((prev) => ({ ...prev, email: undefined })); }} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} />
            {errors.email && <p id="email-error" role="alert" className="mt-1 text-xs text-red-700">{errors.email}</p>}
          </label>

          <label className="block text-sm font-medium text-slate-700" htmlFor="password">
            New password
            <input id="password" type="password" className="mt-1 w-full rounded border border-slate-300 p-2" value={form.password ?? ''} onChange={(e) => { setForm((prev) => ({ ...prev, password: e.target.value })); setErrors((prev) => ({ ...prev, password: undefined })); }} aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'password-error' : undefined} />
            {errors.password && <p id="password-error" role="alert" className="mt-1 text-xs text-red-700">{errors.password}</p>}
          </label>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="ui-button ui-button--primary disabled:opacity-50">{saving ? 'Saving...' : 'Save changes'}</button>
            <button type="button" onClick={() => router.back()} className="ui-button border border-slate-300 bg-white text-slate-900">Back</button>
          </div>

          {message && <p className="text-sm text-slate-700" role="status">{message}</p>}
          {errors.form && <p className="text-sm text-red-700" role="alert">{errors.form}</p>}
        </form>
      </div>
    </div>
  );
}
