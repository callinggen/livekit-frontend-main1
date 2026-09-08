"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useCredits } from "@/components/CreditsContext";
import DashboardShell from "@/components/DashboardShell";
import { api, PaymentRecord } from "@/lib/api";
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  Coins,
  Receipt,
  Search,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PaymentHistoryPage() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const { credits } = useCredits();

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "pending" | "failed">("all");

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/login?redirect=/pricing/history");
      return;
    }
    fetchPayments();
  }, [isLoggedIn, router]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await api.getPaymentHistory();
      setPayments(data || []);
    } catch (err) {
      console.warn("Failed to load payment history:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) return null;

  // Filtered payments
  const filteredPayments = payments.filter((p) => {
    const matchesStatus = statusFilter === "all" || p.status.toLowerCase() === statusFilter;
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !query ||
      p.plan_name.toLowerCase().includes(query) ||
      p.razorpay_order_id.toLowerCase().includes(query) ||
      (p.razorpay_payment_id && p.razorpay_payment_id.toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  });

  // Calculate statistics
  const totalSpentPaise = payments
    .filter((p) => p.status === "success")
    .reduce((acc, p) => acc + (p.amount || 0), 0);
  const totalCreditsPurchased = payments
    .filter((p) => p.status === "success")
    .reduce((acc, p) => acc + (p.credits || 0), 0);
  const totalSuccessfulTxns = payments.filter((p) => p.status === "success").length;

  return (
    <DashboardShell title="Payment History">
      <div className="space-y-8 p-1 sm:p-4 max-w-7xl mx-auto pb-16">
        
        {/* Top Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Buy Credits</span>
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mt-2">
              Payment & Credit History
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Track all your plan subscriptions, add-on credit purchases, and transaction receipts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPayments}
              disabled={loading}
              className="rounded-xl border-zinc-200 dark:border-zinc-800 text-xs font-semibold gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
            <Link href="/pricing">
              <Button size="sm" className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold gap-2">
                <Coins className="w-3.5 h-3.5" />
                <span>Buy Credits</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Top Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-[#0B0F19]">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Available Balance</span>
              <Coins className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-extrabold text-zinc-900 dark:text-white font-mono">
              {credits !== null ? credits.toLocaleString() : "—"}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Current unspent credits</p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-[#0B0F19]">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Credits Bought</span>
              <Sparkles className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              +{totalCreditsPurchased.toLocaleString()}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Lifetime purchased credits</p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-[#0B0F19]">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Spent</span>
              <CreditCard className="w-4 h-4 text-violet-500" />
            </div>
            <div className="text-2xl font-extrabold text-zinc-900 dark:text-white font-mono">
              ₹{(totalSpentPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Across all successful orders</p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-[#0B0F19]">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Successful Orders</span>
              <Receipt className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-extrabold text-zinc-900 dark:text-white font-mono">
              {totalSuccessfulTxns}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Completed transactions</p>
          </div>
        </div>

        {/* Payments Table Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-[#0B0F19] overflow-hidden">
          
          {/* Table Controls (Search & Status Filter) */}
          <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by order ID, plan, or payment ID..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {(["all", "success", "pending", "failed"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition cursor-pointer ${
                    statusFilter === st
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Table / List */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500 mb-2" />
                Loading payment records...
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-400">
                  <Receipt className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">No payment transactions found</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "You haven't made any payment purchases yet. Get started by topping up credits or upgrading a plan."}
                </p>
                {!searchTerm && statusFilter === "all" && (
                  <Link href="/pricing" className="inline-block mt-4">
                    <Button size="sm" className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold">
                      Explore Plans & Top-Ups
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    <th className="py-3 px-4 sm:px-6">Item / Plan</th>
                    <th className="py-3 px-4">Credits Added</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Order & Payment ID</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
                  {filteredPayments.map((p) => {
                    const dateFormatted = p.created_at
                      ? new Date(p.created_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—";

                    return (
                      <tr key={p.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 transition">
                        {/* Item Name */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                              <Coins className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-zinc-900 dark:text-white">
                                {p.plan_name}
                              </div>
                              <div className="text-[11px] text-zinc-400">
                                Receipt #{p.id}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Credits Added */}
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                            +{p.credits.toLocaleString()} Credits
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="py-4 px-4 font-bold text-zinc-900 dark:text-white font-mono">
                          ₹{(p.amount / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>

                        {/* Order & Payment ID */}
                        <td className="py-4 px-4">
                          <div className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
                            {p.razorpay_order_id}
                          </div>
                          {p.razorpay_payment_id && (
                            <div className="font-mono text-[10px] text-zinc-400">
                              Pay ID: {p.razorpay_payment_id}
                            </div>
                          )}
                        </td>

                        {/* Date */}
                        <td className="py-4 px-4 text-zinc-500 whitespace-nowrap">
                          {dateFormatted}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4 sm:px-6 text-right">
                          {p.status === "success" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              Success
                            </span>
                          ) : p.status === "pending" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 text-[11px] font-bold">
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                              Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-[11px] font-bold">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                              Failed
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

        </div>

      </div>
    </DashboardShell>
  );
}
