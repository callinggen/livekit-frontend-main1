import React, { useRef, useState, useEffect } from "react";
import { Upload, ChevronDown, CheckCircle2, Phone, Link2, FileSpreadsheet, BookUser, RefreshCw, ExternalLink } from "lucide-react";
import Papa from "papaparse";
import { UploadSourceType, Contact } from "./types";
import { api } from "@/lib/api";

interface UploadSourceProps {
  sourceType: UploadSourceType;
  onChangeSource: (type: UploadSourceType) => void;
  onFileUpload: (file: File) => void;
  fileUploaded: boolean;
  fileName?: string;
  fileSize?: string;
  totalContacts?: number;
  googleSheetUrl?: string;
  onChangeGoogleSheetUrl?: (url: string) => void;
  singleContactName?: string;
  onChangeSingleName?: (name: string) => void;
  singleContactPhone?: string;
  onChangeSinglePhone?: (phone: string) => void;
  singleContactEmail?: string;
  onChangeSingleEmail?: (email: string) => void;
  saveToContactBook?: boolean;
  onChangeSaveToContactBook?: (save: boolean) => void;
  contactBookTag?: string;
  onChangeContactBookTag?: (tag: string) => void;
  selectedContactBookTag?: string;
  onChangeSelectedContactBookTag?: (tag: string) => void;
  onLoadFromContactBook?: (tag?: string) => void;
  errors?: Record<string, string>;
  onGoogleSheetLoaded?: (contacts: Contact[], sheetId: string) => void;
  disabled?: boolean;
}

const sourceOptions: { value: UploadSourceType; label: string; icon: React.ReactNode }[] = [
  { value: "excel", label: "Excel File", icon: <FileSpreadsheet className="h-4 w-4" /> },
  { value: "csv", label: "CSV File", icon: <FileSpreadsheet className="h-4 w-4" /> },
  { value: "google_sheet", label: "Google Sheet Link", icon: <Link2 className="h-4 w-4" /> },
  { value: "contacts_book", label: "Contact Book / Saved Lists", icon: <BookUser className="h-4 w-4" /> },
  { value: "single", label: "Single Contact", icon: <Phone className="h-4 w-4" /> },
];

export default function UploadSource({
  sourceType,
  onChangeSource,
  onFileUpload,
  fileUploaded,
  fileName,
  fileSize,
  totalContacts,
  googleSheetUrl,
  onChangeGoogleSheetUrl,
  singleContactName,
  onChangeSingleName,
  singleContactPhone,
  onChangeSinglePhone,
  singleContactEmail,
  onChangeSingleEmail,
  saveToContactBook,
  onChangeSaveToContactBook,
  contactBookTag,
  onChangeContactBookTag,
  selectedContactBookTag,
  onChangeSelectedContactBookTag,
  onLoadFromContactBook,
  errors,
  onGoogleSheetLoaded,
  disabled = false,
}: UploadSourceProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const [sheetSuccess, setSheetSuccess] = useState("");

  const handleLoadSheet = async () => {
    if (!googleSheetUrl) {
      alert("Please enter a URL first.");
      return;
    }
    const match = googleSheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      alert("Invalid Google Sheet URL format.");
      return;
    }
    const sheetId = match[1];
    setIsLoadingSheet(true);
    setSheetSuccess("");
    
    try {
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      const response = await fetch(csvUrl);
      if (!response.ok) throw new Error("Failed to fetch sheet. Please ensure it is shared with 'Anyone with the link can view'.");
      
      const csvText = await response.text();
      
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const data = results.data as any[];
          if (data.length === 0) {
            alert("The Google Sheet appears to be empty.");
            setIsLoadingSheet(false);
            return;
          }
          
          // Validate columns
          const headers = Object.keys(data[0]).map(h => h.toLowerCase().trim());
          const hasName = headers.some(h => h.includes("name"));
          const hasPhone = headers.some(h => h.includes("phone"));
          
          if (!hasName || !hasPhone) {
            alert("Validation Failed: The sheet must contain columns with 'Name' and 'Phone' in the header row.");
            setIsLoadingSheet(false);
            return;
          }
          
          // Map to contacts
          const newContacts: Contact[] = data.map((row, index) => {
            const rowKeys = Object.keys(row);
            const nameKey = rowKeys.find(k => k.toLowerCase().includes("name")) || rowKeys[0];
            const phoneKey = rowKeys.find(k => k.toLowerCase().includes("phone")) || rowKeys[1];
            
            const metadata_fields: Record<string, string> = {};
            rowKeys.forEach(key => {
              if (key !== nameKey && key !== phoneKey) {
                metadata_fields[key.trim()] = String(row[key]);
              }
            });

            return {
              id: Date.now() + index,
              name: row[nameKey] || "Unknown",
              phone: row[phoneKey] || "Unknown",
              status: "pending",
              response: "—",
              metadata_fields
            };
          });
          
          setSheetSuccess(`Successfully loaded ${newContacts.length} contacts!`);
          if (onGoogleSheetLoaded) {
            onGoogleSheetLoaded(newContacts, sheetId);
          }
          setIsLoadingSheet(false);
        },
        error: (err: any) => {
          alert("Failed to parse sheet: " + err.message);
          setIsLoadingSheet(false);
        }
      });
    } catch (error: any) {
      alert(error.message);
      setIsLoadingSheet(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  };

  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [listSummaries, setListSummaries] = useState<any[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);

  useEffect(() => {
    if (sourceType === "contacts_book") {
      setLoadingTags(true);
      Promise.all([
        api.getSavedContactTags().catch(() => []),
        api.getContactListsSummary().catch(() => []),
      ])
        .then(([tags, summaries]) => {
          setAvailableTags(tags || []);
          setListSummaries(summaries || []);
        })
        .finally(() => setLoadingTags(false));
    }
  }, [sourceType]);

  const currentOption = sourceOptions.find((opt) => opt.value === sourceType) || sourceOptions[0];

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#111827] dark:text-zinc-100">
          <Upload className="h-3.5 w-3.5" />
          Upload Contacts <span className="text-red-500">*</span>
        </label>
        
        <div className="relative">
          <button
            type="button"
            onClick={() => !disabled && setShowDropdown(!showDropdown)}
            disabled={disabled}
            className="flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium transition dark:border-zinc-700 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-2">
              {currentOption.icon}
              <span>{currentOption.label}</span>
            </div>
            <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showDropdown && (
            <div className="absolute z-20 mt-1 w-full rounded-lg border border-zinc-200 bg-white py-1 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
              {sourceOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChangeSource(opt.value);
                    setShowDropdown(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm transition hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {(sourceType === "excel" || sourceType === "csv") && (
        <div>
          <div
            onDragOver={(e) => { e.preventDefault(); if(!disabled) setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            onClick={() => !disabled && fileRef.current?.click()}
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all ${
              disabled
                ? "border-zinc-200 bg-zinc-50 opacity-50 cursor-not-allowed dark:border-zinc-800 dark:bg-zinc-900"
                : isDragging
                ? "border-violet-400 bg-violet-50 cursor-pointer dark:border-violet-500 dark:bg-violet-950/30"
                : fileUploaded
                ? "border-emerald-300 bg-emerald-50/50 cursor-pointer dark:border-emerald-600 dark:bg-emerald-950/20"
                : errors?.upload
                ? "border-red-400 bg-red-50 cursor-pointer dark:border-red-500 dark:bg-red-950/10"
                : "border-zinc-300 bg-zinc-50 cursor-pointer hover:border-violet-300 hover:bg-violet-50/30 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-violet-600"
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept={sourceType === "excel" ? ".xlsx,.xls" : ".csv"}
              className="hidden"
              onChange={handleFileSelect}
            />
            {fileUploaded ? (
              <>
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Upload Successful!</p>
                <p className="text-xs text-emerald-600/70 dark:text-emerald-500/50 mt-1">
                  {fileName} ({fileSize}) — {totalContacts} contacts loaded
                </p>
              </>
            ) : (
              <>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
                  <Upload className="h-5 w-5 text-zinc-400" />
                </div>
                <p className="text-sm font-semibold">Drag & Drop or <span className="text-violet-600 dark:text-violet-400">Browse Files</span></p>
                <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500 text-center">
                  Supports {sourceType === "excel" ? ".xlsx, .xls" : ".csv"} format
                </p>
              </>
            )}
          </div>
          {errors?.upload && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.upload}</p>}
        </div>
      )}

      {sourceType === "google_sheet" && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-[#111827] dark:text-zinc-100">
            Google Sheet URL <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={googleSheetUrl || ""}
              onChange={(e) => {
                if(disabled) return;
                onChangeGoogleSheetUrl?.(e.target.value);
                setSheetSuccess("");
              }}
              disabled={disabled}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className={`flex-1 rounded-lg border bg-white px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-900 ${
                errors?.googleSheetUrl ? 'border-red-400 dark:border-red-500' : 'border-zinc-200 focus:border-violet-400 dark:border-zinc-700'
              }`}
            />
            <button
              type="button"
              onClick={handleLoadSheet}
              disabled={isLoadingSheet || disabled}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isLoadingSheet ? "Loading..." : "Verify & Load"}
            </button>
          </div>
          {sheetSuccess && (
            <p className="text-xs font-semibold text-emerald-500 mt-1">{sheetSuccess}</p>
          )}
          {errors?.googleSheetUrl && <p className="text-xs font-medium text-red-500">{errors.googleSheetUrl}</p>}
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
            Google Sheet must be shared with &apos;Anyone with the link can view&apos;. Must contain &apos;Name&apos; and &apos;Phone&apos; columns.
          </p>
        </div>
      )}

      {sourceType === "contacts_book" && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#111827] dark:text-zinc-100 flex items-center gap-1.5">
              <BookUser className="h-4 w-4 text-violet-500" />
              Load from Contacts Book
            </p>
            <a
              href="/contacts"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400"
            >
              <span>Manage Contacts Book</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
            <div className="flex-1">
              <select
                value={selectedContactBookTag || "all"}
                onChange={(e) => {
                  const val = e.target.value;
                  onChangeSelectedContactBookTag?.(val);
                }}
                disabled={disabled || loadingTags}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-sm transition focus:border-violet-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="all">📂 All Saved Contacts</option>
                {listSummaries.length > 0
                  ? listSummaries.map((l) => (
                      <option key={l.tag} value={l.tag}>
                        🏷️ {l.tag} ({l.total_contacts} contacts · {l.valid_phones} phones)
                      </option>
                    ))
                  : availableTags.map((t) => (
                      <option key={t} value={t}>
                        🏷️ {t}
                      </option>
                    ))}
              </select>

            </div>

            <button
              type="button"
              onClick={() => onLoadFromContactBook?.(selectedContactBookTag)}
              disabled={disabled}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Load Contacts</span>
            </button>
          </div>

          {fileUploaded && totalContacts !== undefined && totalContacts > 0 ? (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/50 p-2.5 text-xs text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>
                Successfully loaded <strong>{totalContacts}</strong> contacts from Contact Book{" "}
                {selectedContactBookTag && selectedContactBookTag !== "all" ? `(tag: "${selectedContactBookTag}")` : "(All Contacts)"}.
              </span>
            </div>
          ) : (
            <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
              Select a tag/group or load all contacts from your permanent Contact Book into this campaign.
            </p>
          )}

          {errors?.upload && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.upload}</p>}
        </div>
      )}

      {sourceType === "single" && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#111827] dark:text-zinc-100">
            Single Contact Details
          </p>
          <div className="flex flex-col gap-3">
            <div>
              <input
                type="text"
                value={singleContactName || ""}
                onChange={(e) => onChangeSingleName?.(e.target.value)}
                disabled={disabled}
                placeholder="Full Name *"
                className={`w-full rounded-lg border bg-white px-3 py-2 text-sm transition focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-900 ${
                  errors?.singleContactName ? 'border-red-400' : 'border-zinc-200 focus:border-violet-400 dark:border-zinc-700'
                }`}
              />
              {errors?.singleContactName && <p className="mt-1 text-[10px] font-medium text-red-500">{errors.singleContactName}</p>}
            </div>
            <div>
              <input
                type="text"
                value={singleContactPhone || ""}
                onChange={(e) => onChangeSinglePhone?.(e.target.value)}
                disabled={disabled}
                placeholder="Phone Number (10 digits) *"
                className={`w-full rounded-lg border bg-white px-3 py-2 text-sm transition focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-900 ${
                  errors?.singleContactPhone ? 'border-red-400' : 'border-zinc-200 focus:border-violet-400 dark:border-zinc-700'
                }`}
              />
              {errors?.singleContactPhone && <p className="mt-1 text-[10px] font-medium text-red-500">{errors.singleContactPhone}</p>}
            </div>
            <div>
              <input
                type="email"
                value={singleContactEmail || ""}
                onChange={(e) => onChangeSingleEmail?.(e.target.value)}
                disabled={disabled}
                placeholder="Email Address (Optional — for testing Email Automation)"
                className={`w-full rounded-lg border bg-white px-3 py-2 text-sm transition focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-900 ${
                  errors?.singleContactEmail ? 'border-red-400' : 'border-zinc-200 focus:border-violet-400 dark:border-zinc-700'
                }`}
              />
              {errors?.singleContactEmail && <p className="mt-1 text-[10px] font-medium text-red-500">{errors.singleContactEmail}</p>}
              <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                Optional: Enter an email to receive post-call automation emails during test calls.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Save to Contact Book Toggle (Available for Excel, CSV, Google Sheet, and Single Contact) */}
      {sourceType !== "contacts_book" && (
        <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-3.5 transition-all dark:border-violet-900/30 dark:bg-violet-950/20">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={saveToContactBook || false}
              onChange={(e) => onChangeSaveToContactBook?.(e.target.checked)}
              disabled={disabled}
              className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500 dark:border-zinc-600 dark:bg-zinc-800"
            />
            <div className="flex-1">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <BookUser className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                Save imported contacts to Contact Book
              </span>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Automatically saves these contacts to your address book for future campaigns and auto-recalls.
              </p>
            </div>
          </label>

          {saveToContactBook && (
            <div className="mt-2.5 pl-6">
              <input
                type="text"
                value={contactBookTag || ""}
                onChange={(e) => onChangeContactBookTag?.(e.target.value)}
                disabled={disabled}
                placeholder="Optional Tag / List Name (e.g. Summer Outreach, Tax Leads)"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 transition focus:border-violet-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
