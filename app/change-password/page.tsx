"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, ArrowRight, Lock, CheckCircle2, Phone, Sparkles, Loader2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { validatePassword, PasswordValidationRules } from "@/components/PasswordValidator";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { isLoggedIn, user, updateToken } = useAuth();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Validation states
  const { isValid } = validatePassword(password);

  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    // If they aren't even logically logged in via memory, boot them
    if (!isLoggedIn || !user?.token) {
      router.replace("/login");
      return;
    }

    const verifyAuth = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (!res.ok) {
          router.replace("/login");
          return;
        }

        const data = await res.json();
        if (data.is_first_login !== true) {
          router.replace("/dashboard");
          return;
        }

        // Passed all checks
        setIsVerifying(false);
      } catch (err) {
        router.replace("/login");
      }
    };

    verifyAuth();
  }, [isLoggedIn, user, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    
    if (!isValid) {
      setError("Please satisfy all password requirements.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.token}`
        },
        body: JSON.stringify({ new_password: password }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update the token and clear first login flag
        updateToken(data.access_token, false, data.is_admin);
        router.push("/dashboard");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to change password");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };



  // If we are verifying, show nothing (or a loader)
  if (isVerifying) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <nav className="border-b border-zinc-200/80 bg-white/80 backdrop-blur-xl dark:border-zinc-800 dark:bg-black/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20">
              <Phone className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">CallingGen</span>
          </Link>
        </div>
      </nav>

      <div className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-md rounded-[1.75rem] border border-zinc-200/80 bg-white/90 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/90 dark:shadow-[0_20px_80px_rgba(0,0,0,0.45)] sm:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20">
              <Lock className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-semibold">Change Password</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              This is your first time logging in. Please set a secure password to continue.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="new-password" className="mb-2 block text-sm font-medium">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter new password"
                  disabled={isLoading}
                  className="w-full rounded-2xl border border-zinc-300 bg-white py-3 pl-11 pr-4 text-sm text-zinc-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50 dark:border-zinc-700 dark:bg-black dark:text-white dark:focus:border-violet-400 dark:focus:ring-violet-500/20"
                />
              </div>
            </div>

            <PasswordValidationRules password={password} />

            <div>
              <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Re-enter new password"
                  disabled={isLoading}
                  className="w-full rounded-2xl border border-zinc-300 bg-white py-3 pl-11 pr-4 text-sm text-zinc-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50 dark:border-zinc-700 dark:bg-black dark:text-white dark:focus:border-violet-400 dark:focus:ring-violet-500/20"
                />
              </div>
            </div>

            {error ? (
              <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:shadow-xl hover:shadow-violet-500/30 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Save Password <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
