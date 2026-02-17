import { useState } from "react";
import {
  Mail,
  Shield,
  LogOut,
  Info,
  Download,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import { useSession, useLogout } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "";

export default function ProfilePage() {
  const { data: session, isPending } = useSession();
  const logoutMutation = useLogout();
  const [exportingBikes, setExportingBikes] = useState(false);
  const [exportingWorkOrders, setExportingWorkOrders] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleExport = async (type: "bikes" | "work-orders") => {
    const setExporting = type === "bikes" ? setExportingBikes : setExportingWorkOrders;
    setExporting(true);

    try {
      const endpoint = type === "bikes" ? "/api/export/bikes" : "/api/export/work-orders";
      const filename = type === "bikes" ? "fietsen.csv" : "werkorders.csv";

      // For web, download via fetch and create a download link
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        credentials: "include",
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setExporting(false);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  const user = session?.user;

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      {/* Profile Header */}
      <div className="flex flex-col items-center py-8">
        <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center mb-4">
          <span className="text-white text-3xl font-extrabold">
            {user?.name
              ? user.name.charAt(0).toUpperCase()
              : user?.email?.charAt(0).toUpperCase() ?? "?"}
          </span>
        </div>
        <h1 className="text-slate-100 text-2xl font-bold">
          {user?.name ?? "Gebruiker"}
        </h1>
      </div>

      {/* Info Cards */}
      <div className="space-y-0.5 mb-6">
        <div className="bg-slate-800 rounded-t-xl p-4 border border-slate-700 border-b-0 flex items-center">
          <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center mr-4">
            <Mail className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-gray-500 text-xs">E-mail</p>
            <p className="text-slate-100 text-sm font-medium">{user?.email ?? "-"}</p>
          </div>
        </div>
        <div className="bg-slate-800 rounded-b-xl p-4 border border-slate-700 flex items-center">
          <div className="w-9 h-9 rounded-lg bg-green-500/20 flex items-center justify-center mr-4">
            <Shield className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <p className="text-gray-500 text-xs">Rol</p>
            <p className="text-slate-100 text-sm font-medium">
              Medewerker
            </p>
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="mb-6">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-3">
          Export Data
        </p>
        <div className="space-y-2">
          <button
            onClick={() => handleExport("bikes")}
            disabled={exportingBikes}
            className={cn(
              "w-full bg-slate-800 rounded-xl p-4 border border-slate-700 flex items-center",
              "transition-all hover:bg-slate-800/80 hover:border-slate-600",
              exportingBikes && "opacity-70 cursor-not-allowed"
            )}
          >
            <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center mr-4">
              {exportingBikes ? (
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 text-blue-400" />
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="text-slate-100 text-sm font-semibold">Export Fietsen</p>
              <p className="text-gray-500 text-xs">Download alle fietsen als CSV</p>
            </div>
            <Download className="w-4 h-4 text-blue-400" />
          </button>

          <button
            onClick={() => handleExport("work-orders")}
            disabled={exportingWorkOrders}
            className={cn(
              "w-full bg-slate-800 rounded-xl p-4 border border-slate-700 flex items-center",
              "transition-all hover:bg-slate-800/80 hover:border-slate-600",
              exportingWorkOrders && "opacity-70 cursor-not-allowed"
            )}
          >
            <div className="w-9 h-9 rounded-lg bg-orange-500/20 flex items-center justify-center mr-4">
              {exportingWorkOrders ? (
                <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 text-orange-400" />
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="text-slate-100 text-sm font-semibold">Export Werkorders</p>
              <p className="text-gray-500 text-xs">Download alle werkorders als CSV</p>
            </div>
            <Download className="w-4 h-4 text-orange-400" />
          </button>
        </div>
      </div>

      {/* Logout Button */}
      <Button
        onClick={handleLogout}
        disabled={logoutMutation.isPending}
        variant="outline"
        className="w-full border-red-500/40 text-red-400 hover:bg-red-500/20 hover:text-red-400"
      >
        {logoutMutation.isPending ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <LogOut className="w-4 h-4 mr-2" />
        )}
        {logoutMutation.isPending ? "Uitloggen..." : "Uitloggen"}
      </Button>

      {/* App Version */}
      <div className="flex items-center justify-center gap-1.5 mt-8 text-slate-600">
        <Info className="w-3.5 h-3.5" />
        <span className="text-xs">BikeShop v1.0.0</span>
      </div>
    </div>
  );
}
