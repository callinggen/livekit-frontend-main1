"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Lock, Mail, X, Loader2 } from "lucide-react";
import { validatePassword, PasswordValidationRules } from "./PasswordValidator";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailToPrefill: string;
}

export default function ForgotPasswordModal({ isOpen, onClose, emailToPrefill }: ForgotPasswordModalProps) {
  const [resetStep, setResetStep] = useState<"email" | "verify" | "reset" | "done">("email");
  const [resetEmail, setResetEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const resetFlow = {
    email: {
      title: "Reset your password",
      subtitle: "Enter your email and we’ll send a verification code.",
      button: "Send code",
    },
    verify: {
      title: "Verify your email",
      subtitle: "Enter the 6-digit code we sent to your inbox.",
      button: "Verify code",
    },
    reset: {
      title: "Create a new password",
      subtitle: "Choose a new password for your account.",
      button: "Reset password",
    },
    done: {
      title: "Password updated",
      subtitle: "You can now sign in with your new password.",
      button: "Close",
    },
  };

  useEffect(() => {
    if (isOpen) {
      const targetEmail = emailToPrefill !== "admin@callinggen.com" ? emailToPrefill : "";
      setResetEmail(targetEmail);
      setVerificationCode("");
      setNewPassword("");
      setConfirmPassword("");
      setIsLoading(false);
      
      if (targetEmail) {
        setResetStep("verify");
        setResetMessage("Sending OTP...");
        setIsLoading(true);
        const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
        fetch(`${backendUrl}/api/auth/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: targetEmail })
        }).then(res => {
          if (!res.ok) throw new Error("Failed");
          setResetMessage(`OTP is sent to ${targetEmail}`);
        }).catch(err => {
          setResetMessage("Error: Could not send verification code.");
          setResetStep("email");
        }).finally(() => {
          setIsLoading(false);
        });
      } else {
        setResetStep("email");
        setResetMessage("");
      }
    }
  }, [isOpen, emailToPrefill]);

  const handleResetSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResetMessage("");
    
    if (resetStep === "done") {
      onClose();
      return;
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
    setIsLoading(true);

    try {
      if (resetStep === "email") {
        if (!resetEmail.trim()) {
          setResetMessage("Please enter your email address.");
          setIsLoading(false);
          return;
        }
        const res = await fetch(`${backendUrl}/api/auth/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: resetEmail })
        });
        if (!res.ok) throw new Error("Failed");
        setResetMessage(`OTP is sent to ${resetEmail}`);
        setResetStep("verify");
      } else if (resetStep === "verify") {
        if (verificationCode.length < 6) {
          setResetMessage("Please enter the 6-digit verification code.");
          setIsLoading(false);
          return;
        }
        const res = await fetch(`${backendUrl}/api/auth/verify-reset-code`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: resetEmail, reset_code: verificationCode })
        });
        if (!res.ok) throw new Error("Invalid code");
        setResetMessage("Code verified successfully.");
        setResetStep("reset");
      } else if (resetStep === "reset") {
        const { isValid } = validatePassword(newPassword);
        if (!isValid) {
          setResetMessage("Please satisfy all password requirements.");
          setIsLoading(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          setResetMessage("Passwords do not match.");
          setIsLoading(false);
          return;
        }
        const res = await fetch(`${backendUrl}/api/auth/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: resetEmail, reset_code: verificationCode, new_password: newPassword })
        });
        if (!res.ok) throw new Error("Failed to reset");
        setResetMessage("Your password has been reset successfully.");
        setResetStep("done");
      }
    } catch (err) {
      if (resetStep === "email") setResetMessage("Error: Could not send verification code.");
      if (resetStep === "verify") setResetMessage("Error: Invalid or expired verification code.");
      if (resetStep === "reset") setResetMessage("Error: Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-[1.5rem] border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 animate-in zoom-in-95 duration-200">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-violet-600">Password recovery</p>
            <h3 className="mt-1 text-xl font-semibold">{resetFlow[resetStep].title}</h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{resetFlow[resetStep].subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleResetSubmit}>
          {resetStep === "email" ? (
            <div>
              <label htmlFor="reset-email" className="mb-2 block text-sm font-medium">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  id="reset-email"
                  type="email"
                  value={resetEmail}
                  onChange={(event) => setResetEmail(event.target.value)}
                  placeholder="your-email@example.com"
                  disabled={isLoading}
                  className="w-full rounded-2xl border border-zinc-300 bg-white py-3 pl-11 pr-4 text-sm text-zinc-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50 dark:border-zinc-700 dark:bg-black dark:text-white dark:focus:border-violet-400 dark:focus:ring-violet-500/20"
                />
              </div>
            </div>
          ) : null}

          {resetStep === "verify" ? (
            <div>
              <label htmlFor="verification-code" className="mb-2 block text-sm font-medium">Verification code</label>
              <input
                id="verification-code"
                type="text"
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                disabled={isLoading}
                className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50 dark:border-zinc-700 dark:bg-black dark:text-white dark:focus:border-violet-400 dark:focus:ring-violet-500/20"
              />
            </div>
          ) : null}

          {resetStep === "reset" ? (
            <>
              <div>
                <label htmlFor="new-password" className="mb-2 block text-sm font-medium">New password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="Enter new password"
                    disabled={isLoading}
                    className="w-full rounded-2xl border border-zinc-300 bg-white py-3 pl-11 pr-4 text-sm text-zinc-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50 dark:border-zinc-700 dark:bg-black dark:text-white dark:focus:border-violet-400 dark:focus:ring-violet-500/20"
                  />
                </div>
              </div>

              <PasswordValidationRules password={newPassword} />
              
              <div>
                <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium">Confirm password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Confirm new password"
                    disabled={isLoading}
                    className="w-full rounded-2xl border border-zinc-300 bg-white py-3 pl-11 pr-4 text-sm text-zinc-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50 dark:border-zinc-700 dark:bg-black dark:text-white dark:focus:border-violet-400 dark:focus:ring-violet-500/20"
                  />
                </div>
              </div>
            </>
          ) : null}

          {resetMessage ? (
            <div className={`rounded-2xl border px-3 py-2 text-sm ${resetMessage.includes("success") || resetMessage.includes("sent") || resetMessage.includes("verified") ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300" : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300"}`}>
              {resetMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:shadow-xl hover:shadow-violet-500/30 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {resetFlow[resetStep].button}
                {resetStep !== "done" && <ArrowRight className="h-4 w-4" />}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
