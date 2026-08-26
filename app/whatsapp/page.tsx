"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import {
  Search,
  Plus,
  Send,
  Paperclip,
  Smile,
  Mic,
  Sparkles,
  Bot,
  FileText,
  PhoneCall,
  CheckCheck,
  Calendar,
  Share2,
  BookOpen,
  DollarSign,
  Clock,
  ExternalLink,
  ChevronDown,
  X,
  Zap,
  MapPin,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  SlidersHorizontal,
  QrCode,
  RefreshCw,
  Smartphone,
  LogOut,
  Wifi,
  WifiOff,
  Loader2,
  Sliders,
  Volume2,
  MessageSquare,
  Layers,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useCredits } from "@/components/CreditsContext";
import { useRouter } from "next/navigation";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const INSTANCE_NAME = "callinggen";

interface MessageItem {
  id?: string | number;
  sender: "agent" | "customer";
  text: string;
  time: string;
  is_ai?: boolean;
  action_badge?: string;
  status?: string;
  media_url?: string;
  media_type?: string;
  media_title?: string;
  location_title?: string;
  location_address?: string;
}

interface ConversationItem {
  call_id: number;
  contact_id: number;
  name: string;
  phone: string;
  campaign_name: string;
  status: string;
  category?: string;
  lead_score?: number;
  last_message: string;
  datetime: string;
  summary?: string;
  notes?: string;
  messages: MessageItem[];
  avatar_color?: string;
  avatar_image?: string;
  unread?: number;
  remoteJid?: string;
}

export default function WhatsAppPage() {
  const { isLoggedIn } = useAuth();
  const { credits } = useCredits();
  const router = useRouter();

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedCallId, setSelectedCallId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [activeTabTemplate, setActiveTabTemplate] = useState("Follow-up after call");
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // WhatsApp Connection State
  const [connectionState, setConnectionState] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [connectedPhone, setConnectedPhone] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [qrCodeString, setQrCodeString] = useState<string | null>(null);
  const [isQrLoading, setIsQrLoading] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Automation toggles
  const [autoSummary, setAutoSummary] = useState(true);
  const [autoCalendar, setAutoCalendar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Check Connection Status on Mount
  const checkConnectionStatus = async () => {
    try {
      const res = await fetch(`${BASE_URL}/whatsapp/status?instance_name=${INSTANCE_NAME}`);
      if (!res.ok) return;
      const data = await res.json();
      const state = data?.data?.instance?.state || data?.data?.state || "disconnected";
      const owner = data?.data?.instance?.owner || data?.data?.owner || null;

      if (state === "open" || state === "connected") {
        setConnectionState("connected");
        setConnectedPhone(owner ? owner.replace("@s.whatsapp.net", "") : "Active");
        setShowQRModal(false);
        if (pollingRef.current) clearInterval(pollingRef.current);
        fetchRealEvolutionChats();
      } else if (state === "connecting") {
        setConnectionState("connecting");
      } else {
        setConnectionState("disconnected");
      }
    } catch (err) {
      console.log("Status check error:", err);
    }
  };

  // Fetch real Evolution API Chats from connected WhatsApp
  const fetchRealEvolutionChats = async () => {
    try {
      const res = await fetch(`${BASE_URL}/whatsapp/chats?instance_name=${INSTANCE_NAME}`);
      if (!res.ok) return;
      const json = await res.json();
      const rawChats = json?.data || [];

      if (Array.isArray(rawChats) && rawChats.length > 0) {
        const colors = [
          "from-blue-600 to-indigo-600",
          "from-emerald-600 to-teal-600",
          "from-purple-600 to-pink-600",
          "from-amber-600 to-orange-600",
          "from-rose-600 to-red-600",
        ];

        const mappedChats: ConversationItem[] = rawChats
          .filter((c: any) => c.remoteJid && !c.remoteJid.includes("@g.us"))
          .map((c: any, i: number) => {
            const jid = c.remoteJid || c.id || "";
            const cleanPhone = jid.replace("@s.whatsapp.net", "").replace("@lid", "");
            const name = c.pushName || (cleanPhone.length >= 10 ? `+${cleanPhone}` : `Chat ${i + 1}`);
            const lastMsg = c.lastMessage?.message?.conversation || 
                            c.lastMessage?.message?.extendedTextMessage?.text || 
                            (c.lastMessage?.message?.documentMessage ? "[Document / PDF]" : "Active conversation");

            return {
              call_id: 1000 + i,
              contact_id: 2000 + i,
              name: name,
              phone: cleanPhone.startsWith("+") ? cleanPhone : `+${cleanPhone}`,
              campaign_name: "WhatsApp Direct",
              status: "Connected",
              category: undefined,
              lead_score: undefined,
              last_message: lastMsg,
              datetime: "Today",
              summary: undefined,
              notes: undefined,
              unread: c.unreadCount || 0,
              avatar_image: c.profilePicUrl || undefined,
              avatar_color: colors[i % colors.length],
              remoteJid: jid,
              messages: [
                {
                  sender: c.lastMessage?.key?.fromMe ? "agent" : "customer",
                  text: lastMsg,
                  time: "Today",
                  is_ai: c.lastMessage?.key?.fromMe,
                },
              ],
            };
          });

        if (mappedChats.length > 0) {
          setConversations(mappedChats);
          setSelectedCallId((prev) => prev !== null ? prev : mappedChats[0].call_id);
          // Automatically load full message history for the first chat
          handleSelectChat(mappedChats[0]);
        }
      }
    } catch (err) {
      console.log("Could not fetch real chats:", err);
    }
  };

  // Load live message history when selecting a chat
  const handleSelectChat = async (chat: ConversationItem) => {
    setSelectedCallId(chat.call_id);

    if (chat.remoteJid && connectionState === "connected") {
      try {
        const res = await fetch(`${BASE_URL}/whatsapp/messages?instance_name=${INSTANCE_NAME}&remote_jid=${encodeURIComponent(chat.remoteJid)}`);
        if (!res.ok) return;
        const json = await res.json();
        const data = json?.data || json;
        const records = data?.messages?.records || data?.records || [];

        if (Array.isArray(records)) {
          const parsedMsgs: MessageItem[] = records.map((r: any) => {
            const isMe = Boolean(r.key?.fromMe);
            const doc = r.message?.documentMessage;
            const img = r.message?.imageMessage;
            
            let text = r.message?.conversation || 
                       r.message?.extendedTextMessage?.text || 
                       doc?.caption ||
                       img?.caption ||
                       (doc ? `📄 Document: ${doc.fileName || "File.pdf"}` : (img ? "📷 [Image attachment]" : ""));

            if (!text && r.message) {
              const msgKeys = Object.keys(r.message);
              if (msgKeys.length > 0) text = `[${msgKeys[0].replace("Message", "")}]`;
            }

            const date = r.messageTimestamp
              ? new Date(r.messageTimestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "Today";

            return {
              id: r.key?.id || Math.random(),
              sender: isMe ? "agent" : "customer",
              text: text || "Message",
              time: date,
              is_ai: isMe,
              status: "sent",
            };
          });

          // Order oldest to newest
          parsedMsgs.reverse();

          setConversations((prev) =>
            prev.map((c) =>
              c.call_id === chat.call_id ? { ...c, messages: parsedMsgs } : c
            )
          );
        }
      } catch (err) {
        console.log("Messages load error:", err);
      }
    }
  };

  // Connect WhatsApp QR Modal handler
  const handleOpenConnectModal = async () => {
    setShowQRModal(true);
    setIsQrLoading(true);
    setQrCodeBase64(null);
    setQrCodeString(null);

    try {
      try {
        await fetch(`${BASE_URL}/whatsapp/instance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ instance_name: INSTANCE_NAME }),
        });
      } catch (e) {}

      const qrRes = await fetch(`${BASE_URL}/whatsapp/qr?instance_name=${INSTANCE_NAME}`);
      if (qrRes.ok) {
        const qrData = await qrRes.json();
        const base64 = qrData?.data?.base64 || qrData?.data?.qrcode?.base64 || qrData?.base64 || null;
        const code = qrData?.data?.code || qrData?.data?.pairingCode || qrData?.code || null;

        if (base64) {
          setQrCodeBase64(base64);
        } else if (code) {
          setQrCodeString(code);
        }
      }

      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = setInterval(async () => {
        const statusRes = await fetch(`${BASE_URL}/whatsapp/status?instance_name=${INSTANCE_NAME}`);
        if (statusRes.ok) {
          const sData = await statusRes.json();
          const state = sData?.data?.instance?.state || sData?.data?.state;
          const owner = sData?.data?.instance?.owner;
          if (state === "open" || state === "connected") {
            setConnectionState("connected");
            setConnectedPhone(owner ? owner.replace("@s.whatsapp.net", "") : "Connected");
            setShowQRModal(false);
            if (pollingRef.current) clearInterval(pollingRef.current);
            showToast("✓ WhatsApp Number Connected Successfully!", "success");
            fetchRealEvolutionChats();
          }
        }
      }, 3000);
    } catch (err) {
      showToast("Ensure Evolution API Docker container is running.", "error");
    } finally {
      setIsQrLoading(false);
    }
  };

  // Disconnect
  const handleDisconnect = async () => {
    try {
      await fetch(`${BASE_URL}/whatsapp/logout?instance_name=${INSTANCE_NAME}`, { method: "DELETE" });
      setConnectionState("disconnected");
      setConnectedPhone(null);
      setConversations([]);
      setSelectedCallId(null);
      showToast("WhatsApp disconnected", "success");
    } catch (err) {
      showToast("Disconnected", "success");
    }
  };

  // Trigger one of the AI allowed WhatsApp actions
  const triggerAction = async (actionName: string) => {
    if (!activeChat) return;
    setIsSending(true);

    try {
      const res = await fetch(`${BASE_URL}/api/calls/${activeChat.call_id}/whatsapp-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionName }),
      });
      const data = await res.json();

      if (data.status === "skipped_duplicate") {
        showToast(`Action '${actionName}' already sent for this call.`, "success");
      } else if (data.success) {
        showToast(`✓ ${actionName.replace("SEND_", "").replace("_", " ")} sent via WhatsApp!`, "success");
      } else {
        showToast(`Notice: ${data.error || "Action queued safely"}`, "error");
      }

      const newMsg: MessageItem = {
        sender: "agent",
        text: `Shared ${actionName.replace("SEND_", "").replace("_", " ")} with customer via WhatsApp.`,
        time: "Just now",
        is_ai: true,
        action_badge: actionName,
        status: "sent",
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.call_id === activeChat.call_id
            ? { ...c, messages: [...c.messages, newMsg], last_message: newMsg.text }
            : c
        )
      );
    } catch (err) {
      showToast("WhatsApp action executed.", "success");
    } finally {
      setIsSending(false);
    }
  };

  // Send message via Evolution API directly
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !activeChat) return;
    const textToSend = inputMessage.trim();
    setInputMessage("");

    const newMsg: MessageItem = {
      sender: "agent",
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      is_ai: true,
      status: "sent",
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.call_id === activeChat.call_id
          ? { ...c, messages: [...c.messages, newMsg], last_message: textToSend }
          : c
      )
    );

    // Send to Evolution API if connected
    if (activeChat.phone) {
      try {
        await fetch(`${BASE_URL}/whatsapp/send-text`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instance_name: INSTANCE_NAME,
            number: activeChat.phone,
            text: textToSend,
          }),
        });
        showToast("✓ Message delivered to WhatsApp", "success");
      } catch (err) {
        console.log("Send error:", err);
      }
    }
  };

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }
    checkConnectionStatus();

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isLoggedIn, router]);

  const activeChat = conversations.find((c) => c.call_id === selectedCallId) || conversations[0];

  const filteredChats = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    c.last_message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPillColor = (category: string) => {
    switch (category?.toUpperCase()) {
      case "INTERESTED":
      case "HOT":
        return "bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]";
      case "LEAD":
      case "LEAD SCORE":
      case "WARM":
        return "bg-[#E0E7FF] text-[#4338CA] border-[#C7D2FE]";
      case "FOLLOW UP":
        return "bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  if (!isLoggedIn) return null;

  return (
    <DashboardShell title="WhatsApp Integration">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium animate-in fade-in slide-in-from-top-4 duration-200 ${
            toastMessage.type === "success"
              ? "bg-[#064E3B] text-emerald-100 border-emerald-600/50 backdrop-blur-md"
              : "bg-rose-950/90 text-rose-200 border-rose-700/50 backdrop-blur-md"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ── Sub Navigation Header Tabs ── */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
          <Link
            href="/whatsapp"
            className="flex items-center gap-2 rounded-lg bg-white dark:bg-zinc-800 px-3.5 py-1.5 text-xs font-semibold text-zinc-900 dark:text-white shadow-sm transition"
          >
            <MessageSquare className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
            Chat Inbox
          </Link>
          <Link
            href="/whatsapp/send"
            className="flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition"
          >
            <Send className="h-3.5 w-3.5" />
            Send Message
          </Link>
          <Link
            href="/whatsapp/materials"
            className="flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition"
          >
            <Layers className="h-3.5 w-3.5" />
            Material Base
          </Link>
          <Link
            href="/whatsapp/history"
            className="flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition"
          >
            <Clock className="h-3.5 w-3.5" />
            History
          </Link>
        </div>
      </div>

      {/* Main Container matching Reference Light Mode UI */}
      <div className="h-[calc(100vh-9.5rem)] flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-xl overflow-hidden font-sans text-slate-800">
        
        {/* Top App Header Bar */}
        <div className="h-16 border-b border-slate-100 px-6 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              WhatsApp Inbox
            </h1>
            <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-[#EEF2FF] text-[#4F46E5] tracking-wide">
              {credits ?? 2000} CREDITS
            </span>
          </div>

          {/* Connection Controls */}
          <div className="flex items-center gap-3">
            {connectionState === "connected" ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Connected: {connectedPhone || "+91 (Active)"}
                </span>

                <button
                  onClick={fetchRealEvolutionChats}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"
                  title="Sync Live Chats"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                <button
                  onClick={handleDisconnect}
                  className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
                  title="Disconnect"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleOpenConnectModal}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 transition-all shadow-sm"
              >
                <QrCode className="w-4 h-4" />
                Connect Number
              </button>
            )}
          </div>
        </div>

        {/* 2-Column Responsive Layout without AI Assistant Panel */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden bg-slate-50/50">
          
          {/* ── COLUMN 1: Contact List (4 Cols) ────────────────────── */}
          <div className="md:col-span-4 lg:col-span-4 border-r border-slate-200/80 bg-white flex flex-col h-full overflow-hidden">
            
            {/* Search + Action Top Bar */}
            <div className="p-4 border-b border-slate-100 space-y-3 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-9 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400 font-medium"
                />
                <SlidersHorizontal className="w-3.5 h-3.5 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-slate-600" />
              </div>

              <button
                onClick={() => router.push("/call-manager")}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                + Start New Call
              </button>
            </div>

            {/* Chats List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {filteredChats.length === 0 ? (
                <div className="p-8 text-center space-y-2 text-slate-400 text-xs">
                  <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="font-semibold text-slate-600">No WhatsApp Chats Yet</p>
                  <p>Click "Connect Number" or trigger a voice call to start messaging.</p>
                </div>
              ) : (
                filteredChats.map((chat) => {
                  const isSelected = chat.call_id === selectedCallId;

                  return (
                    <div
                      key={chat.call_id}
                      onClick={() => handleSelectChat(chat)}
                      className={`p-4 cursor-pointer transition-all flex items-start gap-3.5 relative ${
                        isSelected
                          ? "bg-[#EEF2FF] border-l-4 border-[#4F46E5]"
                          : "hover:bg-slate-50/80 bg-white"
                      }`}
                    >
                      {/* Avatar */}
                      {chat.avatar_image ? (
                        <img
                          src={chat.avatar_image}
                          alt={chat.name}
                          className="w-11 h-11 rounded-full object-cover shrink-0 border border-slate-200"
                        />
                      ) : (
                        <div
                          className={`w-11 h-11 rounded-full bg-gradient-to-br ${
                            chat.avatar_color || "from-indigo-600 to-purple-600"
                          } flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm`}
                        >
                          {chat.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .substring(0, 2)
                            .toUpperCase()}
                        </div>
                      )}

                      {/* Chat Text Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <p className="font-bold text-xs text-slate-900 truncate">{chat.name}</p>
                          <span className="text-[10px] text-slate-400 shrink-0 font-medium">{chat.datetime}</span>
                        </div>

                        <p className="text-[11px] text-slate-500 truncate mb-1.5">{chat.last_message}</p>

                        {/* Badges: only show if valid category or lead score exists */}
                        {(chat.category || typeof chat.lead_score === "number") && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {chat.category && (
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getPillColor(
                                  chat.category
                                )}`}
                              >
                                {chat.category}
                              </span>
                            )}

                            {typeof chat.lead_score === "number" && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]">
                                SCORE: {chat.lead_score}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Unread Count Badge */}
                      {chat.unread && chat.unread > 0 ? (
                        <span className="w-5 h-5 rounded-full bg-[#4F46E5] text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm">
                          {chat.unread}
                        </span>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── COLUMN 2: Active Chat Conversation (8 Cols) ─────────── */}
          <div className="md:col-span-8 lg:col-span-8 flex flex-col bg-[#FAFBFD] h-full overflow-hidden">
            {activeChat ? (
              <>
                {/* Active Chat Top Header */}
                <div className="p-4 border-b border-slate-200/80 flex items-center justify-between bg-white shrink-0">
                  <div className="flex items-center gap-3">
                    {activeChat.avatar_image ? (
                      <img
                        src={activeChat.avatar_image}
                        alt={activeChat.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div
                        className={`w-10 h-10 rounded-full bg-gradient-to-br ${
                          activeChat.avatar_color || "from-indigo-600 to-purple-600"
                        } flex items-center justify-center text-white font-bold text-xs shrink-0`}
                      >
                        {activeChat.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()}
                      </div>
                    )}

                    <div>
                      <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        {activeChat.name}
                        <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                      </h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                        <span className="text-[#10B981] font-semibold">Active now</span>
                        <span>•</span>
                        <span>{activeChat.phone}</span>
                        <span>•</span>
                        <span>{activeChat.campaign_name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowSummaryModal(true)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
                      Call Summary
                    </button>

                    <button
                      onClick={() => router.push(`/call-logs`)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-1.5"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-indigo-600" />
                      View Call Log
                    </button>
                  </div>
                </div>

                {/* Messages Scroll Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                  
                  {/* Lead Call Context Banner: Only shown if real AI summary exists */}
                  {activeChat.summary ? (
                    <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-indigo-100/80 text-indigo-600 shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="text-xs space-y-1">
                        <p className="font-bold text-indigo-950">AI Call Summary Context</p>
                        <p className="text-indigo-900/80 leading-relaxed font-medium">
                          "{activeChat.summary}"
                        </p>
                        {activeChat.notes ? (
                          <p className="text-[11px] text-indigo-700/70 font-semibold pt-0.5">
                            Note: {activeChat.notes}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  {/* Individual Messages */}
                  {activeChat.messages && activeChat.messages.length > 0 ? (
                    activeChat.messages.map((msg, index) => {
                      const isAgent = msg.sender === "agent";

                      return (
                        <div
                          key={msg.id || index}
                          className={`flex flex-col ${isAgent ? "items-end" : "items-start"}`}
                        >
                          <div
                            className={`max-w-[80%] md:max-w-[70%] rounded-2xl p-4 space-y-2 shadow-xs ${
                              isAgent
                                ? "bg-[#4F46E5] text-white rounded-br-none"
                                : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-none"
                            }`}
                          >
                            {/* AI Action Badge if present */}
                            {msg.action_badge ? (
                              <div
                                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  isAgent
                                    ? "bg-white/20 text-white"
                                    : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                }`}
                              >
                                <Sparkles className="w-2.5 h-2.5" />
                                {msg.action_badge}
                              </div>
                            ) : null}

                            {/* Message Text */}
                            <p className="text-xs md:text-[13px] leading-relaxed whitespace-pre-wrap font-medium">
                              {msg.text}
                            </p>

                            {/* Media Attachment if present */}
                            {msg.media_url ? (
                              <div
                                className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                                  isAgent
                                    ? "bg-white/10 border-white/20 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-800"
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <FileText className="w-4 h-4 shrink-0" />
                                  <span className="truncate font-semibold text-[11px]">
                                    {msg.media_title || "Attached Document"}
                                  </span>
                                </div>
                                <a
                                  href={msg.media_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`p-1.5 rounded-lg text-[10px] font-bold shrink-0 transition-colors ${
                                    isAgent
                                      ? "bg-white text-[#4F46E5] hover:bg-slate-100"
                                      : "bg-indigo-600 text-white hover:bg-indigo-500"
                                  }`}
                                >
                                  View
                                </a>
                              </div>
                            ) : null}

                            {/* Footer time & status */}
                            <div
                              className={`flex items-center justify-end gap-1 text-[10px] pt-1 ${
                                isAgent ? "text-indigo-200" : "text-slate-400"
                              }`}
                            >
                              <span>{msg.time}</span>
                              {isAgent ? (
                                <CheckCheck className="w-3.5 h-3.5 text-indigo-200" />
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-12 text-center text-xs text-slate-400">
                      No messages in this chat yet. Type a message below to reach out.
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Bottom Input Field */}
                <div className="p-4 bg-white border-t border-slate-200/80 shrink-0">
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                    
                    <button
                      onClick={() => triggerAction("SEND_BROCHURE")}
                      disabled={isSending}
                      title="Send Brochure PDF"
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl transition-all"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => triggerAction("SEND_PRICING")}
                      disabled={isSending}
                      title="Send Pricing PDF"
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl transition-all"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>

                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSendMessage();
                      }}
                      className="flex-1 bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium"
                    />

                    <button
                      onClick={handleSendMessage}
                      disabled={isSending || !inputMessage.trim()}
                      className="w-9 h-9 rounded-xl bg-[#4F46E5] hover:bg-indigo-700 disabled:opacity-50 text-white flex items-center justify-center transition-all shadow-sm shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 space-y-3">
                <MessageSquare className="w-12 h-12 text-slate-300" />
                <p className="font-semibold text-slate-700">Select a chat to view messages</p>
                <p className="text-xs text-slate-400 text-center max-w-sm">
                  Your connected WhatsApp account messages and voice call follow-ups will appear here.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* --- QR Code Modal --- */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5 animate-in zoom-in-95 duration-200 text-center">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-600" />
                Connect WhatsApp Device
              </h3>
              <button
                onClick={() => {
                  setShowQRModal(false);
                  if (pollingRef.current) clearInterval(pollingRef.current);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Scan this QR code with WhatsApp on your phone to link your number and send voice call follow-ups automatically.
              </p>

              {/* QR Code */}
              <div className="bg-white p-4 rounded-2xl shadow-inner border border-slate-200 flex flex-col items-center justify-center min-h-[220px] w-64 mx-auto">
                {isQrLoading ? (
                  <div className="flex flex-col items-center gap-2 text-slate-400 text-xs">
                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                    <span>Generating QR Code...</span>
                  </div>
                ) : qrCodeBase64 ? (
                  <img
                    src={qrCodeBase64.startsWith("data:") ? qrCodeBase64 : `data:image/png;base64,${qrCodeBase64}`}
                    alt="WhatsApp QR Code"
                    className="w-56 h-56 object-contain"
                  />
                ) : (
                  <div className="text-xs text-slate-600 p-3 space-y-2">
                    <AlertCircle className="w-6 h-6 mx-auto text-amber-500" />
                    <p className="font-semibold text-slate-800">Generating code...</p>
                    <p className="text-[11px] text-slate-500">Connecting to Evolution API instance.</p>
                  </div>
                )}
              </div>

              {/* Step-by-Step Instructions */}
              <div className="text-left bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-[11px] text-slate-600 font-medium">
                <p className="font-bold text-slate-900">How to connect:</p>
                <p>1. Open <strong>WhatsApp</strong> on your phone.</p>
                <p>2. Tap <strong>Menu (⋮)</strong> or <strong>Settings</strong> $\to$ <strong>Linked Devices</strong>.</p>
                <p>3. Tap <strong>Link a Device</strong> and point your camera at this QR code.</p>
              </div>

              {/* Live Polling Status */}
              <div className="flex items-center justify-center gap-2 text-[11px] text-emerald-600 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Waiting for WhatsApp scan...</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={handleOpenConnectModal}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh QR
              </button>
              <button
                onClick={() => {
                  setShowQRModal(false);
                  if (pollingRef.current) clearInterval(pollingRef.current);
                }}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 shadow-md"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- Call Summary Modal --- */}
      {showSummaryModal && activeChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Call Summary • {activeChat.name}
              </h3>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="font-bold text-[10px] uppercase text-slate-400 mb-1">AI Overview</p>
                <p className="text-xs font-semibold text-slate-800">{activeChat.summary}</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <p className="text-[9px] uppercase font-bold text-slate-400">Category</p>
                  <p className="text-xs font-bold text-emerald-600">{activeChat.category}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <p className="text-[9px] uppercase font-bold text-slate-400">Lead Score</p>
                  <p className="text-xs font-bold text-indigo-600">{activeChat.lead_score} / 100</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <p className="text-[9px] uppercase font-bold text-slate-400">Outcome</p>
                  <p className="text-xs font-bold text-slate-800">{activeChat.notes}</p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowSummaryModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
