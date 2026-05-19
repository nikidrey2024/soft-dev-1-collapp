'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import './landingpage.css';
import StudentLogin from './Register/StudentLogin';
import SchoolRepLogin from './Register/SchoolRepLogin';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function LandingPage() {
  const router = useRouter();
  const [panelType, setPanelType] = useState<'studentLogin' | 'schoolRepLogin' | 'signup' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (panelType) {
      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [panelType]);

  const showPanel = panelType !== null;

  const openPanel = (type: 'studentLogin' | 'schoolRepLogin' | 'signup') => {
    setPanelType(type);
    setError('');
    setFullName('');
    setEmail('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedUsername = username.trim().toLowerCase();

    if (!fullName.trim() || !email.trim() || !normalizedUsername || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters (Supabase default).');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    let supabase;
    try {
      supabase = createSupabaseBrowserClient();
    } catch {
      setError('Missing Supabase env vars. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.');
      return;
    }

    const { data: available, error: rpcError } = await supabase.rpc('username_available', {
      check_username: normalizedUsername,
    });

    if (rpcError) {
      setError('Could not verify username. Run supabase/schema.sql in your Supabase SQL editor.');
      return;
    }

    if (!available) {
      setError('That username is already taken.');
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          username: normalizedUsername,
          full_name: fullName.trim(),
        },
      },
    });

    if (error) {
      setError(error.message);
      return;
    }

    if (data.session) {
      setError('');
      setFullName('');
      setEmail('');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setPanelType(null);
      router.push('/StudentDashboard');
      return;
    }

    setError('Account created. If Supabase requires email confirmation, check your inbox before signing in.');
  };

  return (
    <main className="landing-page">
      <section className={`hero ${showPanel ? 'hero--compact' : ''}`}>
        <div className="hero__content">
          <p className="hero__eyebrow">COLLAPP</p>
          <h1 className="hero__heading">
            Streamline your college journey from application to acceptance.
          </h1>
          <p className="hero__subtext">
            Build a polished application workflow for students and school representatives, from
            program search to submission review.
          </p>

          <div className="hero__actions">
            <button
              type="button"
              className={`button ${panelType === 'studentLogin' ? 'button--primary' : 'button--secondary'}`}
              onClick={() => openPanel('studentLogin')}
            >
              Student Login
            </button>
            <button
              type="button"
              className={`button ${panelType === 'schoolRepLogin' ? 'button--primary' : 'button--secondary'}`}
              onClick={() => openPanel('schoolRepLogin')}
            >
              School Rep Login
            </button>
            <button
              type="button"
              className={`button ${panelType === 'signup' ? 'button--primary' : 'button--secondary'}`}
              onClick={() => openPanel('signup')}
            >
              Sign Up
            </button>
          </div>
        </div>
      </section>

      {showPanel && (
        <section className="login-panel" ref={panelRef}>
          <div className="login-panel__card">
            {panelType === 'studentLogin' && (
              <StudentLogin onSwitchToSignUp={() => openPanel('signup')} />
            )}
            {panelType === 'schoolRepLogin' && (
              <SchoolRepLogin onSwitchToSignUp={() => openPanel('signup')} />
            )}
            {panelType === 'signup' && (
              <>
                <div className="login-panel__header">
                  <h2 className="login-panel__title">Sign Up</h2>
                  <p className="login-panel__subtitle">Create a student account</p>
                </div>

                <form className="login-panel__form" onSubmit={handleSignUp}>
                  <div className="form-field">
                    <label htmlFor="fullName">Full Name</label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        setError('');
                      }}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="email">Email</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      placeholder="Enter your email"
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="username">Username</label>
                    <input
                      id="username"
                      name="username"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setError('');
                      }}
                      type="text"
                      placeholder="Enter your username"
                    />
                  </div>

                  <div className="form-field password-field">
                    <label htmlFor="password">Password</label>
                    <input
                      id="password"
                      name="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                      }}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  <div className="form-field password-field">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError('');
                      }}
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                    >
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  {error && <div className="alert">{error}</div>}

                  <button type="submit" className="login-panel__submit">
                    Create account
                  </button>

                  <p className="login-panel__footer">
                    Already have an account?{' '}
                    <button
                      type="button"
                      className="login-panel__footer-action"
                      onClick={() => openPanel('studentLogin')}
                    >
                      Student Login
                    </button>
                  </p>
                </form>
              </>
            )}
          </div>
        </section>
      )}
    </main>
  );
}