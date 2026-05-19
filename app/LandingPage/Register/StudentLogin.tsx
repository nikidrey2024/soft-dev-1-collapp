'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type StudentLoginProps = {
  onSwitchToSignUp: () => void;
};

export default function StudentLogin({ onSwitchToSignUp }: StudentLoginProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    let supabase;
    try {
      supabase = createSupabaseBrowserClient();
    } catch {
      setError('App is missing Supabase configuration. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.');
      return;
    }

    const trimmedEmail = email.trim();
    const { error: signError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (signError) {
      setError(signError.message || 'Invalid email or password.');
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 500));
    const profileRes = await fetch('/server/profile');
    if (!profileRes.ok) {
      await supabase.auth.signOut();
      setError('Could not load your profile. Check that the database migration was applied.');
      return;
    }

    const profile = (await profileRes.json()) as { role: string };
    if (profile.role !== 'student') {
      await supabase.auth.signOut();
      if (profile.role === 'admin') {
        router.push('/admin');
        return;
      }

      setError('This portal is for student accounts only. Use School Rep login for rep access.');
      return;
    }

    router.push('/StudentDashboard');
  };

  return (
    <>
      <div className="login-panel__header">
        <h2 className="login-panel__title">Student Portal</h2>
        <p className="login-panel__subtitle">Login to your student dashboard</p>
      </div>

      <form className="login-panel__form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="student-email">Email</label>
          <input
            id="student-email"
            name="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            type="email"
            autoComplete="email"
            placeholder="Enter your account email"
          />
        </div>

        <div className="form-field password-field">
          <label htmlFor="student-password">Password</label>
          <input
            id="student-password"
            name="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter your password"
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>

        {error && <div className="alert">{error}</div>}

        <button type="submit" className="login-panel__submit">
          Login as student
        </button>

        <p className="login-panel__footer">
          Don&apos;t have a student account?{' '}
          <button type="button" className="login-panel__footer-action" onClick={onSwitchToSignUp}>
            Sign up
          </button>
        </p>
      </form>
    </>
  );
}
