'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import './landingpage.css';
import StudentLogin from './Register/StudentLogin';
import SchoolRepLogin from './Register/SchoolRepLogin';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type SignUpErrors = Partial<Record<'fullName' | 'email' | 'username' | 'password' | 'confirmPassword' | 'form', string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

function mapSupabaseSignUpError(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes('already registered') || lower.includes('already been registered')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (lower.includes('invalid email')) {
    return 'Please enter a valid email address.';
  }
  if (lower.includes('password') && lower.includes('weak')) {
    return 'Password is too weak. Use at least 8 characters with upper/lowercase letters and a number.';
  }

  return 'We could not create your account right now. Please try again.';
}

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
  const [errors, setErrors] = useState<SignUpErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (panelType) {
      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [panelType]);

  const showPanel = panelType !== null;

  const openPanel = (type: 'studentLogin' | 'schoolRepLogin' | 'signup') => {
    setPanelType(type);
    setErrors({});
    setFullName('');
    setEmail('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsSubmitting(false);
  };

  const focusFirstInvalid = (nextErrors: SignUpErrors) => {
    const order: Array<keyof SignUpErrors> = ['fullName', 'email', 'username', 'password', 'confirmPassword'];
    const firstField = order.find((key) => nextErrors[key]);
    if (!firstField) return;
    const el = document.getElementById(firstField);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    (el as HTMLInputElement | null)?.focus();
  };

  const validateSignUp = () => {
    const nextErrors: SignUpErrors = {};
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim().toLowerCase();

    if (!fullName.trim()) nextErrors.fullName = 'Full name is required.';
    if (!normalizedEmail) {
      nextErrors.email = 'Email is required.';
    } else if (!EMAIL_REGEX.test(normalizedEmail)) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (!normalizedUsername) {
      nextErrors.username = 'Username is required.';
    } else if (!USERNAME_REGEX.test(normalizedUsername)) {
      nextErrors.username = 'Username must be 3-20 characters and contain only lowercase letters, numbers, or underscores.';
    }

    if (!password) {
      nextErrors.password = 'Password is required.';
    } else {
      const strong = password.length >= 8 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password);
      if (!strong) {
        nextErrors.password = 'Use at least 8 characters with uppercase, lowercase, and a number.';
      }
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    return { nextErrors, normalizedEmail, normalizedUsername };
  };

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const { nextErrors, normalizedEmail, normalizedUsername } = validateSignUp();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      focusFirstInvalid(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    let supabase;
    try {
      supabase = createSupabaseBrowserClient();
    } catch {
      setErrors({ form: 'Configuration error: missing Supabase environment variables.' });
      setIsSubmitting(false);
      return;
    }

    const { data: available, error: rpcError } = await supabase.rpc('username_available', {
      check_username: normalizedUsername,
    });

    if (rpcError) {
      setErrors({ username: 'We could not verify that username right now. Please try again.' });
      focusFirstInvalid({ username: 'error' });
      setIsSubmitting(false);
      return;
    }

    if (!available) {
      setErrors({ username: 'That username is already taken.' });
      focusFirstInvalid({ username: 'error' });
      setIsSubmitting(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          username: normalizedUsername,
          full_name: fullName.trim(),
        },
      },
    });

    if (error) {
      setErrors({ form: mapSupabaseSignUpError(error.message) });
      setIsSubmitting(false);
      return;
    }

    if (data.session) {
      setErrors({});
      setFullName('');
      setEmail('');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setPanelType(null);
      setIsSubmitting(false);
      router.push('/StudentDashboard');
      return;
    }

    setErrors({ form: 'Account created. Please check your inbox to confirm your email before signing in.' });
    setIsSubmitting(false);
  };

  return (
    <main className="landing-page">
      <section className={`hero ${showPanel ? 'hero--compact' : ''}`}>
        <Image
          className="hero__image"
          src="/images/landing-hero.svg"
          alt=""
          aria-hidden="true"
          fill
          priority
          sizes="100vw"
        />
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
              className={`ui-button ${panelType === 'studentLogin' ? 'ui-button--primary' : 'ui-button--ghost'}`}
              onClick={() => openPanel('studentLogin')}
            >
              Student Login
            </button>
            <button
              type="button"
              className={`ui-button ${panelType === 'schoolRepLogin' ? 'ui-button--primary' : 'ui-button--ghost'}`}
              onClick={() => openPanel('schoolRepLogin')}
            >
              School Rep Login
            </button>
            <button
              type="button"
              className={`ui-button ${panelType === 'signup' ? 'ui-button--primary' : 'ui-button--ghost'}`}
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

                <form className="login-panel__form" onSubmit={handleSignUp} noValidate>
                  <div className="form-field">
                    <label htmlFor="fullName">Full Name</label>
                    <input id="fullName" name="fullName" type="text" value={fullName} onChange={(e) => { setFullName(e.target.value); setErrors((prev) => ({ ...prev, fullName: undefined, form: undefined })); }} placeholder="Enter your full name" aria-invalid={Boolean(errors.fullName)} aria-describedby={errors.fullName ? 'fullName-error' : undefined} />
                    {errors.fullName && <p id="fullName-error" role="alert" className="alert">{errors.fullName}</p>}
                  </div>

                  <div className="form-field">
                    <label htmlFor="email">Email</label>
                    <input id="email" name="email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: undefined, form: undefined })); }} placeholder="Enter your email" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} />
                    {errors.email && <p id="email-error" role="alert" className="alert">{errors.email}</p>}
                  </div>

                  <div className="form-field">
                    <label htmlFor="username">Username</label>
                    <input id="username" name="username" value={username} onChange={(e) => { setUsername(e.target.value); setErrors((prev) => ({ ...prev, username: undefined, form: undefined })); }} type="text" placeholder="Enter your username" aria-invalid={Boolean(errors.username)} aria-describedby={errors.username ? 'username-error' : undefined} />
                    {errors.username && <p id="username-error" role="alert" className="alert">{errors.username}</p>}
                  </div>

                  <div className="form-field password-field">
                    <label htmlFor="password">Password</label>
                    <input id="password" name="password" value={password} onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: undefined, confirmPassword: undefined, form: undefined })); }} type={showPassword ? 'text' : 'password'} placeholder="Create a password" aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'password-error' : undefined} />
                    <button type="button" className="password-toggle" onClick={() => setShowPassword((prev) => !prev)}>
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                    {errors.password && <p id="password-error" role="alert" className="alert">{errors.password}</p>}
                  </div>

                  <div className="form-field password-field">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <input id="confirmPassword" name="confirmPassword" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setErrors((prev) => ({ ...prev, confirmPassword: undefined, form: undefined })); }} type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm your password" aria-invalid={Boolean(errors.confirmPassword)} aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined} />
                    <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword((prev) => !prev)}>
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </button>
                    {errors.confirmPassword && <p id="confirmPassword-error" role="alert" className="alert">{errors.confirmPassword}</p>}
                  </div>

                  {errors.form && <div className="alert" role="alert">{errors.form}</div>}

                  <button type="submit" className="login-panel__submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating account...' : 'Create account'}
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
