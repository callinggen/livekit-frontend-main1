"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useCredits } from "@/components/CreditsContext";
import DashboardShell from "@/components/DashboardShell";
import { api } from "@/lib/api";
import {
  Building2,
  CreditCard,
  Bot,
  PhoneCall,
  Lock,
  Edit3,
  CheckCircle2,
  X,
  Loader2,
  Save,
  Sparkles,
  KeyRound,
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const { credits } = useCredits();

  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    company_name: "",
    industry: "",
    phone_number: "",
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchProfile = async () => {
    try {
      const data = await api.getMe();
      setProfileData(data);
      setEditForm({
        full_name: data.full_name || "",
        company_name: data.company_name || "",
        industry: data.industry || "",
        phone_number: data.phone_number || "",
      });
    } catch (err) {
      console.warn("Could not fetch detailed profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }
    fetchProfile();
  }, [isLoggedIn, router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.updateProfile(editForm);
      if (updated?.user) {
        setProfileData((prev: any) => ({
          ...prev,
          ...updated.user,
        }));
      } else {
        await fetchProfile();
      }
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditOpen(false);
      }, 1200);
    } catch (err: any) {
      alert(err.message || "Failed to update profile details");
    } finally {
      setSaving(false);
    }
  };

  if (!isLoggedIn) return null;

  // Dynamic values
  const companyName = profileData?.company_name || user?.company_name || "N/A";
  const industry = profileData?.industry || user?.industry || "N/A";
  const fullName = profileData?.full_name || user?.name || "N/A";
  const email = profileData?.email || user?.email || "N/A";
  const phone = profileData?.phone_number || user?.phone_number || "N/A";
  const plan = profileData?.subscription_plan || user?.subscription_plan || "Starter";
  const userCredits = credits ?? profileData?.credits ?? user?.credits ?? 0;
  const agentName = profileData?.agent_name || user?.agent_name || "N/A";
  const agentLanguage = profileData?.agent_language || user?.agent_language || "N/A";
  const agentVoice = profileData?.agent_voice || user?.agent_voice || "N/A";
  const agentScript = profileData?.agent_script || user?.agent_script || "";

  return (
    <DashboardShell title="Profile Overview">
      <div className="mx-auto max-w-5xl space-y-6 pb-12">
        {/* Top Header Banner */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-2xl">
              Profile Overview
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">
              View your account details, subscription, and AI agent configuration.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditForm({
                  full_name: fullName,
                  company_name: companyName,
                  industry: industry,
                  phone_number: phone,
                });
                setIsEditOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-violet-500/20 transition hover:shadow-violet-500/30"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit Details
            </button>

            <button
              onClick={() => router.push("/change-password")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-xs transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              <Lock className="h-3.5 w-3.5 text-zinc-500" />
              Change Password
            </button>

            <button
              onClick={() => router.push(`/forgot-password?email=${encodeURIComponent(email !== "N/A" ? email : "")}`)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-xs transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              <KeyRound className="h-3.5 w-3.5 text-zinc-500" />
              Forgot Password
            </button>
          </div>
        </div>

        {/* CARD 1: Company & Personal Details */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 transition-all hover:shadow-md">
          {/* Section Header */}
          <div className="flex items-start gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800/80">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Company & Personal Details
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Your organization and contact information.
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Company Name
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {companyName}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Industry / Sector
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {industry}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Full Name
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {fullName}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Email Address
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {email}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Mobile Number
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {phone}
              </p>
            </div>
          </div>
        </div>

        {/* CARD 2: Subscription & Connectivity */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 transition-all hover:shadow-md">
          {/* Section Header */}
          <div className="flex items-start gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800/80">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Subscription & Connectivity
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Your current plan and telephony configuration.
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Subscription Plan
              </p>
              <div className="mt-2">
                <span className="inline-flex items-center rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-950/60 dark:text-blue-300 dark:ring-blue-400/20">
                  {plan}
                </span>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Allocated Credits
              </p>
              <p className="mt-1 text-base font-bold text-zinc-900 dark:text-zinc-100">
                {userCredits} Credits
              </p>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Primary Phone Number
              </p>
              <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                <PhoneCall className="h-4 w-4 text-zinc-400" />
                <span>{phone}</span>
                <span className="text-xs text-zinc-400 font-normal">(Vobiz)</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: Active AI Agents */}
        <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/20 p-6 shadow-xs dark:border-emerald-900/30 dark:bg-emerald-950/10 transition-all hover:shadow-md">
          {/* Section Header */}
          <div className="flex items-start gap-3 border-b border-emerald-100/60 pb-4 dark:border-emerald-900/40">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Active AI Agents
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Your configured AI calling assistants.
              </p>
            </div>
          </div>

          {/* Agent Box Container */}
          <div className="mt-6 rounded-xl border border-zinc-200/80 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                AGENT 1 (Primary)
              </span>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Active / Ready
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Agent Name
                </p>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {agentName}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Language
                </p>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {agentLanguage}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Voice Profile
                </p>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {agentVoice}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Telephony Provider
                </p>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {phone !== "N/A" ? "LiveKit + Vobiz SIP" : "LiveKit"}
                </p>
              </div>
            </div>

            {agentScript && (
              <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Agent Script / System Prompt
                </p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 whitespace-pre-wrap">
                  {agentScript}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400">
                  <Edit3 className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Edit Profile Details
                </h3>
              </div>
              <button
                onClick={() => setIsEditOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.full_name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, full_name: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Company Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.company_name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, company_name: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Industry / Sector
                </label>
                <input
                  type="text"
                  required
                  value={editForm.industry}
                  onChange={(e) =>
                    setEditForm({ ...editForm, industry: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Mobile Number
                </label>
                <input
                  type="text"
                  value={editForm.phone_number}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone_number: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              {saveSuccess && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  Profile details saved successfully!
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:shadow-lg disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
