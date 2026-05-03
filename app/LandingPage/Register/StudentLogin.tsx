'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadAccounts } from './accounts';

type StudentLoginProps = {
  onSwitchToSignUp: () => void;
};

export default function StudentLogin({ onSwitchToSignUp }: StudentLoginProps) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedUsername = username.trim().toLowerCase();
    const accounts = loadAccounts();
    const account = accounts[normalizedUsername];

    if (!account || account.password !== password || account.type !== 'student') {
      setError('Invalid student username or password.');
      return;
    }

    setError('');
    router.push(account.route);
  };

  return (
    <>
      <div className="login-panel__header">
        <h2 className="login-panel__title">Student Portal</h2>
        <p className="login-panel__subtitle">Login to your student dashboard</p>
      </div>

      <form className="login-panel__form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="student-username">Username</label>
          <input
            id="student-username"
            name="username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError('');
            }}
            type="text"
            placeholder="Enter your student username"
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
          Don't have a student account?{' '}
          <button type="button" className="login-panel__footer-action" onClick={onSwitchToSignUp}>
            Sign up
          </button>
        </p>
      </form>
    </>
  );
}
