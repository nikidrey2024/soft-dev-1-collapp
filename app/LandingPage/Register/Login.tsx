'use client';

import { useState } from 'react';

type LoginProps = {
  onSwitchToSignUp: () => void;
};

export default function Login({ onSwitchToSignUp }: LoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<'student' | 'schoolRep'>('student');

  return (
    <section className="login-panel" id="login">
      <div className="login-panel__card">
        <div className="login-panel__header">
          <h2 className="login-panel__title">Login</h2>
          <div className="login-panel__modes">
            <button
              type="button"
              className={`login-panel__mode ${userType === 'student' ? 'login-panel__mode--active' : ''}`}
              onClick={() => setUserType('student')}
            >
              Student
            </button>
            <button
              type="button"
              className={`login-panel__mode ${userType === 'schoolRep' ? 'login-panel__mode--active' : ''}`}
              onClick={() => setUserType('schoolRep')}
            >
              School Rep
            </button>
          </div>
        </div>

        <form className="login-panel__form">
          <div className="form-field">
            <label htmlFor="username">Username</label>
            <input id="username" name="username" type="text" placeholder="Enter your username" />
          </div>

          <div className="form-field password-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
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

          <div className="alert">Please enter valid login credentials</div>

          <button type="submit" className="login-panel__submit">
            Login
          </button>

          <p className="login-panel__footer">
            Don&apos;t have an account?{' '}
            <button type="button" className="login-panel__footer-action" onClick={onSwitchToSignUp}>
              Sign up
            </button>
          </p>
        </form>
      </div>
    </section>
  );
}
