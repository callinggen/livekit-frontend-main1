import { 
  FileText, 
  Phone, 
  CheckCircle2, 
  Target, 
  PhoneForwarded, 
  Coins, 
  Bot, 
  TrendingUp, 
  Activity, 
  LayoutDashboard,
  Calendar,
  PhoneCall,
  History,
  Megaphone,
  BarChart,
  LogOut,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardShowcaseSection() {
  const stats = [
    { label: "Total Campaigns", value: "4", icon: <FileText className="w-5 h-5 text-purple-500" />, bg: "bg-purple-100" },
    { label: "Total Calls", value: "4", icon: <Phone className="w-5 h-5 text-blue-500" />, bg: "bg-blue-100" },
    { label: "Completed Calls", value: "0", icon: <CheckCircle2 className="w-5 h-5 text-green-500" />, bg: "bg-green-100" },
    { label: "Interested Leads", value: "0", icon: <Target className="w-5 h-5 text-red-500" />, bg: "bg-red-100" },
    { label: "Callbacks", value: "0", icon: <PhoneForwarded className="w-5 h-5 text-yellow-500" />, bg: "bg-yellow-100" },
    { label: "Credits", value: "2000", icon: <Coins className="w-5 h-5 text-blue-500" />, bg: "bg-blue-100" },
    { label: "Active Agents", value: "0", icon: <Bot className="w-5 h-5 text-fuchsia-500" />, bg: "bg-fuchsia-100" },
    { label: "Success Rate", value: "0.0%", icon: <TrendingUp className="w-5 h-5 text-emerald-500" />, bg: "bg-emerald-100" },
  ];

  return (
    <section className="py-24 bg-white dark:bg-[#0f172a]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1400px]">
        {/* Dashboard Mockup Container */}
        <div className="relative mx-auto w-full max-w-6xl shadow-2xl rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex h-[800px]">
          
          {/* Sidebar */}
          <div className="w-64 bg-white dark:bg-[#111827] border-r border-gray-200 dark:border-gray-800 flex flex-col hidden md:flex">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
              <div className="bg-[#7B61FF] p-1.5 rounded-lg">
                <PhoneCall className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-900 dark:text-white">CallingGen</span>
            </div>
            
            <div className="p-4 flex-1">
              <div className="text-xs font-semibold text-gray-400 mb-4 tracking-wider">NAVIGATION</div>
              <nav className="space-y-1">
                <div className="flex items-center gap-3 bg-[#6366F1] text-white px-3 py-2 rounded-lg">
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="text-sm font-medium">Dashboard</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-2 rounded-lg cursor-pointer transition-colors">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">Calendar</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-2 rounded-lg cursor-pointer transition-colors">
                  <PhoneCall className="w-4 h-4" />
                  <span className="text-sm font-medium">Call Manager</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-2 rounded-lg cursor-pointer transition-colors">
                  <History className="w-4 h-4" />
                  <span className="text-sm font-medium">Call Logs</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-2 rounded-lg cursor-pointer transition-colors">
                  <Megaphone className="w-4 h-4" />
                  <span className="text-sm font-medium">Campaign</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-2 rounded-lg cursor-pointer transition-colors">
                  <BarChart className="w-4 h-4" />
                  <span className="text-sm font-medium">Report</span>
                </div>
              </nav>
            </div>
            
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#6366F1] flex items-center justify-center text-white text-xs font-bold">
                  A
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Admin User</div>
                  <div className="text-xs text-gray-500">admin@example.com</div>
                </div>
              </div>
              <button className="flex items-center justify-center gap-2 w-full py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col bg-[#F8FAFC] dark:bg-[#0f172a] overflow-hidden">
            {/* Top Navbar */}
            <div className="h-16 bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6">
              <div>
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Overview</div>
                <div className="text-sm font-bold text-gray-900 dark:text-white">Dashboard</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-3 py-1.5 rounded-full text-xs font-semibold">
                  <Target className="w-3 h-3" /> Starter Plan
                </div>
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-200 dark:border-gray-700">
                  <Coins className="w-3 h-3" /> 2000
                </div>
                <div className="w-8 h-8 rounded-full bg-[#6366F1] flex items-center justify-center text-white text-sm font-bold">
                  A
                </div>
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    Welcome back, Admin User <span className="text-2xl">👋</span>
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Here is what&apos;s happening with your campaigns today.
                  </p>
                  <p className="text-[#6366F1] text-sm mt-1 font-medium">
                    Wednesday, July 29, 2026
                  </p>
                </div>
                <Button className="bg-[#6366F1] hover:bg-[#4f46e5] text-white rounded-lg px-4 py-2 flex items-center gap-2 shadow-md">
                  <Plus className="w-4 h-4" /> New Campaign
                </Button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, i) => (
                  <div key={i} className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-current to-transparent opacity-[0.05] rounded-full blur-xl" style={{ color: stat.bg.replace('bg-', '') }}></div>
                    <div className={`w-10 h-10 ${stat.bg} dark:bg-opacity-20 rounded-full flex items-center justify-center mb-4`}>
                      {stat.icon}
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Bottom Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-gray-900 dark:text-white">Recent Activity</h3>
                    <Activity className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Call Attempt Failed</span>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                  <div className="mb-6">
                    <h3 className="font-bold text-gray-900 dark:text-white">Quick Actions</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-12 rounded-lg border border-gray-200 dark:border-gray-700 border-dashed flex items-center justify-center text-sm text-gray-500 cursor-not-allowed">
                      Action 1
                    </div>
                    <div className="h-12 rounded-lg border border-gray-200 dark:border-gray-700 border-dashed flex items-center justify-center text-sm text-gray-500 cursor-not-allowed">
                      Action 2
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
