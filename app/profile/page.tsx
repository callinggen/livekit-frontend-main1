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
  Copy,
  Check,
  ShieldCheck,
  Calendar,
  Radio,
  Zap,
  Globe,
  Mic,
  FileText,
  User as UserIcon,
  Maximize2,
  Minimize2,
  Mail,
  Layers,
  Phone,
  CheckCheck,
  Pencil,
  Sparkles,
  Code2,
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const { credits } = useCredits();

  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit Profile Details Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    company_name: "",
    industry: "",
    phone_number: "",
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Edit Agent Script Modal State
  const [isScriptEditOpen, setIsScriptEditOpen] = useState(false);
  const [scriptEditValue, setScriptEditValue] = useState("");
  const [savingScript, setSavingScript] = useState(false);
  const [scriptSaveSuccess, setScriptSaveSuccess] = useState(false);

  // Script Copy & Expand States
  const [copiedScript, setCopiedScript] = useState(false);
  const [isScriptExpanded, setIsScriptExpanded] = useState(false);
  const [selectedAgentIndex, setSelectedAgentIndex] = useState(0);

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
      setScriptEditValue(data.agent_script || "");
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
      // Immediate optimistic state update
      setProfileData((prev: any) => ({
        ...prev,
        ...editForm,
        ...(updated?.user || {}),
      }));
      setSaveSuccess(true);
      await fetchProfile();
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditOpen(false);
      }, 800);
    } catch (err: any) {
      alert(err.message || "Failed to update profile details");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveScript = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingScript(true);
    try {
      await api.updateProfile({ agent_script: scriptEditValue });
      // Immediate optimistic state update across all agent representations
      setProfileData((prev: any) => {
        if (!prev) return prev;
        const updatedAgents = prev.agents ? [...prev.agents] : [];
        if (updatedAgents[selectedAgentIndex]) {
          updatedAgents[selectedAgentIndex] = {
            ...updatedAgents[selectedAgentIndex],
            script: scriptEditValue,
          };
        }
        return {
          ...prev,
          agent_script: scriptEditValue,
          agents: updatedAgents,
        };
      });
      setScriptSaveSuccess(true);
      await fetchProfile();
      setTimeout(() => {
        setScriptSaveSuccess(false);
        setIsScriptEditOpen(false);
      }, 800);
    } catch (err: any) {
      alert(err.message || "Failed to update agent script");
    } finally {
      setSavingScript(false);
    }
  };

  const handleCopyScript = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
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
  const createdAt = profileData?.created_at
    ? new Date(profileData.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Active";

  // Multi-agents data
  const agentsList: any[] =
    profileData?.agents && profileData.agents.length > 0
      ? profileData.agents
      : [
          {
            id: 1,
            name: profileData?.agent_name || user?.agent_name || "sales",
            language: profileData?.agent_language || user?.agent_language || "English",
            voice: profileData?.agent_voice || user?.agent_voice || "Manisha",
            script: profileData?.agent_script || user?.agent_script || "",
          },
        ];

  const currentAgent = agentsList[selectedAgentIndex] || agentsList[0];
  const activeScript =
    currentAgent?.script || profileData?.agent_script || user?.agent_script || "";
  const wordCount = activeScript
    ? activeScript.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const charCount = activeScript ? activeScript.length : 0;

  // Script editor word count
  const editWordCount = scriptEditValue
    ? scriptEditValue.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const editCharCount = scriptEditValue ? scriptEditValue.length : 0;

  // Provisioned Phone Numbers
  const phoneNumbersList: any[] =
    profileData?.phone_numbers && profileData.phone_numbers.length > 0
      ? profileData.phone_numbers
      : [
          {
            id: 1,
            phone_number: phone,
            provider_name: "Tata Communications Cloud SIP",
            number_type: "Mobile / Outbound",
            region: "India (+91)",
            status: "Active",
            max_concurrent_calls: 3,
          },
        ];

  // Helper for Initials
  const initials =
    fullName !== "N/A"
      ? fullName
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : companyName !== "N/A"
      ? companyName.slice(0, 2).toUpperCase()
      : "CG";

  // Preview initials for Edit Modal
  const editInitials =
    editForm.full_name.trim()
      ? editForm.full_name
          .trim()
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : editForm.company_name.trim()
      ? editForm.company_name.trim().slice(0, 2).toUpperCase()
      : "CG";

  const industryPresets = [
    "VR AR",
    "Real Estate",
    "Healthcare",
    "EdTech",
    "SaaS & Tech",
    "E-Commerce",
    "Finance",
    "Hospitality",
  ];

  const scriptVariables = [
    "{{lead_name}}",
    "{{company_name}}",
    "{{phone_number}}",
    "{{product_interest}}",
    "{{meeting_time}}",
  ];

  const handleInsertVariable = (variable: string) => {
    setScriptEditValue((prev) => prev + " " + variable);
  };

  return (
    <DashboardShell title="Profile & Account">
      <div className="mx-auto max-w-6xl space-y-6 pb-16">
        
        {/* TOP IDENTITY & ACTION BANNER */}
        <div className="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-gradient-to-br from-white via-zinc-50/60 to-violet-50/30 p-6 shadow-xs dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900/90 dark:to-violet-950/20 sm:p-7">
          <div className="absolute right-0 top-0 -mr-12 -mt-12 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 bottom-0 -mb-12 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            {/* Left: Avatar & Identity Details */}
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="relative flex h-16 w-16 sm:h-18 sm:w-18 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-500 text-xl sm:text-2xl font-black text-white shadow-md shadow-violet-500/25 ring-4 ring-white dark:ring-zinc-800">
                {initials}
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white dark:border-zinc-900"></span>
                </span>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    {fullName}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-400">
                    <ShieldCheck className="h-3 w-3" />
                    Verified
                  </span>
                </div>

                <p className="mt-0.5 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                  {companyName}{" "}
                  {industry !== "N/A" && (
                    <>
                      <span className="text-zinc-300 dark:text-zinc-600">•</span>{" "}
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                        {industry}
                      </span>
                    </>
                  )}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1 font-mono">
                    <Mail className="h-3.5 w-3.5 text-zinc-400" />
                    {email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                    Member since {createdAt}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => {
                  setEditForm({
                    full_name: fullName !== "N/A" ? fullName : "",
                    company_name: companyName !== "N/A" ? companyName : "",
                    industry: industry !== "N/A" ? industry : "",
                    phone_number: phone !== "N/A" ? phone : "",
                  });
                  setIsEditOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-violet-500/20 transition-all hover:scale-[1.02] hover:shadow-violet-500/30 active:scale-[0.98]"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit Profile
              </button>

              <button
                onClick={() => router.push("/change-password")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200/80 bg-white px-3.5 py-2.5 text-xs font-semibold text-zinc-700 shadow-xs transition-all hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                <Lock className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                Change Password
              </button>
            </div>
          </div>
        </div>

        {/* 2-COLUMN MAIN LAYOUT */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          
          {/* LEFT COLUMN: Organization & Plan/Telephony (5 Cols) */}
          <div className="space-y-6 lg:col-span-5">
            
            {/* CARD 1: Organization & Personal Details */}
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800/80">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400">
                  <Building2 className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                    Organization Details
                  </h2>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Company profile & contact credentials
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3.5 text-xs">
                <div className="flex items-center justify-between border-b border-zinc-50 pb-2.5 dark:border-zinc-800/40">
                  <span className="text-zinc-500 dark:text-zinc-400">Company Name</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{companyName}</span>
                </div>

                <div className="flex items-center justify-between border-b border-zinc-50 pb-2.5 dark:border-zinc-800/40">
                  <span className="text-zinc-500 dark:text-zinc-400">Industry Sector</span>
                  <span className="inline-flex items-center rounded-md bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                    {industry}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-zinc-50 pb-2.5 dark:border-zinc-800/40">
                  <span className="text-zinc-500 dark:text-zinc-400">Primary Contact</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{fullName}</span>
                </div>

                <div className="flex items-center justify-between border-b border-zinc-50 pb-2.5 dark:border-zinc-800/40">
                  <span className="text-zinc-500 dark:text-zinc-400">Email Address</span>
                  <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">{email}</span>
                </div>

                <div className="flex items-center justify-between border-b border-zinc-50 pb-2.5 dark:border-zinc-800/40">
                  <span className="text-zinc-500 dark:text-zinc-400">Direct Phone</span>
                  <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">{phone}</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-zinc-500 dark:text-zinc-400">Timezone</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">Asia/Kolkata (IST)</span>
                </div>
              </div>
            </div>

            {/* CARD 2: Subscription & Provisioned Telephony */}
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800/80">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                  <CreditCard className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                    Plan & Provisioned Telephony
                  </h2>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Allocated resources configured by Admin
                  </p>
                </div>
              </div>

              {/* Plan & Credits */}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/50">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    Current Plan
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="inline-flex items-center rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-800 dark:bg-blue-950/80 dark:text-blue-300">
                      {plan}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/50">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    Available Credits
                  </span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-lg font-extrabold text-zinc-900 dark:text-white">
                      {userCredits}
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Credits</span>
                  </div>
                </div>
              </div>

              {/* Provisioned SIP Numbers */}
              <div className="mt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
                  Assigned Virtual Line (SIP / DID)
                </p>

                {phoneNumbersList.map((pn, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-800/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                        <PhoneCall className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100">
                          {pn.phone_number || phone}
                        </p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                          {pn.provider_name || "Tata Communications Cloud SIP"} • {pn.region || "India (+91)"}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                        <Radio className="h-2.5 w-2.5 animate-pulse text-emerald-500" />
                        Online
                      </span>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                        {pn.max_concurrent_calls || 3} channels
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: AI Calling Assistants & Clean White Agent Script Box (7 Cols) */}
          <div className="space-y-6 lg:col-span-7">
            
            {/* CARD 3: AI Calling Assistants */}
            <div className="rounded-2xl border border-emerald-200/70 bg-white p-6 shadow-xs dark:border-emerald-900/40 dark:bg-zinc-900">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800/80">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                      Configured AI Calling Agents
                    </h2>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Active voice bot assistants & prompt scripts
                    </p>
                  </div>
                </div>

                {/* Multiple Agent Selector Tabs if > 1 */}
                {agentsList.length > 1 && (
                  <div className="flex items-center gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
                    {agentsList.map((ag, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedAgentIndex(idx);
                          setScriptEditValue(ag.script || "");
                        }}
                        className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                          selectedAgentIndex === idx
                            ? "bg-white text-emerald-700 shadow-xs dark:bg-zinc-700 dark:text-emerald-300"
                            : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
                        }`}
                      >
                        Agent {idx + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Agent Specs Grid */}
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-800/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                    <Bot className="h-3 w-3 text-emerald-500" />
                    Agent Name
                  </span>
                  <p className="mt-1 text-xs font-bold text-zinc-900 dark:text-zinc-100 capitalize">
                    {currentAgent?.name || "sales"}
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-800/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                    <Globe className="h-3 w-3 text-blue-500" />
                    Language
                  </span>
                  <p className="mt-1 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {currentAgent?.language || "English"}
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-800/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                    <Mic className="h-3 w-3 text-purple-500" />
                    Voice Profile
                  </span>
                  <p className="mt-1 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {currentAgent?.voice || "Manisha"}
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-800/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                    <Zap className="h-3 w-3 text-amber-500" />
                    Telephony
                  </span>
                  <p className="mt-1 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    LiveKit + SIP
                  </p>
                </div>
              </div>

              {/* CLEAN SIMPLE WHITE BG AGENT SCRIPT BOX */}
              <div className="mt-5 rounded-2xl border border-zinc-200/90 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                {/* Script Box Header Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 px-4 py-3 bg-zinc-50/70 rounded-t-2xl dark:border-zinc-800 dark:bg-zinc-800/50">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      Agent Script & System Prompt
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-zinc-200/70 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                      {wordCount} words • {charCount} chars
                    </span>

                    {/* Edit Script Button */}
                    <button
                      onClick={() => {
                        setScriptEditValue(activeScript);
                        setIsScriptEditOpen(true);
                      }}
                      title="Edit Agent Script"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 text-[11px] font-semibold text-white shadow-xs transition"
                    >
                      <Pencil className="h-3 w-3" />
                      <span>Edit Script</span>
                    </button>

                    {/* Copy Script Button */}
                    <button
                      onClick={() => handleCopyScript(activeScript)}
                      title="Copy script"
                      className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    >
                      {copiedScript ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 text-zinc-500" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    {/* Expand/Collapse Full */}
                    <button
                      onClick={() => setIsScriptExpanded(!isScriptExpanded)}
                      title={isScriptExpanded ? "Minimize" : "Expand full"}
                      className="rounded-lg border border-zinc-200 bg-white p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                    >
                      {isScriptExpanded ? (
                        <Minimize2 className="h-3.5 w-3.5" />
                      ) : (
                        <Maximize2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Clean White Internal Scrollable Content Box */}
                <div
                  className={`p-4 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300 overflow-y-auto whitespace-pre-wrap ${
                    isScriptExpanded ? "max-h-[480px]" : "max-h-60"
                  }`}
                  style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "#d4d4d8 transparent",
                  }}
                >
                  {activeScript ? (
                    activeScript
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center text-zinc-400">
                      <Bot className="h-6 w-6 mb-1 text-zinc-400" />
                      <p className="text-xs">No custom prompt script provisioned yet.</p>
                      <button
                        onClick={() => {
                          setScriptEditValue("");
                          setIsScriptEditOpen(true);
                        }}
                        className="mt-2 text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                      >
                        + Add Script Instructions
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* EDIT AGENT SCRIPT MODAL (CLEAN WHITE BG) */}
      {isScriptEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-md transition-all animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-zinc-200/90 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 transition-all">
            
            {/* Modal Header Decorative Glow */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600" />

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 p-6 dark:border-zinc-800/80">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-100 to-teal-100 text-emerald-600 shadow-xs dark:from-emerald-950/80 dark:to-teal-950/80 dark:text-emerald-400 ring-4 ring-emerald-50 dark:ring-emerald-950/40">
                  <Code2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                      Edit Agent Script & System Prompt
                    </h3>
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {currentAgent?.name || "sales"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Define how your AI assistant introduces itself, handles questions, and guides leads
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsScriptEditOpen(false)}
                className="rounded-full p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSaveScript} className="p-6 space-y-4">
              
              {/* Agent Voice & Config Context Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-800/40">
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Voice: <strong className="text-zinc-800 dark:text-zinc-200 font-semibold">{currentAgent?.voice || "Manisha"}</strong>
                  </span>
                  <span className="text-zinc-300 dark:text-zinc-700">•</span>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Language: <strong className="text-zinc-800 dark:text-zinc-200 font-semibold">{currentAgent?.language || "English"}</strong>
                  </span>
                </div>

                <span className="text-[11px] font-mono font-medium text-zinc-500 dark:text-zinc-400">
                  {editWordCount} words • {editCharCount} characters
                </span>
              </div>

              {/* Dynamic Insertion Variables Chips */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                    Insert Dynamic Variables
                  </label>
                  <span className="text-[10px] text-zinc-400">Click to append variable</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {scriptVariables.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleInsertVariable(v)}
                      className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-mono text-[10px] font-semibold text-zinc-700 shadow-2xs transition hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-emerald-950/50 dark:hover:border-emerald-600"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Script Textarea (Clean White Background) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  System Instructions / Script Content
                </label>
                <textarea
                  rows={8}
                  required
                  placeholder="e.g., You are a friendly sales assistant representing GenX Reality. Start by greeting the user and explaining the VR AR product offerings..."
                  value={scriptEditValue}
                  onChange={(e) => setScriptEditValue(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-300 bg-white p-4 text-xs leading-relaxed text-zinc-900 placeholder-zinc-400 shadow-xs transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
                />
              </div>

              {/* Success Notification */}
              {scriptSaveSuccess && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 animate-in fade-in">
                  <CheckCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  Agent script updated and deployed immediately!
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex items-center justify-between border-t border-zinc-100 pt-5 dark:border-zinc-800/80">
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500 hidden sm:inline">
                  ⚡ Updates apply instantly to new outbound calls
                </span>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setIsScriptEditOpen(false)}
                    className="rounded-xl border border-zinc-200/90 px-4 py-2.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={savingScript}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-emerald-500/20 transition hover:scale-[1.02] hover:shadow-emerald-500/30 active:scale-[0.98] disabled:opacity-50"
                  >
                    {savingScript ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Saving Script...
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        Save Script
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ULTRA-FRIENDLY & MODERN EDIT PROFILE DETAILS MODAL */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-md transition-all animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-zinc-200/90 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 transition-all">
            
            {/* Modal Header Decorative Glow */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-500" />

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 p-6 dark:border-zinc-800/80">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-100 to-indigo-100 text-violet-600 shadow-xs dark:from-violet-950/80 dark:to-indigo-950/80 dark:text-violet-400 ring-4 ring-violet-50 dark:ring-violet-950/40">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                    Edit Profile Details
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Update your business identity and primary contact info
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsEditOpen(false)}
                className="rounded-full p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSaveProfile} className="p-6 space-y-5">
              
              {/* Live Preview Pill */}
              <div className="flex items-center gap-3.5 rounded-2xl border border-violet-100 bg-violet-50/40 p-3.5 dark:border-violet-950/50 dark:bg-violet-950/20">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-sm font-bold text-white shadow-xs">
                  {editInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {editForm.full_name || "Your Full Name"}
                    </p>
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                      Live Preview
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                    {editForm.company_name || "Company Name"} • {editForm.industry || "Industry / Sector"}
                  </p>
                </div>
              </div>

              {/* Input Fields Grid (2 Columns) */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    <UserIcon className="h-3.5 w-3.5 text-violet-500" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Sai Sathwik Andhe"
                    value={editForm.full_name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, full_name: e.target.value })
                    }
                    className="w-full rounded-xl border border-zinc-200/90 bg-white px-3.5 py-2.5 text-xs font-medium text-zinc-900 placeholder-zinc-400 shadow-2xs transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                  />
                </div>

                {/* Company Name */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    <Building2 className="h-3.5 w-3.5 text-blue-500" />
                    Company Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., GenX Reality"
                    value={editForm.company_name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, company_name: e.target.value })
                    }
                    className="w-full rounded-xl border border-zinc-200/90 bg-white px-3.5 py-2.5 text-xs font-medium text-zinc-900 placeholder-zinc-400 shadow-2xs transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                  />
                </div>

                {/* Industry / Sector with Presets */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    <span className="flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-purple-500" />
                      Industry / Sector
                    </span>
                    <span className="text-[10px] font-normal text-zinc-400">Click a chip or type custom</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., VR AR, Real Estate, Healthcare..."
                    value={editForm.industry}
                    onChange={(e) =>
                      setEditForm({ ...editForm, industry: e.target.value })
                    }
                    className="w-full rounded-xl border border-zinc-200/90 bg-white px-3.5 py-2.5 text-xs font-medium text-zinc-900 placeholder-zinc-400 shadow-2xs transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                  />

                  {/* Quick Select Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {industryPresets.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, industry: preset })}
                        className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold transition ${
                          editForm.industry.toLowerCase() === preset.toLowerCase()
                            ? "bg-violet-600 text-white shadow-xs"
                            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Direct Phone */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    <Phone className="h-3.5 w-3.5 text-emerald-500" />
                    Mobile / Direct Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 9885733334"
                    value={editForm.phone_number}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phone_number: e.target.value })
                    }
                    className="w-full rounded-xl border border-zinc-200/90 bg-white px-3.5 py-2.5 text-xs font-medium text-zinc-900 placeholder-zinc-400 shadow-2xs transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                  />
                </div>
              </div>

              {/* Feedback Success Notification */}
              {saveSuccess && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 animate-in fade-in">
                  <CheckCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  Profile details updated and synchronized successfully!
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex items-center justify-between border-t border-zinc-100 pt-5 dark:border-zinc-800/80">
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500 hidden sm:inline">
                  🔒 Syncs across your organization profile
                </span>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="rounded-xl border border-zinc-200/90 px-4 py-2.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-violet-500/20 transition hover:scale-[1.02] hover:shadow-violet-500/30 active:scale-[0.98] disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
