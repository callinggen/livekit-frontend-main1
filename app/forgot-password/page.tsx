"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Lock, Mail, Phone, Sparkles, Loader2, CheckCircle2, KeyRound } from "lucide-react";
import { validatePassword, PasswordValidationRules } from "@/components/PasswordValidator";
import { useAuth } from "@/components/AuthProvider";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn } = useAuth();

  const initialEmail = searchParams.get("email") || "";

  const [step, setStep] = useState<"email" | "verify" | "reset" | "done">("email");
  const [email, setEmail] = useState(initialEmail);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { isValid } = validatePassword(newPassword);

  useEffect(() => {
    if (initialEmail && initialEmail !== "N/A") {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to send reset code.");
      }

      const resData = await res.json().catch(() => ({}));
      setMessage(resData.message || `A 6-digit verification code has been sent to ${email.trim()}. Please check your inbox and Spam folder.`);
      setStep("verify");
    } catch (err: any) {
      setError(err.message || "Failed to send verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (resetCode.trim().length < 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-reset-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), reset_code: resetCode.trim() }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Invalid or expired verification code.");
      }

      setMessage("Code verified successfully. Please enter your new password.");
      setStep("reset");
    } catch (err: any) {
      setError(err.message || "Invalid verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!isValid) {
      setError("Please satisfy all password requirements.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          reset_code: resetCode.trim(),
          new_password: newPassword,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to reset password.");
      }

      setMessage("Password reset successfully!");
      setStep("done");
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <nav className="border-b border-zinc-200/80 bg-white/80 backdrop-blur-xl dark:border-zinc-800 dark:bg-black/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20">
              <Phone className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">CallingGen</span>
          </Link>

          {isLoggedIn ? (
            <Link
              href="/profile"
              className="text-xs font-semibold text-violet-600 hover:underline dark:text-violet-400"
            >
              Back to Profile
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-xs font-semibold text-violet-600 hover:underline dark:text-violet-400"
            >
              Back to Sign In
            </Link>
          )}
        </div>
      </nav>

      <div className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-md rounded-[1.75rem] border border-zinc-200/80 bg-white/90 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/90 dark:shadow-[0_20px_80px_rgba(0,0,0,0.45)] sm:p-8">
          
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20">
              <KeyRound className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-semibold">
              {step === "email" && "Forgot Password"}
              {step === "verify" && "Enter Verification Code"}
              {step === "reset" && "Set New Password"}
              {step === "done" && "Password Reset Complete"}
            </h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {step === "email" && "Enter your email address to receive a 6-digit reset code."}
              {step === "verify" && `We sent a code to ${email}. Check your inbox.`}
              {step === "reset" && "Enter your new secure password below."}
              {step === "done" && "Your password has been successfully updated."}
            </p>
          </div>

          {/* STEP 1: EMAIL */}
          {step === "email" && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label htmlFor="reset-email-input" className="mb-2 block text-sm font-medium">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    id="reset-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    disabled={isLoading}
                    className="w-full rounded-2xl border border-zinc-300 bg-white py-3 pl-11 pr-4 text-sm text-zinc-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50 dark:border-zinc-700 dark:bg-black dark:text-white dark:focus:border-violet-400"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:shadow-xl hover:shadow-violet-500/30 disabled:opacity-70"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Send Verification Code <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>
          )}

          {/* STEP 2: VERIFY CODE */}
          {step === "verify" && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label htmlFor="verify-code-input" className="mb-2 block text-sm font-medium">
                  6-Digit Verification Code
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    id="verify-code-input"
                    type="text"
                    required
                    maxLength={6}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    disabled={isLoading}
                    className="w-full rounded-2xl border border-zinc-300 bg-white py-3 pl-11 pr-4 text-sm font-mono tracking-widest text-zinc-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50 dark:border-zinc-700 dark:bg-black dark:text-white dark:focus:border-violet-400"
                  />
                </div>
              </div>

              {message && (
                <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:shadow-xl hover:shadow-violet-500/30 disabled:opacity-70"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Verify Code <ArrowRight className="h-4 w-4" /></>}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setError("");
                    setMessage("");
                  }}
                  className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white underline"
                >
                  Change email address
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: RESET PASSWORD */}
          {step === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label htmlFor="new-pwd-input" className="mb-2 block text-sm font-medium">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    id="new-pwd-input"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    disabled={isLoading}
                    className="w-full rounded-2xl border border-zinc-300 bg-white py-3 pl-11 pr-4 text-sm text-zinc-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50 dark:border-zinc-700 dark:bg-black dark:text-white dark:focus:border-violet-400"
                  />
                </div>
              </div>

              <PasswordValidationRules password={newPassword} />

              <div>
                <label htmlFor="confirm-pwd-input" className="mb-2 block text-sm font-medium">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    id="confirm-pwd-input"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    disabled={isLoading}
                    className="w-full rounded-2xl border border-zinc-300 bg-white py-3 pl-11 pr-4 text-sm text-zinc-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50 dark:border-zinc-700 dark:bg-black dark:text-white dark:focus:border-violet-400"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:shadow-xl hover:shadow-violet-500/30 disabled:opacity-70"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Save New Password <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>
          )}

          {/* STEP 4: DONE */}
          {step === "done" && (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                Your password has been successfully reset! You can now log in using your new credentials.
              </div>

              <button
                type="button"
                onClick={() => router.push(isLoggedIn ? "/profile" : "/login")}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:shadow-xl hover:shadow-violet-500/30"
              >
                {isLoggedIn ? "Back to Profile" : "Sign In Now"} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    }>
      <ForgotPasswordContent />
    </Suspense>
  );
}
