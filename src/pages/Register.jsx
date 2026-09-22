import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

const CheckIcon = ({ className = "h-4 w-4" }) => (
  <Icon className={className}>
    <path d="M20 6 9 17l-5-5" />
  </Icon>
);

/* Illustrations: a place setting for diners, an awning-fronted shop for owners. */
const Art = ({ className = "h-11 w-auto", children }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 120 64"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {children}
  </svg>
);

const DinerArt = () => (
  <Art>
    <circle cx="60" cy="32" r="21" fill="currentColor" fillOpacity="0.12" />
    <circle cx="60" cy="32" r="14" />
    <path d="M19 10v11a5 5 0 0 0 10 0V10" />
    <path d="M24 10v44" />
    <path d="M96 10c7 6 7 18 0 24" />
    <path d="M96 10v44" />
  </Art>
);

const OwnerArt = () => (
  <Art>
    <path d="M30 8h56l8 14H22z" fill="currentColor" fillOpacity="0.18" />
    <path
      d="M22 22a6 6 0 0 0 12 0a6 6 0 0 0 12 0a6 6 0 0 0 12 0a6 6 0 0 0 12 0a6 6 0 0 0 12 0a6 6 0 0 0 12 0"
      fill="currentColor"
      fillOpacity="0.18"
    />
    <path d="M39 8l-5 14M48.5 8L46 22M58 8v14M67.5 8L70 22M77 8l5 14" />
    <path d="M28 30v24h64V30" />
    <rect x="34" y="36" width="14" height="10" rx="1" />
    <rect x="72" y="36" width="14" height="10" rx="1" />
    <path d="M53 54V40a7 7 0 0 1 14 0v14" />
    <path d="M20 54h80" />
  </Art>
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

const Field = ({ id, label, error, children }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-stone-700 mb-1.5">
      {label}
    </label>
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

/* ---------- password strength (compact) ---------- */

const STRENGTH = [
  { label: "", bar: "bg-stone-200", text: "" },
  { label: "Weak", bar: "bg-red-500", text: "text-red-600" },
  { label: "Fair", bar: "bg-amber-500", text: "text-amber-600" },
  { label: "Good", bar: "bg-emerald-400", text: "text-emerald-600" },
  { label: "Strong", bar: "bg-emerald-600", text: "text-emerald-700" },
];

const getRules = (pw) => [
  { hint: "6+ characters", ok: pw.length >= 6 },
  { hint: "upper and lowercase", ok: /[a-z]/.test(pw) && /[A-Z]/.test(pw) },
  { hint: "a number", ok: /\d/.test(pw) },
  { hint: "a symbol", ok: /[^A-Za-z0-9]/.test(pw) },
];

const StrengthMeter = ({ password }) => {
  if (!password) return null;

  const rules = getRules(password);
  const passed = rules.filter((r) => r.ok).length;
  // Anything under the minimum length can't rate above "Weak".
  const score = rules[0].ok ? passed : Math.min(passed, 1);
  const level = STRENGTH[score];
  const missing = rules.filter((r) => !r.ok).map((r) => r.hint);

  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                i <= score ? level.bar : "bg-stone-200"
              }`}
            />
          ))}
        </div>
        <span className={`w-11 text-right text-xs font-medium ${level.text}`}>{level.label}</span>
      </div>
      {missing.length > 0 && <p className="mt-1 text-xs text-stone-500">Add: {missing.join(", ")}</p>}
    </div>
  );
};

/* ---------- role options ---------- */

const ROLES = [
  { value: "customer", title: "Diner", desc: "Find and book your next table", Illustration: DinerArt },
  { value: "owner", title: "Restaurant owner", desc: "Open your doors online", Illustration: OwnerArt },
];

/* ---------- page ---------- */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "customer" });
  const [confirm, setConfirm] = useState("");
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
  if (!form.name.trim()) errors.name = "Enter your full name";
  if (!form.email.trim()) errors.email = "Enter your email";
  else if (!EMAIL_RE.test(form.email.trim())) errors.email = "Enter a valid email address";
  if (form.password.length < 6) errors.password = "Use at least 6 characters";
  if (!confirm) errors.confirm = "Re-enter your password";
  else if (confirm !== form.password) errors.confirm = "Passwords don't match";

  const show = (field) => (touched[field] || submitted) && errors[field];
  const passwordsMatch = confirm && confirm === form.password;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setSubmitted(true);
    setError("");
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      // Only the original four fields go to the API; the confirm field stays client-side.
      await register({ ...form, name: form.name.trim(), email: form.email.trim() });
      navigate(form.role === "owner" ? "/owner" : "/restaurants");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="font-display text-3xl">Create an account</h1>
        <p className="mt-1 mb-6 text-sm text-stone-500">
          Already have an account? <Link to="/login" className="text-brand-600 hover:underline">Log in</Link>
        </p>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <fieldset>
            <legend className="text-sm font-medium text-stone-700 mb-2">I'm joining as</legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {ROLES.map(({ value, title, desc, Illustration }) => {
                const selected = form.role === value;
                return (
                  <label key={value} className="group block cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value={value}
                      checked={selected}
                      onChange={update("role")}
                      className="peer sr-only"
                    />
                    <div
                      className={`flex h-full overflow-hidden rounded-2xl border transition-all duration-200 motion-reduce:transition-none peer-focus-visible:ring-2 peer-focus-visible:ring-brand-600 peer-focus-visible:ring-offset-2 ${
                        selected
                          ? "border-brand-600 bg-brand-50 shadow-md shadow-brand-600/10"
                          : "border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm"
                      }`}
                    >
                      <div
                        className={`flex w-28 shrink-0 items-center justify-center transition-colors duration-200 ${
                          selected ? "bg-brand-600 text-white" : "bg-stone-100 text-stone-500 group-hover:bg-stone-200"
                        }`}
                      >
                        <Illustration />
                      </div>
                      <div className="flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-4">
                        <div>
                          <p
                            className={`font-display text-base leading-tight ${
                              selected ? "text-brand-700" : "text-stone-800"
                            }`}
                          >
                            {title}
                          </p>
                          <p className="mt-0.5 text-xs text-stone-500">{desc}</p>
                        </div>
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-200 ${
                            selected ? "border-brand-600 bg-brand-600 text-white" : "border-stone-300 bg-white"
                          }`}
                        >
                          {selected && <CheckIcon className="h-3 w-3" />}
                        </span>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
            <Field id="name" label="Full name" error={show("name")}>
              <input
                id="name"
                required
                autoFocus
                autoComplete="name"
                placeholder="Full name"
                value={form.name}
                onChange={update("name")}
                onBlur={touch("name")}
                aria-invalid={!!show("name") || undefined}
                aria-describedby={show("name") ? "name-error" : undefined}
                className={inputClass(show("name"))}
              />
            </Field>

            <Field id="email" label="Email" error={show("email")}>
              <input
                id="email"
                type="email"
                required
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

            <Field id="password" label="Password" error={show("password")}>
              <PasswordInput
                id="password"
                minLength={6}
                placeholder="Password (min 6 chars)"
                autoComplete="new-password"
                value={form.password}
                onChange={update("password")}
                onBlur={touch("password")}
                hasError={!!show("password")}
              />
              <StrengthMeter password={form.password} />
            </Field>

            <Field id="confirm" label="Confirm password" error={show("confirm")}>
              <PasswordInput
                id="confirm"
                placeholder="Re-enter password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  if (error) setError("");
                }}
                onBlur={touch("confirm")}
                hasError={!!show("confirm")}
              />
              {passwordsMatch && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-emerald-700">
                  <CheckIcon className="h-3.5 w-3.5" /> Passwords match
                </p>
              )}
            </Field>
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </p>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 text-white py-3 font-medium hover:bg-brand-700 transition disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Spinner /> Creating account…
                </>
              ) : (
                "Sign up"
              )}
            </button>
            <p className="mt-3 text-center text-xs text-stone-500">
              By creating an account, you agree to our{" "}
              <Link to="/terms" target="_blank" rel="noreferrer" className="text-brand-600 underline underline-offset-2">
                Terms
              </Link>{" "}
              and{" "}
              <Link to="/privacy" target="_blank" rel="noreferrer" className="text-brand-600 underline underline-offset-2">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;