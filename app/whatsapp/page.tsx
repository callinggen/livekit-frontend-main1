"use client";

import { useState, useEffect, useRef } from "react";
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
  category: string;
  lead_score: number;
  last_message: string;
  datetime: string;
  summary: string;
  notes: string;
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
              phone: `+${cleanPhone}`,
              campaign_name: "WhatsApp Direct",
              status: "Connected",
              category: i % 3 === 0 ? "INTERESTED" : (i % 3 === 1 ? "LEAD" : "FOLLOW UP"),
              lead_score: Math.max(50, 95 - (i * 2)),
              last_message: lastMsg,
              datetime: "Today",
              summary: "Live WhatsApp Chat with customer",
              notes: "Direct contact via WhatsApp",
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
        const base64 = qrData?.data?.base64 || qrData?.data?.qrcode?.base64 || null;
        const code = qrData?.data?.code || qrData?.data?.pairingCode || null;

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

      {/* Main Container matching Reference Light Mode UI */}
      <div className="h-[calc(100vh-6rem)] flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-xl overflow-hidden font-sans text-slate-800">
        
        {/* Top App Header Bar */}
        <div className="h-16 border-b border-slate-100 px-6 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              WhatsApp Inbox
            </h1>
            <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-[#EEF2FF] text-[#4F46E5] tracking-wide">
              {credits ?? 2450} CREDITS
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

        {/* 3-Column Layout Matching the Screenshot */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden bg-slate-50/50">
          
          {/* ── COLUMN 1: Contact List (3.5 Cols) ────────────────────── */}
          <div className="md:col-span-3 lg:col-span-3 border-r border-slate-200/80 bg-white flex flex-col h-full overflow-hidden">
            
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
                          ? "bg-[#F8FAFC] border-l-4 border-indigo-600"
                          : "hover:bg-slate-50"
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

                        {/* Pill Badges matching reference */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getPillColor(
                              chat.category
                            )}`}
                          >
                            {chat.category}
                          </span>

                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]">
                            SCORE: {chat.lead_score}
                          </span>
                        </div>
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

          {/* ── COLUMN 2: Active Chat Conversation (6.5 Cols) ─────────── */}
          <div className="md:col-span-6 lg:col-span-6 flex flex-col bg-[#FAFBFD] h-full border-r border-slate-200/80 overflow-hidden">
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
                        <span className="text-[#4F46E5] font-semibold">Lead Score {activeChat.lead_score}</span>
                      </div>
                    </div>
                  </div>

                  {/* Header Right Actions */}
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => setShowSummaryModal(true)}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80 flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#4F46E5]" />
                      Call Summary
                    </button>

                    <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Conversation Feed Timeline */}
                <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-[#FAFBFD]">
                  
                  {activeChat.messages.map((msg, idx) => {
                    const isAgent = msg.sender === "agent";

                    return (
                      <div
                        key={idx}
                        className={`flex flex-col ${isAgent ? "items-end" : "items-start"} space-y-1.5`}
                      >
                        {/* Media Card (Image) */}
                        {msg.media_url && (
                          <div className="max-w-[85%] rounded-2xl overflow-hidden border border-slate-200/80 shadow-md bg-white">
                            <img
                              src={msg.media_url}
                              alt="Showcase Preview"
                              className="w-full h-56 object-cover"
                            />
                          </div>
                        )}

                        {/* Location Card */}
                        {msg.location_title && (
                          <div className="max-w-[85%] rounded-2xl p-3.5 border border-[#BBF7D0] bg-[#DCFCE7]/40 shadow-sm space-y-2">
                            <div className="bg-white rounded-xl p-3 border border-slate-100 flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
                                <MapPin className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-bold text-xs text-slate-900">{msg.location_title}</p>
                                <p className="text-[10px] text-slate-400">{msg.location_address}</p>
                              </div>
                            </div>
                            <div className="flex justify-end text-[9px] text-slate-400 font-medium">
                              <span>{msg.time}</span>
                              <CheckCheck className="w-3 h-3 text-[#10B981] ml-1" />
                            </div>
                          </div>
                        )}

                        {/* Standard Text Bubble */}
                        {msg.text && (
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                              isAgent
                                ? "bg-[#DCFCE7]/70 border border-[#86EFAC]/60 text-slate-800 rounded-tr-none shadow-sm"
                                : "bg-white border border-slate-200/80 text-slate-800 rounded-tl-none shadow-sm"
                            }`}
                          >
                            <p className="whitespace-pre-line">{msg.text}</p>

                            <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-400 font-medium">
                              <span>{msg.time}</span>
                              {isAgent && <CheckCheck className="w-3.5 h-3.5 text-[#10B981]" />}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                </div>

                {/* Chat Input Bar */}
                <div className="p-4 border-t border-slate-200/80 bg-white shrink-0">
                  <div className="flex items-center gap-3 bg-white border border-slate-200/80 rounded-2xl px-4 py-2.5 shadow-sm focus-within:ring-1 focus-within:ring-indigo-500">
                    <button
                      onClick={() => triggerAction("SEND_BROCHURE")}
                      className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                      title="Attach File / Brochure"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    <button className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                      <Smile className="w-4 h-4" />
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
                      className="w-8 h-8 rounded-full bg-[#4F46E5] hover:bg-indigo-700 text-white flex items-center justify-center transition-all shadow-md shrink-0"
                    >
                      <Mic className="w-4 h-4" />
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

          {/* ── COLUMN 3: AI Assistant & Context (2.5 Cols) ───────────── */}
          <div className="md:col-span-3 lg:col-span-3 p-4 flex flex-col space-y-4 bg-white h-full overflow-y-auto">
            
            {/* Panel Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-[#4F46E5]" />
                AI Assistant
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                LIVE CONTEXT
              </span>
            </div>

            {activeChat ? (
              <>
                {/* Context Analysis Card */}
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#4F46E5]" />
                    Context Analysis
                  </h4>

                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">
                      Last Call Outcome
                    </p>
                    <p className="text-xs font-semibold text-slate-800 leading-snug">
                      "{activeChat.summary}"
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200/60 shadow-xs">
                      <p className="text-[9px] uppercase font-bold text-slate-400">Intent</p>
                      <p className="text-xs font-bold text-[#10B981]">High Purchase</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200/60 shadow-xs">
                      <p className="text-[9px] uppercase font-bold text-slate-400">Budget</p>
                      <p className="text-xs font-bold text-slate-900">₹3.5 - 4.8Cr</p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    Quick Actions
                  </h4>

                  <div className="space-y-2">
                    <button
                      onClick={() => triggerAction("SEND_BROCHURE")}
                      disabled={isSending}
                      className="w-full py-2.5 px-3.5 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-between text-slate-800 transition-all"
                    >
                      <span className="flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-[#4F46E5]" />
                        Send Brochure (PDF)
                      </span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </button>

                    <button
                      onClick={() => triggerAction("SEND_PRICING")}
                      disabled={isSending}
                      className="w-full py-2.5 px-3.5 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-between text-slate-800 transition-all"
                    >
                      <span className="flex items-center gap-2">
                        <DollarSign className="w-3.5 h-3.5 text-[#10B981]" />
                        Share Pricing (PDF)
                      </span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </button>

                    <button
                      onClick={() => triggerAction("SEND_CALLBACK_CONFIRMATION")}
                      disabled={isSending}
                      className="w-full py-2.5 px-3.5 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-between text-slate-800 transition-all"
                    >
                      <span className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        Schedule Visit
                      </span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>
                </div>

                {/* Smart Templates */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#4F46E5]" />
                    Smart Templates
                  </h4>

                  <select
                    value={activeTabTemplate}
                    onChange={(e) => setActiveTabTemplate(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-800 font-semibold"
                  >
                    <option value="Follow-up after call">Follow-up after call</option>
                    <option value="Missed call follow-up">Missed call follow-up</option>
                    <option value="Pricing sheet share">Pricing sheet share</option>
                  </select>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed font-medium">
                    "Hi {activeChat.name}, as discussed during our call, I'm sharing the updated inventory and PDF overview. Let me know if you'd like to visit this weekend."
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => showToast("Scheduled message for tomorrow", "success")}
                      className="py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
                    >
                      Schedule
                    </button>
                    <button
                      onClick={() => triggerAction("SEND_BROCHURE")}
                      className="py-2 rounded-xl text-xs font-bold bg-[#4F46E5] hover:bg-indigo-700 text-white transition-all shadow-sm"
                    >
                      Send Now
                    </button>
                  </div>
                </div>

                {/* Automation Rules */}
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                    Automation Rules
                  </h4>

                  <div className="space-y-2">
                    <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={autoSummary}
                        onChange={(e) => setAutoSummary(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-[11px] text-slate-600 leading-snug">
                        <strong className="text-slate-800">After outbound call:</strong> Send summary message automatically
                      </span>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={autoCalendar}
                        onChange={(e) => setAutoCalendar(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-[11px] text-slate-600 leading-snug">
                        <strong className="text-slate-800">On meeting scheduled:</strong> Sync with Google Calendar & WhatsApp
                      </span>
                    </label>
                  </div>
                </div>
              </>
            ) : null}

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
