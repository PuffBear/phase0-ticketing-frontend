import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Icons } from './constants';
import { apiGet, apiPost } from './services/api';
import { User, UserRole } from './types';
import { Home } from './pages/Home';
import { ClientLogin } from './pages/client/ClientLogin';
import { ClientEvents } from './pages/client/ClientEvents';
import { ClientEvent } from './pages/client/ClientEvent';
import { ClientScanner } from './pages/client/ClientScanner';
import { ClientAccount } from './pages/client/ClientAccount';
import { ClientAdmin } from './pages/client/ClientAdmin';
import { Landing } from './pages/Landing';

const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/i;
const usernamePattern = /^[a-z0-9_]{3,20}$/i;

const isValidEmail = (value: string) => emailPattern.test(value.trim());

const isClientRole = (role?: UserRole) => {
  return role === UserRole.STAFF || role === UserRole.HOST || role === UserRole.ADMIN;
};

const ResetPasswordPage: React.FC<{
  resetPasswordValue: string;
  resetPasswordConfirm: string;
  setResetPasswordValue: (v: string) => void;
  setResetPasswordConfirm: (v: string) => void;
  isSubmitting: boolean;
  authError: string | null;
  setAuthError: (msg: string | null) => void;
}> = ({
  resetPasswordValue,
  resetPasswordConfirm,
  setResetPasswordValue,
  setResetPasswordConfirm,
  isSubmitting,
  authError,
  setAuthError,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const search = new URLSearchParams(location.search);
  const token = search.get('token') || '';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError(null);

    if (!token) {
      setAuthError('Invalid or missing token.');
      return;
    }

    if (resetPasswordValue.length < 8) {
      setAuthError('Password must be at least 8 characters.');
      return;
    }

    if (resetPasswordValue !== resetPasswordConfirm) {
      setAuthError('Passwords do not match.');
      return;
    }

    try {
      await apiPost('/auth/reset-password', {
        token,
        password: resetPasswordValue,
      });
      navigate('/login');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Something went wrong.');
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center p-6 space-y-12 max-w-sm mx-auto">
      <div className="space-y-4">
        <div className="text-blue-500 scale-[2] origin-left mb-2">
          <Icons.Symbol />
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tighter leading-none uppercase">Set new password</h1>
          <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em]">Secure account recovery</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">
            New Password
          </label>
          <input
            type="password"
            value={resetPasswordValue}
            onChange={(e) => setResetPasswordValue(e.target.value)}
            placeholder="Minimum 8 characters"
            className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-4 font-mono text-sm focus:border-blue-500 outline-none transition-all"
            required
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">
            Confirm Password
          </label>
          <input
            type="password"
            value={resetPasswordConfirm}
            onChange={(e) => setResetPasswordConfirm(e.target.value)}
            placeholder="Repeat password"
            className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-4 font-mono text-sm focus:border-blue-500 outline-none transition-all"
            required
            disabled={isSubmitting}
          />
        </div>

        {authError && (
          <p className="text-[10px] text-red-500 uppercase tracking-widest font-bold">{authError}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-white text-black py-4 rounded-xl font-black uppercase tracking-[0.2em] shadow-xl hover:bg-zinc-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {isSubmitting ? '...' : 'Update Password'}
        </button>

        <button
          type="button"
          onClick={() => navigate('/login')}
          className="w-full text-center text-[10px] text-zinc-500 hover:text-white transition-colors uppercase tracking-widest font-bold mt-2"
        >
          Back to login
        </button>
      </form>
    </div>
  );
};

const AppRoutes: React.FC = () => {
  const navigate = useNavigate();
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPassword, setClientPassword] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState('');

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const result = await apiGet<{ user: User }>('/auth/me');
        setAuthUser(result.user);
      } catch {
        setAuthUser(null);
      } finally {
        setAuthLoading(false);
      }
    };
    bootstrap();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const resetAuthErrors = () => setAuthError(null);

  const handleStart = async (event: React.FormEvent) => {
    event.preventDefault();
    resetAuthErrors();

    if (!isValidEmail(email)) {
      setAuthError('Use a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiPost<{ next: 'login' | 'verify'; role?: string }>('/auth/start', { email });
      if (result.next === 'login') {
        if (result.role && result.role !== 'USER') {
          setClientEmail(email);
          navigate('/client/login');
        } else {
          setLoginEmail(email);
          navigate('/login');
        }
      } else {
        setOtp('');
        setResendCooldown(60);
        navigate('/verify');
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    resetAuthErrors();

    if (otp.length !== 6) {
      setAuthError('Enter the 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiPost<{ token: string; next: 'signup' }>('/auth/verify-otp', { email, code: otp });
      setVerificationToken(result.token);
      navigate('/signup');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    resetAuthErrors();
    setIsSubmitting(true);
    try {
      await apiPost('/auth/send-otp', { email });
      setOtp('');
      setResendCooldown(60);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    resetAuthErrors();

    if (!fullName.trim()) {
      setAuthError('Name is required.');
      return;
    }

    if (!usernamePattern.test(username.trim())) {
      setAuthError('Username must be 3-20 characters (letters, numbers, underscore).');
      return;
    }

    if (password.length < 8) {
      setAuthError('Password must be at least 8 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiPost<{ ok: true; user: User }>('/auth/signup', {
        name: fullName,
        email,
        username,
        password,
        token: verificationToken
      });
      setAuthUser(result.user);
      navigate('/app');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    resetAuthErrors();

    if (!loginEmail.trim() || !loginPassword) {
      setAuthError('Email and password are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiPost<{ ok: true; user: User }>('/auth/login', {
        email: loginEmail,
        password: loginPassword
      });
      setAuthUser(result.user);
      navigate('/app');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClientLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    resetAuthErrors();

    if (!clientEmail.trim() || !clientPassword) {
      setAuthError('Email and password are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiPost<{ ok: true; user: User }>('/auth/login', {
        email: clientEmail,
        password: clientPassword
      });
      setAuthUser(result.user);
      navigate('/client/events');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiPost('/auth/logout', {});
    } catch {
      // ignore
    } finally {
      setAuthUser(null);
      navigate('/login');
    }
  };

  const authLayout = useMemo(() => ({
    activeTab: 'profile' as const,
    onTabChange: () => { },
    isLoggedIn: false
  }), []);

  if (authLoading) {
    return (
      <Layout {...authLayout}>
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Loading...</div>
        </div>
      </Layout>
    );
  }

  const defaultRoute = authUser
    ? (isClientRole(authUser.role) ? '/client/events' : '/app')
    : '/auth';

  return (
    <Routes>
      <Route path="/" element={<Landing user={authUser} />} />
      <Route
        path="/auth"
        element={
          <Layout {...authLayout}>
            <div className="min-h-[80vh] flex flex-col justify-center p-6 space-y-12 max-w-sm mx-auto">
              <div className="space-y-4">
                <div className="text-blue-500 scale-[2] origin-left mb-2">
                  <Icons.Symbol />
                </div>
                <div className="space-y-1">
                  <h1 className="text-4xl font-black tracking-tighter leading-none uppercase">phase0</h1>
                  <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em]">Operating system for informal events</p>
                </div>
              </div>

              <form onSubmit={handleStart} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-4 font-mono text-sm focus:border-blue-500 outline-none transition-all"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {authError && (
                  <p className="text-[10px] text-red-500 uppercase tracking-widest font-bold">{authError}</p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-white text-black py-4 rounded-xl font-black uppercase tracking-[0.2em] shadow-xl hover:bg-zinc-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isSubmitting ? '...' : 'Continue'}
                </button>
              </form>
              <p className="text-[10px] text-zinc-700 text-center font-bold uppercase tracking-widest">
                Infrastructure for high-trust environments.
              </p>
            </div>
          </Layout>
        }
      />
      <Route
        path="/verify"
        element={
          email ? (
            <Layout {...authLayout}>
              <div className="min-h-[80vh] flex flex-col justify-center p-6 space-y-12 max-w-sm mx-auto">
                <div className="space-y-4">
                  <div className="text-blue-500 scale-[2] origin-left mb-2">
                    <Icons.Symbol />
                  </div>
                  <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tighter leading-none uppercase">phase0</h1>
                    <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em]">Verify your email</p>
                  </div>
                </div>

                <form onSubmit={handleVerify} className="space-y-4">
                  <div className="space-y-2 animate-in slide-in-from-top-2">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
                      <span>Verification Code</span>
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            setOtp('');
                            resetAuthErrors();
                            navigate('/auth');
                          }}
                          className="text-blue-500 hover:text-blue-400 transition-colors"
                        >
                          Change email
                        </button>
                        <button
                          type="button"
                          onClick={handleResend}
                          disabled={isSubmitting || resendCooldown > 0}
                          className="text-blue-500 hover:text-blue-400 transition-colors disabled:text-zinc-600"
                        >
                          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest ml-1">{email}</p>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-4 font-mono text-center text-xl tracking-[0.5em] focus:border-blue-500 outline-none transition-all"
                      required
                    />
                  </div>

                  {authError && (
                    <p className="text-[10px] text-red-500 uppercase tracking-widest font-bold">{authError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-white text-black py-4 rounded-xl font-black uppercase tracking-[0.2em] shadow-xl hover:bg-zinc-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? '...' : 'Verify'}
                  </button>
                </form>
                <p className="text-[10px] text-zinc-700 text-center font-bold uppercase tracking-widest">
                  Infrastructure for high-trust environments.
                </p>
              </div>
            </Layout>
          ) : (
            <Navigate to="/auth" replace />
          )
        }
      />
      <Route
        path="/signup"
        element={
          verificationToken ? (
            <Layout {...authLayout}>
              <div className="min-h-[80vh] flex flex-col justify-center p-6 space-y-12 max-w-sm mx-auto">
                <div className="space-y-4">
                  <div className="text-blue-500 scale-[2] origin-left mb-2">
                    <Icons.Symbol />
                  </div>
                  <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tighter leading-none uppercase">Create profile</h1>
                    <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em]">Complete signup</p>
                  </div>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Firstname Secondname"
                      className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-4 font-mono text-sm focus:border-blue-500 outline-none transition-all"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase())}
                      placeholder="phase0_user"
                      className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-4 font-mono text-sm focus:border-blue-500 outline-none transition-all"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-4 font-mono text-sm focus:border-blue-500 outline-none transition-all"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      readOnly
                      className="w-full bg-[#111114] border border-[#27272a] rounded-xl px-4 py-4 font-mono text-sm text-zinc-500"
                    />
                  </div>

                  {authError && (
                    <p className="text-[10px] text-red-500 uppercase tracking-widest font-bold">{authError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-white text-black py-4 rounded-xl font-black uppercase tracking-[0.2em] shadow-xl hover:bg-zinc-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? '...' : 'Create Profile'}
                  </button>
                </form>
                <p className="text-[10px] text-zinc-700 text-center font-bold uppercase tracking-widest">
                  Infrastructure for high-trust environments.
                </p>
              </div>
            </Layout>
          ) : (
            <Navigate to="/auth" replace />
          )
        }
      />
      <Route
        path="/login"
        element={
          authUser ? (
            <Navigate to={defaultRoute} replace />
          ) : (
            <Layout {...authLayout}>
              <div className="min-h-[80vh] flex flex-col justify-center p-6 space-y-12 max-w-sm mx-auto">
                <div className="space-y-4">
                  <div className="text-blue-500 scale-[2] origin-left mb-2">
                    <Icons.Symbol />
                  </div>
                  <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tighter leading-none uppercase">Welcome back</h1>
                    <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em]">Login required</p>
                  </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Email</label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-4 font-mono text-sm focus:border-blue-500 outline-none transition-all"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Password</label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Your password"
                      className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-4 font-mono text-sm focus:border-blue-500 outline-none transition-all"
                      required
                      disabled={isSubmitting}
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => navigate('/forgot-password')}
                        className="text-[10px] text-zinc-500 hover:text-white transition-colors uppercase tracking-widest"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="flex justify-center pt-2">
                      <button
                        type="button"
                        onClick={() => navigate('/auth')}
                        className="text-[10px] text-zinc-500 hover:text-white transition-colors uppercase tracking-widest font-bold"
                      >
                        New user? Sign up
                      </button>
                    </div>
                  </div>

                  {authError && (
                    <p className="text-[10px] text-red-500 uppercase tracking-widest font-bold">{authError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-white text-black py-4 rounded-xl font-black uppercase tracking-[0.2em] shadow-xl hover:bg-zinc-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? '...' : 'Login'}
                  </button>
                </form>
                <p className="text-[10px] text-zinc-700 text-center font-bold uppercase tracking-widest">
                  Infrastructure for high-trust environments.
                </p>
              </div>
            </Layout>
          )
        }
      />
      <Route
        path="/forgot-password"
        element={
          authUser ? (
            <Navigate to={defaultRoute} replace />
          ) : (
            <Layout {...authLayout}>
              <div className="min-h-[80vh] flex flex-col justify-center p-6 space-y-12 max-w-sm mx-auto">
                <div className="space-y-4">
                  <div className="text-blue-500 scale-[2] origin-left mb-2">
                    <Icons.Symbol />
                  </div>
                  <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tighter leading-none uppercase">Reset password</h1>
                    <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em]">Request reset link</p>
                  </div>
                </div>

                <form
                  onSubmit={async (event) => {
                    event.preventDefault();
                    resetAuthErrors();

                    if (!isValidEmail(forgotEmail)) {
                      setAuthError('Use a valid email address.');
                      return;
                    }

                    setIsSubmitting(true);
                    try {
                      await apiPost('/auth/forgot-password', { email: forgotEmail });
                      setAuthError('If an account exists, a reset link has been sent.');
                    } catch (error) {
                      setAuthError(error instanceof Error ? error.message : 'Something went wrong.');
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Email</label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-4 font-mono text-sm focus:border-blue-500 outline-none transition-all"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  {authError && (
                    <p className="text-[10px] text-red-500 uppercase tracking-widest font-bold">{authError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-white text-black py-4 rounded-xl font-black uppercase tracking-[0.2em] shadow-xl hover:bg-zinc-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? '...' : 'Send reset link'}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="w-full text-center text-[10px] text-zinc-500 hover:text-white transition-colors uppercase tracking-widest font-bold mt-2"
                  >
                    Back to login
                  </button>
                </form>
              </div>
            </Layout>
          )
        }
      />
      <Route
        path="/reset-password"
        element={
          authUser ? (
            <Navigate to={defaultRoute} replace />
          ) : (
            <Layout {...authLayout}>
              <ResetPasswordPage
                resetPasswordValue={resetPasswordValue}
                resetPasswordConfirm={resetPasswordConfirm}
                setResetPasswordValue={setResetPasswordValue}
                setResetPasswordConfirm={setResetPasswordConfirm}
                isSubmitting={isSubmitting}
                authError={authError}
                setAuthError={setAuthError}
              />
            </Layout>
          )
        }
      />
      <Route
        path="/client/login"
        element={
          authUser ? (
            <Navigate to={defaultRoute} replace />
          ) : (
            <ClientLogin
              email={clientEmail}
              password={clientPassword}
              isSubmitting={isSubmitting}
              error={authError}
              onEmailChange={setClientEmail}
              onPasswordChange={setClientPassword}
              onSubmit={handleClientLogin}
            />
          )
        }
      />
      <Route
        path="/client/events"
        element={
          authUser && isClientRole(authUser.role) ? (
            <ClientEvents role={authUser.role} />
          ) : (
            <Navigate to="/client/login" replace />
          )
        }
      />
      <Route
        path="/client/events/:eventId"
        element={
          authUser && isClientRole(authUser.role) ? (
            <ClientEvent />
          ) : (
            <Navigate to="/client/login" replace />
          )
        }
      />
      <Route
        path="/client/scanner"
        element={<Navigate to="/client/events" replace />}
      />
      <Route
        path="/client/scanner/:eventId"
        element={
          authUser && isClientRole(authUser.role) ? (
            <ClientScanner />
          ) : (
            <Navigate to="/client/login" replace />
          )
        }
      />
      <Route
        path="/client/account"
        element={
          authUser && isClientRole(authUser.role) ? (
            <ClientAccount user={authUser} onLogout={handleLogout} />
          ) : (
            <Navigate to="/client/login" replace />
          )
        }
      />
      <Route
        path="/client/admin"
        element={
          authUser && authUser.role === UserRole.ADMIN ? (
            <ClientAdmin />
          ) : (
            <Navigate to="/client/login" replace />
          )
        }
      />
      <Route
        path="/app"
        element={
          authUser && !isClientRole(authUser.role) ? (
            <Home user={authUser} onLogout={handleLogout} />
          ) : (
            <Navigate to={defaultRoute} replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <AppRoutes />
  </BrowserRouter>
);

export default App;
