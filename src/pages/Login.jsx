import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/* ---------- small building blocks ---------- */

const Icon = ({ children, className = "h-5 w-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {children}
  </svg>
);

const EyeIcon = () => (
  <Icon>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
);

const EyeOffIcon = () => (
  <Icon>
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-6.5 0-10-7-10-7a18.5 18.5 0 0 1 4.06-5.06" />
    <path d="M9.9 5.24A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a18.6 18.6 0 0 1-2.16 3.19" />
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    <path d="M2 2l20 20" />
  </Icon>
);

const Spinner = () => (
  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const inputClass = (hasError) =>
  `w-full rounded-xl border px-4 py-2 outline-none transition focus:ring-2 ${
    hasError
      ? "border-red-400 focus:ring-red-200"
      : "border-stone-300 focus:border-brand-600 focus:ring-brand-600/20"
  }`;

const Field = ({ id, label, action, error, children }) => (
  <div>
    <div className="mb-1.5 flex items-center justify-between">
      <label htmlFor={id} className="text-sm font-medium text-stone-700">
        {label}
      </label>
      {action}
    </div>
    {children}
    {error && (
      <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600">
        {error}
      </p>
    )}
  </div>
);

const PasswordInput = ({ id, value, onChange, onBlur, placeholder, autoComplete, hasError, ...rest }) => {
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  return (
    <>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          required
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          onBlur={(e) => {
            setCapsLock(false);
            onBlur?.(e);
          }}
          onKeyUp={(e) => setCapsLock(e.getModifierState?.("CapsLock") ?? false)}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? `${id}-error` : undefined}
          className={`${inputClass(hasError)} pr-11`}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-stone-500 hover:text-stone-700 focus:outline-none focus-visible:text-brand-600"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {capsLock && <p className="mt-1.5 text-xs text-amber-600">Caps Lock is on</p>}
    </>
  );
};

/* ---------- page ---------- */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (error) setError("");
  };
  const touch = (field) => () => setTouched((t) => ({ ...t, [field]: true }));

  const errors = {};
  if (!form.email.trim()) errors.email = "Enter your email";
  else if (!EMAIL_RE.test(form.email.trim())) errors.email = "Enter a valid email address";
  if (!form.password) errors.password = "Enter your password";

  const show = (field) => (touched[field] || submitted) && errors[field];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setSubmitted(true);
    setError("");
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      const email = form.email.trim();
      const data = await login(email, form.password);

      // Owners always land on their dashboard; everyone else returns to the page they were sent from.
      const from = location.state?.from?.pathname;
      navigate(data.role === "owner" ? "/owner" : from || "/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <h1 className="font-display text-3xl mb-2">Welcome back</h1>
      <p className="text-sm text-stone-500 mb-8">Log in to pick up where you left off.</p>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Field id="email" label="Email" error={show("email")}>
          <input
            id="email"
            type="email"
            required
            autoFocus
            autoComplete="email"
            placeholder="Email"
            value={form.email}
            onChange={update("email")}
            onBlur={touch("email")}
            aria-invalid={!!show("email") || undefined}
            aria-describedby={show("email") ? "email-error" : undefined}
            className={inputClass(show("email"))}
          />
        </Field>

        <Field
          id="password"
          label="Password"
          error={show("password")}
          action={
            <Link to="/forgot-password" className="text-xs text-brand-600 hover:underline">
              Forgot password?
            </Link>
          }
        >
          <PasswordInput
            id="password"
            placeholder="Password"
            autoComplete="current-password"
            value={form.password}
            onChange={update("password")}
            onBlur={touch("password")}
            hasError={!!show("password")}
          />
        </Field>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 text-white py-3 font-medium hover:bg-brand-700 transition disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? (
            <>
              <Spinner /> Logging in…
            </>
          ) : (
            "Log in"
          )}
        </button>
      </form>

      <p className="text-sm text-stone-500 mt-6 text-center">
        No account? <Link to="/register" className="text-brand-600">Sign up</Link>
      </p>
    </div>
  );
};

export default Login;