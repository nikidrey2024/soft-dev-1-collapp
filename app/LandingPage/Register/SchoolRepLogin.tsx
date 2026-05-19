'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type SchoolRepLoginProps = {
  onSwitchToSignUp: () => void;
};

export default function SchoolRepLogin({ onSwitchToSignUp }: SchoolRepLoginProps) {
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

    const profileRes = await fetch('/server/profile');
    if (!profileRes.ok) {
      await supabase.auth.signOut();
      setError('Could not load your profile. Check that the database migration was applied.');
      return;
    }

    const profile = (await profileRes.json()) as { role: string; collegeId: number | null };
    if (profile.role !== 'school_rep') {
      await supabase.auth.signOut();
      if (profile.role === 'admin') {
        router.push('/admin');
        return;
      }

      setError('This portal is for school representatives only. Use Student login for student access.');
      return;
    }

    if (profile.collegeId == null) {
      await supabase.auth.signOut();
      setError('Your rep account is not linked to a college yet. Ask an admin to assign you in Manage users.');
      return;
    }

    router.push('/schoolrep');
  };

  return (
    <>
      <div className="login-panel__header">
        <h2 className="login-panel__title">School Rep Portal</h2>
        <p className="login-panel__subtitle">Login to your school representative portal</p>
      </div>

      <form className="login-panel__form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="rep-email">Email</label>
          <input
            id="rep-email"
            name="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            type="email"
            autoComplete="email"
            placeholder="Enter your rep account email"
          />
        </div>

        <div className="form-field password-field">
          <label htmlFor="rep-password">Password</label>
          <input
            id="rep-password"
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
          Login as school rep
        </button>

        <p className="login-panel__footer">
          School rep accounts are created in Supabase Auth and promoted to the school_rep role in the
          database (see comments at the end of supabase/schema.sql). Students can{' '}
          <button type="button" className="login-panel__footer-action" onClick={onSwitchToSignUp}>
            sign up here
          </button>
          .
        </p>
      </form>
    </>
  );
}
