"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, User, Building2, CheckCircle2, AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { useAuthDialog } from "@/components/providers/AuthDialogProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { validateEmail, validatePassword, validateRequired, passwordStrength } from "@/lib/validation";
import { cn } from "@/lib/utils";

/**
 * Sign In and Get Started dialogs.
 *
 * These are fully interactive frontend forms (validation, visibility toggles,
 * loading / error / success states). Submission calls the AuthProvider, which
 * validates input and keeps the session on this device.
 */

function PasswordToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? "Hide password" : "Show password"}
      aria-pressed={shown}
      className="inline-flex h-7 w-7 items-center justify-center text-muted rounded-xs hover:bg-highlight hover:text-ink"
    >
      {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}

function DemoNotice() {
  return (
    <p className="border border-line bg-bg px-3 py-2 text-xs text-muted rounded-sm">
      Your account and projects are saved in this app&rsquo;s own database. Passwords are hashed and never stored as plain text.
    </p>
  );
}

function FormAlert({ kind, children }: { kind: "error" | "success"; children: React.ReactNode }) {
  const Icon = kind === "error" ? AlertCircle : CheckCircle2;
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 border px-3 py-2 text-sm rounded-sm",
        kind === "error" ? "border-danger/40 bg-danger-bg text-danger" : "border-success/40 bg-success-bg text-success",
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sign in                                                             */
/* ------------------------------------------------------------------ */

function SignInDialog({ open, onClose, onSwitch }: { open: boolean; onClose: () => void; onSwitch: () => void }) {
  // Mount the form only while open so its state resets on every open.
  if (!open) return null;
  return <SignInForm onClose={onClose} onSwitch={onSwitch} />;
}

function SignInForm({ onClose, onSwitch }: { onClose: () => void; onSwitch: () => void }) {
  const open = true;
  const router = useRouter();
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [forgot, setForgot] = useState(false);

  const emailError = touched.email ? validateEmail(email) : null;
  const passwordError = touched.password ? validatePassword(password) : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setFormError(null);
    if (validateEmail(email) || validatePassword(password)) return;
    setSubmitting(true);
    try {
      await signIn({ email: email.trim(), password, remember });
      setSuccess(true);
      toast({ kind: "success", title: "Signed in", description: "Welcome back to ArchOpt." });
      window.setTimeout(() => {
        onClose();
        router.push("/dashboard");
      }, 600);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  if (forgot) {
    return (
      <Modal open={open} onClose={onClose} title="Reset your password" description="Enter your email and we will send a reset link." size="sm">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setTouched({ email: true });
            if (validateEmail(email)) return;
            toast({ kind: "info", title: "Reset by email is not available yet", description: "Create a new account if you have forgotten your password." });
            setForgot(false);
          }}
        >
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            error={emailError}
            leftIcon={<Mail className="h-4 w-4" />}
            data-autofocus
            required
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setForgot(false)}>
              Back
            </Button>
            <Button type="submit">Send reset link</Button>
          </div>
        </form>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Sign in to ArchOpt" description="Access your projects, layouts and optimization runs." size="sm" locked={submitting}>
      <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
        {formError ? <FormAlert kind="error">{formError}</FormAlert> : null}
        {success ? <FormAlert kind="success">Signed in successfully. Redirecting to your dashboard…</FormAlert> : null}
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@studio.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          error={emailError}
          leftIcon={<Mail className="h-4 w-4" />}
          data-autofocus
          required
        />
        <Input
          label="Password"
          type={showPw ? "text" : "password"}
          autoComplete="current-password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
          error={passwordError}
          leftIcon={<Lock className="h-4 w-4" />}
          rightSlot={<PasswordToggle shown={showPw} onToggle={() => setShowPw((s) => !s)} />}
          required
        />
        <div className="flex items-center justify-between">
          <Checkbox checked={remember} onChange={setRemember} label="Remember me" />
          <button type="button" onClick={() => setForgot(true)} className="text-sm font-medium text-primary hover:underline">
            Forgot password?
          </button>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={submitting} disabled={success}>
          Sign In
        </Button>
        <DemoNotice />
        <p className="text-center text-sm text-muted">
          New to ArchOpt?{" "}
          <button type="button" onClick={onSwitch} className="font-medium text-primary hover:underline">
            Get Started
          </button>
        </p>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Get started (registration)                                          */
/* ------------------------------------------------------------------ */

function GetStartedDialog({ open, onClose, onSwitch }: { open: boolean; onClose: () => void; onSwitch: () => void }) {
  if (!open) return null;
  return <GetStartedForm onClose={onClose} onSwitch={onSwitch} />;
}

function GetStartedForm({ onClose, onSwitch }: { onClose: () => void; onSwitch: () => void }) {
  const open = true;
  const router = useRouter();
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [org, setOrg] = useState("");
  const [terms, setTerms] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const errors = {
    name: validateRequired(name, "Full name"),
    email: validateEmail(email),
    password: validatePassword(password, { strong: true }),
    confirm: !confirm ? "Please confirm your password." : confirm !== password ? "Passwords do not match." : null,
    terms: terms ? null : "You must accept the Terms and Privacy Policy.",
  };
  const show = (k: keyof typeof errors) => (touched[k] ? errors[k] : null);
  const strength = passwordStrength(password);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true, confirm: true, terms: true });
    setFormError(null);
    if (Object.values(errors).some(Boolean)) return;
    setSubmitting(true);
    try {
      await signUp({ name: name.trim(), email: email.trim(), password, organization: org.trim() || undefined });
      setSuccess(true);
      toast({ kind: "success", title: "Account created", description: "Your workspace is ready." });
      window.setTimeout(() => {
        onClose();
        router.push("/dashboard");
      }, 700);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to create account.");
    } finally {
      setSubmitting(false);
    }
  };

  const strengthColor = ["bg-line", "bg-danger", "bg-warning", "bg-secondary", "bg-success"][strength.score];

  return (
    <Modal open={open} onClose={onClose} title="Create your ArchOpt account" description="Start turning briefs into optimized floor plans." size="md" locked={submitting}>
      <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
        {formError ? <FormAlert kind="error">{formError}</FormAlert> : null}
        {success ? <FormAlert kind="success">Account created. Opening your dashboard…</FormAlert> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Full name"
            autoComplete="name"
            placeholder="Lakshita Singh"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            error={show("name")}
            leftIcon={<User className="h-4 w-4" />}
            data-autofocus
            required
          />
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="you@studio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            error={show("email")}
            leftIcon={<Mail className="h-4 w-4" />}
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Input
              label="Password"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              placeholder="8+ chars, 1 uppercase, 1 number"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              error={show("password")}
              leftIcon={<Lock className="h-4 w-4" />}
              rightSlot={<PasswordToggle shown={showPw} onToggle={() => setShowPw((s) => !s)} />}
              required
            />
            {password ? (
              <div className="flex items-center gap-2" aria-live="polite">
                <div className="flex flex-1 gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <span key={i} className={cn("h-1 flex-1", i <= strength.score ? strengthColor : "bg-line")} />
                  ))}
                </div>
                <span className="text-[11px] text-muted">{strength.label}</span>
              </div>
            ) : null}
          </div>
          <Input
            label="Confirm password"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Repeat password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
            error={show("confirm")}
            leftIcon={<Lock className="h-4 w-4" />}
            rightSlot={<PasswordToggle shown={showConfirm} onToggle={() => setShowConfirm((s) => !s)} />}
            required
          />
        </div>
        <Input
          label="Organization or workspace name"
          placeholder="e.g. IGDTUW Studio 4"
          hint="Optional — you can add this later in Settings."
          value={org}
          onChange={(e) => setOrg(e.target.value)}
          leftIcon={<Building2 className="h-4 w-4" />}
        />
        <Checkbox
          checked={terms}
          onChange={(v) => {
            setTerms(v);
            setTouched((t) => ({ ...t, terms: true }));
          }}
          error={show("terms")}
          label={
            <>
              I agree to the{" "}
              <a href="#terms" className="font-medium text-primary hover:underline" onClick={(e) => e.preventDefault()}>
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#privacy" className="font-medium text-primary hover:underline" onClick={(e) => e.preventDefault()}>
                Privacy Policy
              </a>
              .
            </>
          }
        />
        <Button type="submit" size="lg" className="w-full" loading={submitting} disabled={success}>
          Create Account
        </Button>
        <DemoNotice />
        <p className="text-center text-sm text-muted">
          Already have an account?{" "}
          <button type="button" onClick={onSwitch} className="font-medium text-primary hover:underline">
            Sign In
          </button>
        </p>
      </form>
    </Modal>
  );
}

/** Mounted once in AppProviders; opened from anywhere via useAuthDialog(). */
export function AuthDialogs() {
  const { open, openSignIn, openGetStarted, close } = useAuthDialog();
  return (
    <>
      <SignInDialog open={open === "sign-in"} onClose={close} onSwitch={openGetStarted} />
      <GetStartedDialog open={open === "get-started"} onClose={close} onSwitch={openSignIn} />
    </>
  );
}
