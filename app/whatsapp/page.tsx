"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import {
  Search,
  Send,
  Paperclip,
  Sparkles,
  CheckCheck,
  Check,
  Clock,
  X,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  QrCode,
  RefreshCw,
  Smartphone,
  LogOut,
  Loader2,
  MessageSquare,
  Layers,
  Copy,
  Key,
  ShieldAlert,
  User,
  Phone,
  Video,
  MoreVertical,
  FileText,
  UserPlus,
  Bot,
  Laptop,
  Archive,
  Star,
  Users,
  Radio,
  Smile,
  Mic,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  Image as ImageIcon,
  CheckSquare,
  Download,
  Eye,
  FileCheck,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useCredits } from "@/components/CreditsContext";
import { useRouter } from "next/navigation";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? "" : "http://127.0.0.1:8000");

interface MessageItem {
  id?: string | number;
  sender: "agent" | "customer";
  text: string;
  time: string;
  is_ai?: boolean;
  action_badge?: string;
  status?: string;
  media_url?: string;
  media_type?: "image" | "document" | "video" | "audio" | "text";
  media_title?: string;
  file_size?: string;
  mimetype?: string;
}

interface ConversationItem {
  call_id: number;
  contact_id: number;
  name: string;
  phone: string;
  campaign_name: string;
  status: string;
  category?: string;
  last_message: string;
  datetime: string;
  messages: MessageItem[];
  avatar_color?: string;
  avatar_image?: string;
  unread?: number;
  remoteJid?: string;
  is_group?: boolean;
  is_favorite?: boolean;
  is_client?: boolean;
  is_genx?: boolean;
  is_archived?: boolean;
}

function formatBytes(bytes?: number | string): string {
  if (!bytes) return "";
  const b = typeof bytes === "string" ? parseInt(bytes, 10) : bytes;
  if (isNaN(b) || b <= 0) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function formatPhoneDisplay(rawPhone?: string): string {
  if (!rawPhone) return "";
  const digits = rawPhone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  if (digits.length > 14) {
    return "";
  }
  return rawPhone.startsWith("+") ? rawPhone : (digits ? `+${digits}` : "");
}

function getInitials(name?: string): string {
  if (!name || name.startsWith("+")) return "WA";
  const clean = name.replace(/[^a-zA-Z\s]/g, "").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return "WA";
}

const AVATAR_GRADIENTS = [
  "from-emerald-500 to-teal-600",
  "from-blue-500 to-indigo-600",
  "from-purple-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-red-600",
  "from-cyan-500 to-blue-600",
  "from-violet-500 to-purple-600",
];

export default function WhatsAppPage() {
  const { isLoggedIn, user } = useAuth();
  const { credits } = useCredits();
  const router = useRouter();

  // Per-user WhatsApp instance name — isolates each account's session
  const instanceName = user?.id ? `user_${user.id}` : "callinggen_default";

  // Navigation & Filter states
  const [activeNavTab, setActiveNavTab] = useState<"chats" | "calls" | "status" | "channels" | "communities" | "meta_ai">("chats");
  const [activeFilter, setActiveFilter] = useState<"All" | "Favorites" | "Clients" | "Genx" | "Unread" | "Groups">("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Data states
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedCallId, setSelectedCallId] = useState<number | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Connection & Login states
  const [connectionState, setConnectionState] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [connectedPhone, setConnectedPhone] = useState<string | null>(null);
  const [connectedProfileName, setConnectedProfileName] = useState<string | null>(null);
  const [loginMode, setLoginMode] = useState<"qr" | "phone">("qr");
  const [stayLoggedIn, setStayLoggedIn] = useState(true);

  const QR_TIMEOUT_SECONDS = 60;

  // Original QR Code from Evolution API
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [isQrLoading, setIsQrLoading] = useState(false);
  const [qrSecondsLeft, setQrSecondsLeft] = useState(QR_TIMEOUT_SECONDS);
  const [isQrExpired, setIsQrExpired] = useState(false);

  // Phone Pairing Code states
  const [pairingPhone, setPairingPhone] = useState("");
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [isPairingLoading, setIsPairingLoading] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // Modals & Attachment states
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title?: string } | null>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showMaterialPicker, setShowMaterialPicker] = useState(false);
  const [availableMaterials, setAvailableMaterials] = useState<any[]>([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);

  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showMetaAiModal, setShowMetaAiModal] = useState(false);
  const [metaAiPrompt, setMetaAiPrompt] = useState("");
  const [metaAiResponse, setMetaAiResponse] = useState("");
  const [isMetaAiLoading, setIsMetaAiLoading] = useState(false);
  const [isRefreshingChats, setIsRefreshingChats] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const qrTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Connection Status Checking
  const checkConnectionStatus = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/whatsapp/status?instance_name=${instanceName}`);
      if (!res.ok) return;
      const json = await res.json();
      const state = json?.data?.instance?.state || json?.data?.state || "disconnected";
      const owner = json?.data?.instance?.owner || json?.data?.owner || null;
      const profileName = json?.data?.instance?.profileName || json?.data?.profileName || null;

      if (state === "open" || state === "connected") {
        setConnectionState("connected");
        setConnectedPhone(owner ? formatPhoneDisplay(owner.replace("@s.whatsapp.net", "")) : "Active WhatsApp Number");
        setConnectedProfileName(profileName || user?.name || "WhatsApp User");
        fetchRealEvolutionChats();
      } else if (state === "connecting") {
        setConnectionState("connecting");
      } else {
        setConnectionState("disconnected");
      }
    } catch {
      // Quiet fail
    }
  }, [user?.name, instanceName]);

  // 2. Fetch Original QR Code from Backend API
  const fetchQRCode = useCallback(async () => {
    setIsQrLoading(true);
    setIsQrExpired(false);
    setQrSecondsLeft(QR_TIMEOUT_SECONDS);
    try {
      const res = await fetch(`${BASE_URL}/api/whatsapp/qr?instance_name=${instanceName}`);
      if (res.ok) {
        const json = await res.json();
        const data = json?.data || json;
        const b64 = data?.base64 || data?.qrcode?.base64 || data?.qrcode || data?.code || null;
        if (b64) {
          setQrCodeBase64(b64);
        }
      }
    } catch (err) {
      console.warn("Could not load QR code:", err);
    } finally {
      setIsQrLoading(false);
    }
  }, [instanceName]);

  // 3. QR Code Countdown Timer & Auto-Refresh Interval
  useEffect(() => {
    if (connectionState === "connected" || loginMode !== "qr") {
      if (qrTimerRef.current) clearInterval(qrTimerRef.current);
      return;
    }

    qrTimerRef.current = setInterval(() => {
      setQrSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsQrExpired(true);
          // Auto-refresh when expired
          fetchQRCode();
          return QR_TIMEOUT_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (qrTimerRef.current) clearInterval(qrTimerRef.current);
    };
  }, [connectionState, loginMode, fetchQRCode]);

  // Initial QR code load
  useEffect(() => {
    if (connectionState === "disconnected" && loginMode === "qr") {
      fetchQRCode();
    }
  }, [connectionState, loginMode, fetchQRCode]);

  // 4. Polling for Live Connection (Every 2.5s when disconnected)
  useEffect(() => {
    if (connectionState === "connected") {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }

    pollingRef.current = setInterval(() => {
      checkConnectionStatus();
    }, 2500);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [connectionState, checkConnectionStatus]);

  // 5. Generate Phone Pairing Code
  const handleGeneratePairingCode = async () => {
    if (!pairingPhone.trim()) {
      showToast("Please enter your phone number with country code", "error");
      return;
    }

    const cleanNumber = pairingPhone.replace(/\D/g, "");
    if (cleanNumber.length < 10) {
      showToast("Please enter a valid phone number (at least 10 digits)", "error");
      return;
    }

    setIsPairingLoading(true);
    setPairingCode(null);
    setCodeCopied(false);

    try {
      const res = await fetch(`${BASE_URL}/api/whatsapp/qr?instance_name=${instanceName}&number=${encodeURIComponent(cleanNumber)}`);
      const json = await res.json();
      const data = json?.data || json;
      const code = data?.pairingCode || data?.qrcode?.pairingCode || null;

      if (res.ok && code) {
        setPairingCode(code);
        showToast("Pairing code generated! Enter it on your phone.", "success");
      } else {
        showToast(json?.detail || data?.error || "Failed to generate pairing code. Please try again.", "error");
      }
    } catch (err: any) {
      showToast(`Error: ${err.message || "Failed to contact server"}`, "error");
    } finally {
      setIsPairingLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (pairingCode) {
      navigator.clipboard.writeText(pairingCode.replace(/\s+/g, ""));
      setCodeCopied(true);
      showToast("Pairing code copied to clipboard!");
      setTimeout(() => setCodeCopied(false), 3000);
    }
  };

  // 6. Disconnect Instance (Logout)
  const handleDisconnect = async () => {
    try {
      await fetch(`${BASE_URL}/api/whatsapp/logout?instance_name=${instanceName}`, {
        method: "DELETE",
      });
      setConnectionState("disconnected");
      setConnectedPhone(null);
      setConnectedProfileName(null);
      setConversations([]);
      setSelectedCallId(null);
      setShowLogoutConfirmModal(false);
      showToast("Disconnected from WhatsApp.", "success");
      fetchQRCode();
    } catch {
      showToast("Disconnected locally.", "success");
      setConnectionState("disconnected");
      setShowLogoutConfirmModal(false);
    }
  };

  // 7. Fetch Real Evolution API Chats
  const fetchRealEvolutionChats = async () => {
    setIsRefreshingChats(true);
    try {
      const res = await fetch(`${BASE_URL}/api/whatsapp/chats?instance_name=${instanceName}`);
      if (!res.ok) {
        setIsRefreshingChats(false);
        return;
      }
      const json = await res.json();
      const rawChats = json?.data || [];

      if (Array.isArray(rawChats) && rawChats.length > 0) {
        const mappedChats: ConversationItem[] = rawChats
          .filter((c: any) => c.remoteJid)
          .map((c: any, i: number) => {
            const jid = c.remoteJid || c.id || "";
            const isGroup = jid.includes("@g.us");
            const cleanPhoneDigits = jid.replace("@s.whatsapp.net", "").replace("@lid", "").replace(/\D/g, "");
            const resolvedPhone = c.resolved_phone || (cleanPhoneDigits.length <= 14 ? cleanPhoneDigits : "");
            const formattedPhone = formatPhoneDisplay(resolvedPhone);
            const name = c.resolved_name || c.pushName || c.name || (isGroup ? "WhatsApp Group" : (formattedPhone || `Contact ${i + 1}`));

            const lastMsgObj = c.lastMessage?.message;
            const isLastImg = Boolean(lastMsgObj?.imageMessage || lastMsgObj?.viewOnceMessage?.message?.imageMessage);
            const isLastDoc = Boolean(lastMsgObj?.documentMessage || lastMsgObj?.documentWithCaptionMessage?.message?.documentMessage);
            const isLastAudio = Boolean(lastMsgObj?.audioMessage);
            const isLastVideo = Boolean(lastMsgObj?.videoMessage);

            let lastMsg = lastMsgObj?.conversation || lastMsgObj?.extendedTextMessage?.text;
            if (!lastMsg) {
              if (isLastImg) lastMsg = "📷 Photo";
              else if (isLastDoc) lastMsg = `📄 ${lastMsgObj?.documentMessage?.fileName || "Document"}`;
              else if (isLastAudio) lastMsg = "🎵 Voice message";
              else if (isLastVideo) lastMsg = "🎥 Video";
              else lastMsg = "Active conversation";
            }

            return {
              call_id: 1000 + i,
              contact_id: 2000 + i,
              name: name,
              phone: formattedPhone || (c.resolved_phone ? `+${c.resolved_phone}` : ""),
              campaign_name: isGroup ? "Group Chat" : "Direct WhatsApp",
              status: "Connected",
              category: undefined,
              last_message: lastMsg,
              datetime: "Today",
              unread: c.unreadCount || 0,
              avatar_image: c.profilePicUrl || undefined,
              avatar_color: AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length],
              remoteJid: jid,
              is_group: isGroup,
              is_client: i % 2 === 0,
              is_genx: i % 3 === 0,
              is_favorite: i === 0,
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
        }
      }
    } catch {
      // Quiet fail
    } finally {
      setIsRefreshingChats(false);
    }
  };

  // 8. Robust Load Messages & Sender Side Resolution (Our side vs Customer side)
  const loadMessagesForChat = useCallback(async (remoteJid: string, callId: number) => {
    if (!remoteJid || connectionState !== "connected") return;
    try {
      const res = await fetch(`${BASE_URL}/api/whatsapp/messages?instance_name=${instanceName}&remote_jid=${encodeURIComponent(remoteJid)}`);
      if (!res.ok) return;
      const json = await res.json();
      const data = json?.data || json;
      const records = data?.messages?.records || data?.records || [];

      if (Array.isArray(records) && records.length > 0) {
        const parsedMsgs: MessageItem[] = records.map((r: any, idx: number) => {
          // Precise sender side detection: fromMe = true -> Our side (agent), fromMe = false -> User side (customer)
          const isMe = Boolean(r.key?.fromMe ?? r.fromMe);
          
          let msgObj = r.message || {};
          if (msgObj.ephemeralMessage?.message) msgObj = msgObj.ephemeralMessage.message;
          if (msgObj.viewOnceMessage?.message) msgObj = msgObj.viewOnceMessage.message;
          if (msgObj.viewOnceMessageV2?.message) msgObj = msgObj.viewOnceMessageV2.message;
          if (msgObj.documentWithCaptionMessage?.message) msgObj = msgObj.documentWithCaptionMessage.message;

          const imgMsg = msgObj.imageMessage;
          const docMsg = msgObj.documentMessage;
          const vidMsg = msgObj.videoMessage;
          const audioMsg = msgObj.audioMessage;

          let mediaType: "image" | "document" | "video" | "audio" | "text" = "text";
          let mediaUrl: string | undefined = undefined;
          let mediaTitle: string | undefined = undefined;
          let fileSize: string | undefined = undefined;
          let mimetype: string | undefined = undefined;
          let text = msgObj.conversation || 
                     msgObj.extendedTextMessage?.text || 
                     msgObj.buttonsResponseMessage?.selectedDisplayText ||
                     msgObj.listResponseMessage?.title || 
                     "";

          if (imgMsg) {
            mediaType = "image";
            mediaUrl = imgMsg.url || imgMsg.base64;
            if (!mediaUrl && imgMsg.jpegThumbnail) {
              mediaUrl = imgMsg.jpegThumbnail.startsWith("data:")
                ? imgMsg.jpegThumbnail
                : `data:image/jpeg;base64,${imgMsg.jpegThumbnail}`;
            }
            mimetype = imgMsg.mimetype || "image/jpeg";
            fileSize = formatBytes(imgMsg.fileLength);
            text = imgMsg.caption || text || "";
          } else if (docMsg) {
            mediaType = "document";
            mediaUrl = docMsg.url || docMsg.directPath || "";
            mediaTitle = docMsg.fileName || docMsg.title || "Document.pdf";
            mimetype = docMsg.mimetype || "application/pdf";
            fileSize = formatBytes(docMsg.fileLength);
            text = docMsg.caption || text || "";
          } else if (vidMsg) {
            mediaType = "video";
            mediaUrl = vidMsg.url;
            text = vidMsg.caption || text || "";
          } else if (audioMsg) {
            mediaType = "audio";
            mediaUrl = audioMsg.url;
          }

          const rawTs = r.messageTimestamp || r.timestamp;
          const ts = rawTs
            ? new Date(Number(rawTs) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : "Today";

          return {
            id: r.key?.id || `msg-${idx}`,
            sender: isMe ? "agent" : "customer",
            text: text,
            time: ts,
            is_ai: isMe,
            status: isMe ? "read" : undefined,
            media_type: mediaType,
            media_url: mediaUrl,
            media_title: mediaTitle,
            file_size: fileSize,
            mimetype: mimetype,
          };
        });

        setConversations((prev) =>
          prev.map((c) => (c.call_id === callId ? { ...c, messages: parsedMsgs } : c))
        );
      }
    } catch {
      // Quiet fail
    }
  }, [connectionState]);

  // Select Chat & Trigger immediate load
  const handleSelectChat = async (chat: ConversationItem) => {
    setSelectedCallId(chat.call_id);
    setShowAttachmentMenu(false);

    if (chat.remoteJid && connectionState === "connected") {
      loadMessagesForChat(chat.remoteJid, chat.call_id);
    }
  };

  // 9. Fetch Materials for Material Base Quick Picker
  const fetchMaterialsForPicker = async () => {
    setIsLoadingMaterials(true);
    setShowMaterialPicker(true);
    setShowAttachmentMenu(false);
    try {
      const res = await fetch(`${BASE_URL}/api/whatsapp/materials`);
      if (res.ok) {
        const json = await res.json();
        setAvailableMaterials(json.data || json || []);
      }
    } catch {
      // Quiet fail
    } finally {
      setIsLoadingMaterials(false);
    }
  };

  // 10. Send Material from Material Base Directly to Active Chat
  const handleSendMaterialToChat = async (material: any) => {
    if (!activeChat) return;
    const targetNumber = activeChat.phone || activeChat.remoteJid;
    if (!targetNumber) return;
    const cleanNumber = targetNumber.replace(/\D/g, "") || activeChat.remoteJid;

    const isImage = material.type === "image";
    const isDoc = material.type === "document";
    const mediaType: "image" | "document" | "text" = isImage ? "image" : (isDoc ? "document" : "text");

    const newMsg: MessageItem = {
      sender: "agent",
      text: material.content || material.title || "",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      is_ai: true,
      status: "sent",
      media_type: mediaType,
      media_url: material.file_url || material.file_path,
      media_title: material.title,
      file_size: material.file_size ? formatBytes(material.file_size) : undefined,
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.call_id === activeChat.call_id
          ? { ...c, messages: [...c.messages, newMsg], last_message: material.title }
          : c
      )
    );

    setShowMaterialPicker(false);

    try {
      if (material.type === "text") {
        await fetch(`${BASE_URL}/api/whatsapp/send-text`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instance_name: instanceName,
            number: cleanNumber,
            text: material.content || material.title,
          }),
        });
      } else {
        await fetch(`${BASE_URL}/api/whatsapp/send-media`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instance_name: instanceName,
            number: cleanNumber,
            media_url: material.file_url || material.file_path,
            media_type: material.type,
            caption: material.content || material.title,
            file_name: material.title,
            mimetype: material.mime_type || (isImage ? "image/jpeg" : "application/pdf"),
          }),
        });
      }
      showToast(`Sent "${material.title}" successfully!`, "success");
    } catch (err: any) {
      showToast(`Failed to send: ${err.message || "Network error"}`, "error");
    }
  };

  // 11. Handle Local File / Image Upload & Send Directly
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isImage: boolean) => {
    const file = e.target.files?.[0];
    if (!file || !activeChat) return;
    const targetNumber = activeChat.phone || activeChat.remoteJid;
    if (!targetNumber) return;
    const cleanNumber = targetNumber.replace(/\D/g, "") || activeChat.remoteJid;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      const mediaType: "image" | "document" = isImage ? "image" : "document";

      const newMsg: MessageItem = {
        sender: "agent",
        text: file.name,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        is_ai: true,
        status: "sent",
        media_type: mediaType,
        media_url: base64Data,
        media_title: file.name,
        file_size: formatBytes(file.size),
        mimetype: file.type,
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.call_id === activeChat.call_id
            ? { ...c, messages: [...c.messages, newMsg], last_message: file.name }
            : c
        )
      );

      setShowAttachmentMenu(false);

      try {
        await fetch(`${BASE_URL}/api/whatsapp/send-media`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instance_name: instanceName,
            number: cleanNumber,
            media_url: base64Data,
            media_type: mediaType,
            caption: file.name,
            file_name: file.name,
            mimetype: file.type || (isImage ? "image/jpeg" : "application/pdf"),
          }),
        });
        showToast(`Sent ${file.name} successfully!`, "success");
      } catch (err: any) {
        showToast(`Failed to send: ${err.message || "Network error"}`, "error");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // 12. Send Plain Text Message in Live Chat
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

    const targetNumber = activeChat.phone || activeChat.remoteJid;
    if (targetNumber) {
      try {
        const cleanNumber = targetNumber.replace(/\D/g, "") || activeChat.remoteJid;
        const res = await fetch(`${BASE_URL}/api/whatsapp/send-text`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instance_name: instanceName,
            number: cleanNumber,
            text: textToSend,
          }),
        });
        if (res.ok) {
          showToast("Message sent successfully", "success");
        } else {
          showToast("Failed to send message", "error");
        }
      } catch (err: any) {
        showToast(err.message || "Network error", "error");
      }
    }
  };

  // Meta AI assistant query
  const handleAskMetaAi = async () => {
    if (!metaAiPrompt.trim()) return;
    setIsMetaAiLoading(true);
    setMetaAiResponse("");
    try {
      await new Promise((r) => setTimeout(r, 800));
      setMetaAiResponse(
        `Here is an optimized WhatsApp message for your audience:\n\n"Hi! Hope you're doing well. We have prepared exclusive updates for you regarding our latest services. Let us know if you'd like us to share the PDF brochure!"`
      );
    } finally {
      setIsMetaAiLoading(false);
    }
  };

  // Initial check
  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }
    checkConnectionStatus();
  }, [isLoggedIn, router, checkConnectionStatus]);

  // Active chat
  const activeChat = conversations.find((c) => c.call_id === selectedCallId) || null;

  // Active chat real-time live sync polling (every 3.5s)
  useEffect(() => {
    if (!selectedCallId || connectionState !== "connected") return;
    const currentChat = conversations.find((c) => c.call_id === selectedCallId);
    if (!currentChat?.remoteJid) return;

    const chatPollTimer = setInterval(() => {
      loadMessagesForChat(currentChat.remoteJid!, currentChat.call_id);
    }, 3500);

    return () => clearInterval(chatPollTimer);
  }, [selectedCallId, connectionState, loadMessagesForChat, conversations]);

  // Auto-scroll to bottom of conversation feed on new message or chat switch
  useEffect(() => {
    if (selectedCallId && activeChat?.messages?.length) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedCallId, activeChat?.messages?.length]);

  // Filter conversations
  const filteredChats = conversations.filter((c) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.last_message.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (!isLoggedIn) return null;

  return (
    <DashboardShell title="WhatsApp">
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
            <MessageSquare className="h-3.5 w-3.5 text-[#25D366]" />
            WhatsApp Web
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

        {connectionState === "connected" && (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse"></span>
              Connected: {connectedPhone || "Active"}
            </span>
            <button
              onClick={() => setShowLogoutConfirmModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-100 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Disconnect
            </button>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          VIEW 1: DISCONNECTED / SCAN LOGIN VIEW
      ══════════════════════════════════════════════════════════════════════════ */}
      {connectionState !== "connected" ? (
        <div className="min-h-[calc(100vh-10.5rem)] flex flex-col items-center justify-center p-2 sm:p-6 bg-[#F0EBE3]/60 dark:bg-[#111B21] rounded-3xl border border-zinc-200/80 dark:border-zinc-800 font-sans">
          
          <div className="w-full max-w-3xl space-y-6">
            
            {/* Main Scan to Log In Box */}
            <div className="rounded-3xl border border-zinc-200/90 dark:border-zinc-700 bg-white dark:bg-[#202C33] p-8 sm:p-12 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center">
                
                {/* Left Column: Instructions */}
                <div className="md:col-span-6 space-y-6">
                  <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
                    Scan to log in
                  </h2>

                  {/* 3 Step Instruction List with Vertical Connector */}
                  <div className="relative space-y-7 pl-2">
                    {/* Vertical Connecting Line */}
                    <div className="absolute left-[18px] top-4 bottom-4 w-0.5 bg-zinc-200 dark:bg-zinc-700"></div>

                    {/* Step 1 */}
                    <div className="relative flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-[#202C33] text-xs font-bold text-zinc-700 dark:text-zinc-300 z-10">
                        1
                      </span>
                      <p className="text-sm text-zinc-700 dark:text-zinc-200 pt-0.5 font-normal">
                        Scan the QR code with your phone's camera
                      </p>
                    </div>

                    {/* Step 2 */}
                    <div className="relative flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-[#202C33] text-xs font-bold text-zinc-700 dark:text-zinc-300 z-10">
                        2
                      </span>
                      <p className="text-sm text-zinc-700 dark:text-zinc-200 pt-0.5 font-normal flex items-center gap-1.5 flex-wrap">
                        Tap the link to open <span className="font-semibold text-zinc-900 dark:text-white">WhatsApp</span>
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#25D366] text-white">
                          <MessageSquare className="w-3 h-3 fill-white" />
                        </span>
                      </p>
                    </div>

                    {/* Step 3 */}
                    <div className="relative flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-[#202C33] text-xs font-bold text-zinc-700 dark:text-zinc-300 z-10">
                        3
                      </span>
                      <p className="text-sm text-zinc-700 dark:text-zinc-200 pt-0.5 font-normal">
                        Scan the QR code again to link to your account
                      </p>
                    </div>
                  </div>

                  {/* Need Help Link */}
                  <div className="pt-2">
                    <button
                      onClick={() => setShowHelpModal(true)}
                      className="text-xs font-bold text-[#00A884] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      Need help? <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Stay Logged In Checkbox */}
                  <div className="pt-2 flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      id="stay-logged-in"
                      checked={stayLoggedIn}
                      onChange={(e) => setStayLoggedIn(e.target.checked)}
                      className="h-4 w-4 rounded border-zinc-300 text-[#00A884] focus:ring-[#00A884] accent-[#00A884] cursor-pointer"
                    />
                    <label
                      htmlFor="stay-logged-in"
                      className="text-xs font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer flex items-center gap-1"
                    >
                      Stay logged in on this browser
                      <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
                    </label>
                  </div>
                </div>

                {/* Right Column: Original QR Code from Evolution API OR Phone Pairing Code */}
                <div className="md:col-span-6 flex flex-col items-center justify-center">
                  
                  {loginMode === "qr" ? (
                    <div className="flex flex-col items-center space-y-4">
                      
                      {/* Original WhatsApp QR Code Frame */}
                      <div className="relative p-4 bg-white rounded-2xl border border-zinc-200 shadow-md flex items-center justify-center min-w-[260px] min-h-[260px]">
                        
                        {isQrLoading && !qrCodeBase64 ? (
                          <div className="flex flex-col items-center justify-center gap-3 py-12">
                            <Loader2 className="w-10 h-10 text-[#00A884] animate-spin" />
                            <p className="text-xs font-semibold text-zinc-500">Connecting to WhatsApp...</p>
                          </div>
                        ) : qrCodeBase64 ? (
                          <div className="relative">
                            <img
                              src={qrCodeBase64.startsWith("data:") ? qrCodeBase64 : `data:image/png;base64,${qrCodeBase64}`}
                              alt="WhatsApp QR Code"
                              className="w-[240px] h-[240px] object-contain rounded-lg"
                            />
                          </div>
                        ) : !isQrLoading ? (
                          <div className="flex flex-col items-center justify-center gap-3 py-10 px-4 text-center">
                            <QrCode className="w-10 h-10 text-[#00A884]" />
                            <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Ready to connect</p>
                            <button
                              onClick={fetchQRCode}
                              className="px-3.5 py-1.5 bg-[#00A884] hover:bg-[#008F6F] text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              Generate QR Code
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-3 py-12">
                            <Loader2 className="w-10 h-10 text-[#00A884] animate-spin" />
                            <p className="text-xs font-semibold text-zinc-500">Connecting to WhatsApp...</p>
                          </div>
                        )}

                        {/* Expired QR Code Overlay */}
                        {isQrExpired && (
                          <div
                            onClick={fetchQRCode}
                            className="absolute inset-0 rounded-2xl bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center cursor-pointer transition hover:bg-white/95"
                          >
                            <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#00A884] flex items-center justify-center mb-2 shadow-sm">
                              <RefreshCw className="w-6 h-6 animate-spin" />
                            </div>
                            <p className="text-xs font-bold text-zinc-900">QR code expired</p>
                            <p className="text-[11px] text-[#00A884] font-semibold mt-1">
                              Click to reload QR code
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Refresh countdown indicator */}
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <button
                          onClick={fetchQRCode}
                          disabled={isQrLoading}
                          className="flex items-center gap-1.5 text-[#00A884] hover:underline font-semibold cursor-pointer"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isQrLoading ? "animate-spin" : ""}`} />
                          Refresh QR ({qrSecondsLeft}s)
                        </button>
                      </div>

                      {/* Switch to Phone Number Login */}
                      <button
                        onClick={() => setLoginMode("phone")}
                        className="text-xs font-bold text-[#00A884] hover:underline inline-flex items-center gap-1 mt-2 cursor-pointer"
                      >
                        Log in with phone number <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    /* Phone Number Pairing Code View */
                    <div className="w-full max-w-sm space-y-5 bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                          Enter Phone Number
                        </h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          Get an 8-character pairing code on your mobile WhatsApp
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="relative">
                          <input
                            type="tel"
                            placeholder="e.g. 919885733334"
                            value={pairingPhone}
                            onChange={(e) => setPairingPhone(e.target.value)}
                            className="w-full pl-3.5 pr-4 py-2.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A884] font-mono text-zinc-900 dark:text-white font-semibold"
                          />
                        </div>

                        <button
                          onClick={handleGeneratePairingCode}
                          disabled={isPairingLoading}
                          className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#00A884] hover:bg-[#008F6F] text-white transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                        >
                          {isPairingLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Generating Code...
                            </>
                          ) : (
                            <>Get Pairing Code</>
                          )}
                        </button>
                      </div>

                      {/* Display 8-Character Split Blocks if generated */}
                      {pairingCode && (
                        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700 space-y-3">
                          <p className="text-xs text-center text-zinc-500 dark:text-zinc-400">
                            Enter this code on your phone:
                          </p>
                          <div className="flex items-center justify-center gap-1.5 font-mono text-base font-extrabold text-zinc-900 dark:text-white">
                            {pairingCode.split("").map((char, i) => (
                              <span
                                key={i}
                                className={`w-8 h-10 flex items-center justify-center rounded-lg border ${
                                  char === "-"
                                    ? "border-transparent text-zinc-400 w-3"
                                    : "border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 shadow-sm"
                                }`}
                              >
                                {char}
                              </span>
                            ))}
                          </div>
                          <button
                            onClick={handleCopyCode}
                            className="w-full py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            {codeCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" /> Copy Code
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      <div className="text-center pt-2">
                        <button
                          onClick={() => setLoginMode("qr")}
                          className="text-xs font-bold text-[#00A884] hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          Scan with QR code instead <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                </div>

              </div>
            </div>

          </div>

        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════════════════════
            VIEW 2: CONNECTED WHATSAPP WEB UI
        ══════════════════════════════════════════════════════════════════════════ */
        <div className="h-[calc(100vh-10rem)] flex rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-[#F0F2F5] dark:bg-[#111B21] overflow-hidden shadow-xl font-sans">
          
          {/* ── LEFT VERTICAL RAIL: CLEAN & SIMPLE (Chats, Material Base, Logout) ── */}
          <div className="w-14 bg-[#F0F2F5] dark:bg-[#202C33] border-r border-zinc-200 dark:border-zinc-700/80 flex flex-col items-center justify-between py-4 shrink-0 select-none">
            {/* Top: WhatsApp Logo + Chats + Material Base */}
            <div className="flex flex-col items-center gap-4">
              {/* WhatsApp Logo */}
              <div className="w-9 h-9 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-sm">
                <MessageSquare className="w-5 h-5 fill-white" />
              </div>

              <div className="w-6 h-px bg-zinc-300 dark:bg-zinc-700 my-1"></div>

              {/* Chats Tab */}
              <button
                onClick={() => { setActiveNavTab("chats"); }}
                className="p-2.5 rounded-xl bg-zinc-200/80 dark:bg-zinc-700 text-[#00A884] dark:text-[#25D366] transition cursor-pointer shadow-2xs"
                title="Chats & Contacts"
              >
                <MessageSquare className="w-5 h-5" />
              </button>

              {/* Material Base Tab */}
              <button
                onClick={() => router.push("/whatsapp/materials")}
                className="p-2.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/50 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer"
                title="Material Base"
              >
                <Layers className="w-5 h-5" />
              </button>

              {/* Send Message */}
              <button
                onClick={() => router.push("/whatsapp/send")}
                className="p-2.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/50 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer"
                title="Send Broadcast Message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>

            {/* Bottom: Logout / Disconnect Button */}
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={() => setShowLogoutConfirmModal(true)}
                className="p-2.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                title="Sign out / Disconnect WhatsApp"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ── COLUMN 1: CHATS LIST PANEL (360px - 400px) ── */}
          <div className="w-[360px] lg:w-[400px] bg-white dark:bg-[#111B21] border-r border-zinc-200 dark:border-zinc-700/80 flex flex-col h-full shrink-0">
            
            {/* Top Header Bar */}
            <div className="p-3.5 px-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#00A884] dark:text-[#25D366] tracking-tight">
                  Chats
                </h2>
                {conversations.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#008069] dark:text-[#25D366] text-[10px] font-extrabold">
                    {conversations.length}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {/* Send Message */}
                <button
                  onClick={() => router.push("/whatsapp/send")}
                  className="w-8 h-8 rounded-full bg-[#00A884] hover:bg-[#008F6F] text-white flex items-center justify-center shadow-xs transition cursor-pointer"
                  title="Send New Message"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>

                {/* Refresh Chats */}
                <button
                  onClick={fetchRealEvolutionChats}
                  disabled={isRefreshingChats}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                  title="Sync Contacts & Chats"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshingChats ? "animate-spin text-[#00A884]" : ""}`} />
                </button>

                {/* Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowMenuDropdown(!showMenuDropdown)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {showMenuDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#233138] rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 py-1.5 z-30 text-xs font-medium text-zinc-700 dark:text-zinc-200">
                      <button
                        onClick={() => { setShowMenuDropdown(false); fetchRealEvolutionChats(); }}
                        className="w-full px-4 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-700/50 flex items-center gap-2 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-[#00A884]" /> Sync All Contacts
                      </button>
                      <button
                        onClick={() => { setShowMenuDropdown(false); router.push("/whatsapp/materials"); }}
                        className="w-full px-4 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-700/50 flex items-center gap-2 cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5 text-amber-500" /> Material Base
                      </button>
                      <button
                        onClick={() => { setShowMenuDropdown(false); router.push("/whatsapp/history"); }}
                        className="w-full px-4 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-700/50 flex items-center gap-2 cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5 text-violet-500" /> History
                      </button>
                      <div className="my-1 border-t border-zinc-200 dark:border-zinc-700"></div>
                      <button
                        onClick={() => { setShowMenuDropdown(false); setShowLogoutConfirmModal(true); }}
                        className="w-full px-4 py-2 text-left text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 font-semibold cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="px-3.5 py-2.5 shrink-0 border-b border-zinc-100 dark:border-zinc-800/80">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search chats or contacts"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 text-xs bg-[#F0F2F5] dark:bg-[#202C33] border-none rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00A884] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 font-normal"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Live Synced Chats & Contacts List */}
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {filteredChats.length === 0 ? (
                <div className="p-8 text-center space-y-3 text-zinc-400 text-xs">
                  <MessageSquare className="w-8 h-8 mx-auto text-zinc-300 dark:text-zinc-700" />
                  <p className="font-semibold text-zinc-700 dark:text-zinc-300">No Contacts Found</p>
                  <button
                    onClick={fetchRealEvolutionChats}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00A884] text-white font-bold text-xs shadow-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Sync Contacts
                  </button>
                </div>
              ) : (
                filteredChats.map((chat) => {
                  const isSelected = chat.call_id === selectedCallId;

                  return (
                    <div
                      key={chat.call_id}
                      onClick={() => handleSelectChat(chat)}
                      className={`p-3 px-4 cursor-pointer transition flex items-center gap-3.5 relative ${
                        isSelected
                          ? "bg-[#F0F2F5] dark:bg-[#2A3942]"
                          : "hover:bg-zinc-50 dark:hover:bg-[#202C33] bg-white dark:bg-[#111B21]"
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {chat.avatar_image ? (
                          <img
                            src={chat.avatar_image}
                            alt={chat.name}
                            className="w-11 h-11 rounded-full object-cover shadow-xs"
                          />
                        ) : (
                          <div
                            className={`w-11 h-11 rounded-full bg-gradient-to-br ${chat.avatar_color || "from-emerald-500 to-teal-600"} text-white flex items-center justify-center font-bold text-xs shadow-xs`}
                          >
                            {getInitials(chat.name)}
                          </div>
                        )}
                        {chat.unread && chat.unread > 0 ? (
                          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#25D366] border-2 border-white dark:border-zinc-900"></span>
                        ) : null}
                      </div>

                      {/* Chat Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {chat.name}
                          </h4>
                          <span className="text-[11px] text-zinc-400 shrink-0">
                            {chat.datetime}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-1">
                            <CheckCheck className="w-3.5 h-3.5 text-[#53BDEB] shrink-0 inline" />
                            <span>{chat.last_message}</span>
                          </p>
                          {chat.unread && chat.unread > 0 ? (
                            <span className="w-5 h-5 rounded-full bg-[#25D366] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                              {chat.unread}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* ── RIGHT MAIN PANEL: ACTIVE CHAT OR WELCOME ── */}
          <div className="flex-1 bg-[#F0F2F5] dark:bg-[#111B21] flex flex-col h-full overflow-hidden">
            
            {!activeChat ? (
              /* Center Welcome Card */
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-full max-w-md bg-white dark:bg-[#202C33] p-8 sm:p-10 rounded-3xl border border-zinc-200 dark:border-zinc-700 shadow-sm flex flex-col items-center text-center space-y-5">
                  <div className="relative flex h-20 w-24 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                    <Laptop className="h-14 w-14 text-zinc-700 dark:text-zinc-300" />
                    <div className="absolute top-4 left-6 w-8 h-6 bg-[#00A884] rounded-sm flex items-center justify-center shadow-xs">
                      <Phone className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                      WhatsApp Connected
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                      Select a contact or chat on the left to start a conversation, or broadcast a campaign.
                    </p>
                  </div>

                  <button
                    onClick={() => router.push("/whatsapp/send")}
                    className="inline-flex items-center justify-center rounded-full bg-[#00A884] hover:bg-[#008F6F] px-8 py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-95 cursor-pointer"
                  >
                    Send New Message
                  </button>
                </div>

                {/* Quick actions */}
                <div className="flex items-center justify-center gap-12 mt-10 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  <button
                    onClick={() => router.push("/whatsapp/materials")}
                    className="flex flex-col items-center gap-2 hover:text-[#00A884] transition group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-[#202C33] border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-xs group-hover:border-[#00A884]">
                      <FileText className="w-5 h-5 text-zinc-600 dark:text-zinc-300 group-hover:text-[#00A884]" />
                    </div>
                    <span>Send document</span>
                  </button>

                  <button
                    onClick={() => router.push("/whatsapp/send")}
                    className="flex flex-col items-center gap-2 hover:text-[#00A884] transition group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-[#202C33] border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-xs group-hover:border-[#00A884]">
                      <UserPlus className="w-5 h-5 text-zinc-600 dark:text-zinc-300 group-hover:text-[#00A884]" />
                    </div>
                    <span>Add contact</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Active Chat Window */
              <div className="flex-1 flex flex-col h-full bg-[#EFEAE2] dark:bg-[#0B141A]">
                
                {/* Chat Top Header */}
                <div className="h-16 px-4 bg-[#F0F2F5] dark:bg-[#202C33] border-b border-zinc-200 dark:border-zinc-700/80 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {activeChat.avatar_image ? (
                        <img
                          src={activeChat.avatar_image}
                          alt={activeChat.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className={`w-10 h-10 rounded-full bg-gradient-to-br ${activeChat.avatar_color || "from-emerald-500 to-teal-600"} text-white flex items-center justify-center font-bold text-xs`}
                        >
                          {getInitials(activeChat.name)}
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {activeChat.name}
                      </h3>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {activeChat.phone || "WhatsApp Contact"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                    <button
                      onClick={() => router.push("/whatsapp/materials")}
                      className="p-2 hover:bg-zinc-200/80 dark:hover:bg-zinc-700 rounded-full transition cursor-pointer"
                      title="Send Material / PDF"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedCallId(null)}
                      className="p-2 hover:bg-zinc-200/80 dark:hover:bg-zinc-700 rounded-full transition cursor-pointer"
                      title="Close Chat"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Messages Conversation Feed */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#EFEAE2] dark:bg-[#0B141A]">
                  {activeChat.messages && activeChat.messages.length > 0 ? (
                    activeChat.messages.map((msg, idx) => {
                      const isMe = msg.sender === "agent";
                      const isImage = msg.media_type === "image" && msg.media_url;
                      const isDoc = msg.media_type === "document" || (msg.media_url && !isImage && (msg.media_title || "").match(/\.(pdf|doc|docx|xls|xlsx|csv|ppt|pptx|txt|zip)$/i));
                      const isPdf = (msg.media_title || "").toLowerCase().endsWith(".pdf") || msg.mimetype?.includes("pdf");
                      const isWord = (msg.media_title || "").toLowerCase().match(/\.(doc|docx)$/i);
                      const isExcel = (msg.media_title || "").toLowerCase().match(/\.(xls|xlsx|csv)$/i);

                      return (
                        <div
                          key={idx}
                          className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] sm:max-w-[70%] md:max-w-[60%] rounded-2xl p-2.5 sm:p-3 shadow-xs text-xs relative transition-all ${
                              isMe
                                ? "bg-[#D9FDD3] dark:bg-[#005C4B] text-zinc-900 dark:text-zinc-100 rounded-tr-none"
                                : "bg-white dark:bg-[#202C33] text-zinc-900 dark:text-zinc-100 rounded-tl-none"
                            }`}
                          >
                            {/* ── 1. IMAGE MESSAGE CARD ── */}
                            {isImage && (
                              <div className="mb-2 overflow-hidden rounded-xl bg-black/10 dark:bg-black/30">
                                <div
                                  onClick={() => setLightboxImage({ url: msg.media_url!, title: msg.media_title || msg.text || "WhatsApp Image" })}
                                  className="relative group cursor-pointer overflow-hidden rounded-xl max-h-80 flex items-center justify-center bg-zinc-900/10 dark:bg-zinc-950/40"
                                >
                                  <img
                                    src={msg.media_url}
                                    alt={msg.media_title || "WhatsApp Media"}
                                    className="w-full object-cover max-h-80 rounded-xl transition duration-200 group-hover:scale-[1.02] group-hover:brightness-95"
                                    loading="lazy"
                                  />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                                    <span className="px-3 py-1.5 rounded-full bg-black/70 text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-lg">
                                      <Eye className="w-3.5 h-3.5" /> View Photo
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* ── 2. DOCUMENT / PDF MESSAGE CARD (WHATSAPP WEB STYLE) ── */}
                            {isDoc && (
                              <div className="mb-2">
                                <a
                                  href={msg.media_url || "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download={msg.media_title || "Document.pdf"}
                                  className="flex items-center gap-3 p-2.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 transition border border-black/5 dark:border-white/5 cursor-pointer no-underline group shadow-2xs"
                                >
                                  {/* Document Type Badge */}
                                  <div
                                    className={`w-11 h-12 rounded-lg flex flex-col items-center justify-center shrink-0 shadow-xs ${
                                      isPdf
                                        ? "bg-rose-600 text-white"
                                        : isWord
                                        ? "bg-blue-600 text-white"
                                        : isExcel
                                        ? "bg-emerald-600 text-white"
                                        : "bg-amber-600 text-white"
                                    }`}
                                  >
                                    <FileText className="w-5 h-5" />
                                    <span className="text-[8px] font-extrabold tracking-wider uppercase mt-0.5">
                                      {(msg.media_title || "PDF").split(".").pop()?.slice(0, 4) || "DOC"}
                                    </span>
                                  </div>

                                  {/* Document Metadata */}
                                  <div className="flex-1 min-w-0 pr-1">
                                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:underline">
                                      {msg.media_title || msg.text || "Document.pdf"}
                                    </p>
                                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                                      {msg.file_size ? `${msg.file_size} • ` : ""}{((msg.media_title || "PDF").split(".").pop() || "PDF").toUpperCase()}
                                    </p>
                                  </div>

                                  {/* Download Icon */}
                                  <div className="w-8 h-8 rounded-full bg-white/80 dark:bg-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-200 group-hover:bg-[#00A884] group-hover:text-white transition shrink-0 shadow-2xs">
                                    <Download className="w-4 h-4" />
                                  </div>
                                </a>
                              </div>
                            )}

                            {/* ── 3. TEXT / CAPTION CONTENT ── */}
                            {msg.text && (!isDoc || msg.text !== msg.media_title) && (
                              <p className="whitespace-pre-wrap leading-relaxed text-xs">
                                {msg.text}
                              </p>
                            )}

                            {/* Time & Read Status */}
                            <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-zinc-500 dark:text-zinc-400 select-none">
                              <span>{msg.time}</span>
                              {isMe && <CheckCheck className="w-3.5 h-3.5 text-[#53BDEB]" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-zinc-400 text-xs">
                      <p>Start a conversation with {activeChat.name}</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Hidden File Inputs for Local Media Selection */}
                <input
                  type="file"
                  ref={imageInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, true)}
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, false)}
                />

                {/* Chat Message Input Bar & Attachment Popover */}
                <div className="p-3 bg-[#F0F2F5] dark:bg-[#202C33] border-t border-zinc-200 dark:border-zinc-700/80 relative flex items-center gap-2">
                  
                  {/* Attachment Popover Menu */}
                  {showAttachmentMenu && (
                    <div className="absolute bottom-16 left-4 bg-white dark:bg-[#233138] rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 p-2 z-40 flex flex-col gap-1 min-w-[190px] animate-in fade-in slide-in-from-bottom-2 duration-150">
                      <button
                        onClick={() => { setShowAttachmentMenu(false); fileInputRef.current?.click(); }}
                        className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700/60 text-left text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-2xs">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold">Document / PDF</p>
                          <p className="text-[10px] text-zinc-400 font-normal">Send PDF, Word, Excel</p>
                        </div>
                      </button>

                      <button
                        onClick={() => { setShowAttachmentMenu(false); imageInputRef.current?.click(); }}
                        className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700/60 text-left text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-2xs">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold">Photos & Images</p>
                          <p className="text-[10px] text-zinc-400 font-normal">Send JPG, PNG, WebP</p>
                        </div>
                      </button>

                      <div className="my-1 border-t border-zinc-200 dark:border-zinc-700"></div>

                      <button
                        onClick={fetchMaterialsForPicker}
                        className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700/60 text-left text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-2xs">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold">Material Base</p>
                          <p className="text-[10px] text-zinc-400 font-normal">Pick saved templates & PDFs</p>
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Paperclip Button */}
                  <button
                    onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                    className={`p-2.5 rounded-full transition cursor-pointer ${
                      showAttachmentMenu
                        ? "bg-[#00A884] text-white"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    }`}
                    title="Attach Document, Photo, or Material"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    placeholder="Type a message"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1 py-2 px-4 bg-white dark:bg-[#2A3942] rounded-xl text-xs border-none focus:outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400"
                  />

                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isSending}
                    className="p-2.5 rounded-full bg-[#00A884] hover:bg-[#008F6F] text-white disabled:opacity-40 transition shadow-xs cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}

          </div>

        </div>
      )}

      {/* ── LOGOUT CONFIRMATION MODAL ── */}
      {showLogoutConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#202C33] rounded-2xl max-w-sm w-full p-6 space-y-4 border border-zinc-200 dark:border-zinc-700 shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Log out of WhatsApp?
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Are you sure you want to log out? You will need to scan the QR code again to reconnect.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowLogoutConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-600 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDisconnect}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── META AI ASSISTANT MODAL ── */}
      {showMetaAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#202C33] rounded-3xl max-w-lg w-full p-6 space-y-4 border border-zinc-200 dark:border-zinc-700 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Meta AI Assistant
                </h3>
              </div>
              <button
                onClick={() => setShowMetaAiModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Generate persuasive WhatsApp promotional messages, follow-up replies, and templates instantly.
            </p>

            <div className="space-y-3">
              <textarea
                placeholder="e.g. Write a friendly follow-up message to a client interested in real estate..."
                value={metaAiPrompt}
                onChange={(e) => setMetaAiPrompt(e.target.value)}
                rows={3}
                className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />

              <button
                onClick={handleAskMetaAi}
                disabled={isMetaAiLoading || !metaAiPrompt.trim()}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isMetaAiLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Generate Message
                  </>
                )}
              </button>

              {metaAiResponse && (
                <div className="p-3.5 bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-xl text-xs space-y-2">
                  <p className="font-semibold text-purple-900 dark:text-purple-200">Generated Template:</p>
                  <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{metaAiResponse}</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(metaAiResponse);
                      showToast("Copied to clipboard!");
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 hover:underline cursor-pointer"
                  >
                    <Copy className="w-3 h-3" /> Copy Template
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── HELP / SCAN INSTRUCTIONS MODAL ── */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#202C33] rounded-3xl max-w-md w-full p-6 space-y-4 border border-zinc-200 dark:border-zinc-700 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-700">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                How to link a device
              </h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-zinc-700 dark:text-zinc-300">
              <div className="space-y-1">
                <p className="font-bold text-zinc-900 dark:text-white">On Android:</p>
                <p>1. Open WhatsApp &gt; Tap the three dots (⋮) in the top right corner.</p>
                <p>2. Tap <strong>Linked devices</strong> &gt; Tap <strong>Link a device</strong>.</p>
                <p>3. Point your camera at the QR code on this screen.</p>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-zinc-900 dark:text-white">On iPhone:</p>
                <p>1. Open WhatsApp &gt; Go to <strong>Settings</strong>.</p>
                <p>2. Tap <strong>Linked devices</strong> &gt; Tap <strong>Link a device</strong>.</p>
                <p>3. Point your camera at the QR code on this screen.</p>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#00A884] hover:bg-[#008F6F] text-white text-xs font-bold transition cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* ── IMAGE LIGHTBOX / FULLSCREEN MODAL ── */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center justify-center p-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Toolbar */}
            <div className="w-full flex items-center justify-between pb-3 text-white px-2">
              <span className="text-xs font-semibold truncate max-w-md">
                {lightboxImage.title || "WhatsApp Photo"}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={lightboxImage.url}
                  download="whatsapp-photo.jpg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition text-white"
                  title="Download Photo"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setLightboxImage(null)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition text-white cursor-pointer"
                  title="Close (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Main Fullscreen Image */}
            <div className="relative overflow-hidden rounded-2xl max-h-[80vh] flex items-center justify-center bg-black/40 border border-white/10 shadow-2xl">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title || "WhatsApp Photo"}
                className="max-h-[80vh] max-w-full object-contain rounded-2xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── MATERIAL BASE QUICK PICKER MODAL ── */}
      {showMaterialPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#202C33] rounded-3xl max-w-xl w-full max-h-[80vh] flex flex-col border border-zinc-200 dark:border-zinc-700 shadow-2xl animate-in zoom-in-95 overflow-hidden">
            
            {/* Header */}
            <div className="p-4 px-5 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                    Send from Material Base
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Select a document, image, or template to send to {activeChat?.name || "contact"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowMaterialPicker(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of Materials */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {isLoadingMaterials ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-zinc-400 text-xs">
                  <Loader2 className="w-6 h-6 animate-spin text-[#00A884]" />
                  <span>Loading Material Base...</span>
                </div>
              ) : availableMaterials.length === 0 ? (
                <div className="py-12 text-center space-y-2 text-zinc-400 text-xs">
                  <Layers className="w-8 h-8 mx-auto text-zinc-300 dark:text-zinc-600" />
                  <p className="font-semibold text-zinc-600 dark:text-zinc-300">No materials saved yet</p>
                  <p className="text-[11px]">Upload materials in the Material Base tab first.</p>
                </div>
              ) : (
                availableMaterials.map((mat) => {
                  const isPdf = mat.type === "document";
                  const isImg = mat.type === "image";

                  return (
                    <div
                      key={mat.id}
                      className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-900/50 hover:border-[#00A884] dark:hover:border-[#00A884] transition flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-xs ${
                            isPdf ? "bg-rose-600" : isImg ? "bg-blue-600" : "bg-emerald-600"
                          }`}
                        >
                          {isPdf ? <FileText className="w-5 h-5" /> : isImg ? <ImageIcon className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {mat.title}
                          </p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                            {mat.type.toUpperCase()}{mat.file_size ? ` • ${formatBytes(mat.file_size)}` : ""}
                            {mat.tags ? ` • ${mat.tags}` : ""}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSendMaterialToChat(mat)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#00A884] hover:bg-[#008F6F] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                      >
                        <Send className="w-3 h-3" /> Send
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-3 px-5 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#111B21] flex items-center justify-between text-xs text-zinc-500">
              <Link
                href="/whatsapp/materials"
                className="text-[#00A884] hover:underline font-semibold flex items-center gap-1"
              >
                Manage Material Base <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => setShowMaterialPicker(false)}
                className="px-3 py-1 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </DashboardShell>
  );
}
