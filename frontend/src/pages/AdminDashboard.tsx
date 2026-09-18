import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Database, RefreshCw, Server, ShieldCheck, Users, Activity, Bot, Sprout, CloudSun } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

type AdminOverviewPayload = {
  success: boolean;
  generatedAt: string;
  system: {
    db: string;
  };
  users: {
    total: number;
    admins: number;
    today: number;
    last7Days: number;
    recent: Array<{
      id: string;
      name: string;
      phone: string;
      createdAt: string;
    }>;
  };
  cropAnalyses: {
    total: number;
    today: number;
    diagnosisStatus: {
      confirmed: number;
      low_confidence: number;
      unknown: number;
    };
    recent: Array<{
      id: string;
      diseaseLabel: string;
      diagnosisStatus: string;
      confidence: number;
      createdAt: string;
      user: {
        id: string;
        name: string;
        phone: string;
      } | null;
    }>;
  };
  activities: {
    latestUserSignupAt: string | null;
    latestAnalysisAt: string | null;
  };
};

type UserActivityPayload = {
  success: boolean;
  data: {
    user: {
      id: string;
      name: string;
      phone: string;
      createdAt: string;
    };
    stats: {
      analyses: number;
      chatSessions: number;
    };
    recentAnalyses: Array<{
      id: string;
      cropType: string;
      diseaseLabel: string;
      diagnosisStatus: string;
      confidence: number;
      createdAt: string;
    }>;
    recentChats: Array<{
      id: string;
      sessionId: string;
      title: string;
      messageCount: number;
      updatedAt: string;
      createdAt: string;
    }>;
  };
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");

export default function AdminDashboard() {
  const { t } = useI18n();
  const { isLoggedIn, isAdmin, token } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<AdminOverviewPayload | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [userActivity, setUserActivity] = useState<UserActivityPayload["data"] | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const fetchAdminMetrics = async () => {
    setLoading(true);
    setLastError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/overview`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const payload = (await response.json().catch(() => ({}))) as Partial<AdminOverviewPayload> & { message?: string };
      if (!response.ok) {
        throw new Error(payload.message || `Failed to load admin data (${response.status})`);
      }

      setOverview(payload as AdminOverviewPayload);
    } catch (error) {
      setLastError(error instanceof Error ? error.message : "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserActivity = async (userId: string) => {
    setActivityLoading(true);
    setLastError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/activity`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const payload = (await response.json().catch(() => ({}))) as Partial<UserActivityPayload> & { message?: string };
      if (!response.ok) {
        throw new Error(payload.message || `Failed to load user activity (${response.status})`);
      }

      setUserActivity((payload as UserActivityPayload).data);
    } catch (error) {
      setLastError(error instanceof Error ? error.message : "Failed to load user activity");
    } finally {
      setActivityLoading(false);
    }
  };

  const deleteUser = async (userId: string, name: string) => {
    const confirmed = window.confirm(`Delete user ${name}? This will permanently remove their analyses and chat sessions.`);
    if (!confirmed) return;

    setDeletingUserId(userId);
    setLastError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const payload = (await response.json().catch(() => ({}))) as { message?: string; data?: { deletedUserId?: string } };
      if (!response.ok) {
        throw new Error(payload.message || `Failed to delete user (${response.status})`);
      }

      if (userActivity?.user?.id === userId) {
        setUserActivity(null);
      }

      await fetchAdminMetrics();
    } catch (error) {
      setLastError(error instanceof Error ? error.message : "Failed to delete user");
    } finally {
      setDeletingUserId(null);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    if (!isAdmin) {
      navigate("/dashboard", { replace: true });
      return;
    }

    fetchAdminMetrics();
  }, [isLoggedIn, isAdmin, navigate, token]);

  if (!isLoggedIn) {
    return (
      <div className="max-w-5xl mx-auto flex flex-col items-center justify-center h-[300px]">
        <p className="text-lg font-semibold text-foreground">{t("auth.login_required")}</p>
        <button
          onClick={() => navigate("/login")}
          className="mt-4 px-4 py-2 rounded-full bg-primary text-primary-foreground font-medium"
        >
          {t("auth.go_to_login")}
        </button>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const backendUp = Boolean(overview);
  const dbUp = overview?.system?.db === "connected";
  const users = overview?.users;
  const analyses = overview?.cropAnalyses;
  const lastUpdatedLabel = overview?.generatedAt ? new Date(overview.generatedAt).toLocaleString() : "-";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/10 via-secondary/10 to-transparent p-6 md:p-7">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground inline-flex items-center gap-2">
              <ShieldCheck className="h-8 w-8 text-primary" />
              {t("nav.admin")} Control Center
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Unified operations view for backend health, data reliability, and live news stream.
            </p>
          </div>

          <button
            onClick={fetchAdminMetrics}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-md"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="mt-4 text-xs text-muted-foreground">
          Last refresh: {lastUpdatedLabel}
        </div>
      </div>

      {lastError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {lastError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          icon={<Server className="h-5 w-5 text-primary" />}
          title="Backend Gateway"
          value={loading ? "..." : backendUp ? "Healthy" : "Unavailable"}
          hint="/api/admin/overview"
        />
        <MetricCard
          icon={<Database className="h-5 w-5 text-primary" />}
          title="Database Cluster"
          value={loading ? "..." : dbUp ? "Connected" : "Disconnected"}
          hint="MongoDB status"
        />
        <MetricCard
          icon={<Users className="h-5 w-5 text-primary" />}
          title="Total Users"
          value={loading ? "..." : users ? String(users.total) : "No data"}
          hint={users ? `+${users.today} today` : "User registry"}
        />
        <MetricCard
          icon={<Activity className="h-5 w-5 text-primary" />}
          title="Total Crop Analyses"
          value={loading ? "..." : analyses ? String(analyses.total) : "No data"}
          hint={analyses ? `+${analyses.today} today` : "Analysis traffic"}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="xl:col-span-3 rounded-2xl border border-border bg-card p-5"
        >
          <h2 className="text-lg font-semibold text-foreground">Module Health</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <ModuleCard icon={<CloudSun className="h-4 w-4" />} name="Dashboard + Weather" route="/dashboard" status="Active" />
            <ModuleCard icon={<Sprout className="h-4 w-4" />} name="Crop Assistant" route="/assistant" status="Active" />
            <ModuleCard icon={<Users className="h-4 w-4" />} name="User Management" route="/admin" status={users ? "Active" : "Degraded"} />
            <ModuleCard icon={<Bot className="h-4 w-4" />} name="AI Assistant" route="/ai-assistant" status="Active" />
          </div>

          <div className="mt-5 rounded-xl border border-border/80 p-4">
            <p className="text-sm font-semibold text-foreground">Project Activities</p>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
              <p>Latest signup: {overview?.activities?.latestUserSignupAt ? new Date(overview.activities.latestUserSignupAt).toLocaleString() : "-"}</p>
              <p>Latest analysis: {overview?.activities?.latestAnalysisAt ? new Date(overview.activities.latestAnalysisAt).toLocaleString() : "-"}</p>
              <p>Users in last 7 days: {users ? users.last7Days : "-"}</p>
              <p>Admin accounts: {users ? users.admins : "-"}</p>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="xl:col-span-2 rounded-2xl border border-border bg-card p-5"
        >
          <h2 className="text-lg font-semibold text-foreground">Recent User Activity</h2>
          <div className="mt-4 space-y-3">
            {loading && <p className="text-sm text-muted-foreground">Loading activity...</p>}
            {!loading && (!users || users.recent.length === 0) && (
              <p className="text-sm text-muted-foreground">No recent activity available.</p>
            )}
            {!loading &&
              users?.recent.map((item) => (
                <div key={item.id} className="rounded-xl border border-border/80 p-3">
                  <p className="text-sm font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.phone}</p>
                  <p className="text-xs text-muted-foreground mt-1">Joined: {new Date(item.createdAt).toLocaleString()}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => fetchUserActivity(item.id)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-primary/40 text-primary hover:bg-primary/10"
                    >
                      View Activity
                    </button>
                    <button
                      onClick={() => deleteUser(item.id, item.name)}
                      disabled={deletingUserId === item.id}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-destructive/40 text-destructive hover:bg-destructive/10 disabled:opacity-60"
                    >
                      {deletingUserId === item.id ? "Deleting..." : "Delete User"}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </motion.section>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.07 }}
        className="rounded-2xl border border-border bg-card p-5"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Selected User Activity</h2>
          {userActivity && (
            <button
              onClick={() => setUserActivity(null)}
              className="px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:bg-muted"
            >
              Clear
            </button>
          )}
        </div>

        {activityLoading && <p className="mt-3 text-sm text-muted-foreground">Loading user activity...</p>}
        {!activityLoading && !userActivity && (
          <p className="mt-3 text-sm text-muted-foreground">Select a user from Recent User Activity to inspect actions.</p>
        )}

        {!activityLoading && userActivity && (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-border/80 p-4">
              <p className="text-sm font-semibold text-foreground">{userActivity.user.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{userActivity.user.phone}</p>
              <p className="text-xs text-muted-foreground mt-1">Joined: {new Date(userActivity.user.createdAt).toLocaleString()}</p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <p>Crop analyses: <span className="font-semibold">{userActivity.stats.analyses}</span></p>
                <p>Chat sessions: <span className="font-semibold">{userActivity.stats.chatSessions}</span></p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border/80 p-4">
                <p className="text-sm font-semibold text-foreground">Recent Crop Analyses</p>
                <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
                  {userActivity.recentAnalyses.length === 0 && (
                    <p className="text-xs text-muted-foreground">No crop analyses recorded.</p>
                  )}
                  {userActivity.recentAnalyses.map((item) => (
                    <div key={item.id} className="rounded-lg border border-border/70 p-2.5">
                      <p className="text-sm font-medium text-foreground">{item.diseaseLabel}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.cropType} • {item.diagnosisStatus} • {Number(item.confidence || 0).toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(item.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border/80 p-4">
                <p className="text-sm font-semibold text-foreground">Recent AI Chat Sessions</p>
                <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
                  {userActivity.recentChats.length === 0 && (
                    <p className="text-xs text-muted-foreground">No chat sessions recorded.</p>
                  )}
                  {userActivity.recentChats.map((item) => (
                    <div key={item.id} className="rounded-lg border border-border/70 p-2.5">
                      <p className="text-sm font-medium text-foreground truncate">{item.title || "New Chat"}</p>
                      <p className="text-xs text-muted-foreground mt-1">Messages: {item.messageCount}</p>
                      <p className="text-xs text-muted-foreground mt-1">Updated: {new Date(item.updatedAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="rounded-2xl border border-border bg-card p-5"
      >
        <h2 className="text-lg font-semibold text-foreground">Recent Crop Analysis Activity</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-2 pr-4">Farmer</th>
                <th className="py-2 pr-4">Disease</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Confidence</th>
                <th className="py-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td className="py-3 text-muted-foreground" colSpan={5}>
                    Loading analysis activity...
                  </td>
                </tr>
              )}
              {!loading && (!analyses || analyses.recent.length === 0) && (
                <tr>
                  <td className="py-3 text-muted-foreground" colSpan={5}>
                    No analysis records yet.
                  </td>
                </tr>
              )}
              {!loading &&
                analyses?.recent.map((row) => (
                  <tr key={row.id} className="border-b border-border/60">
                    <td className="py-2 pr-4">{row.user?.name || "Unknown"}</td>
                    <td className="py-2 pr-4">{row.diseaseLabel || "-"}</td>
                    <td className="py-2 pr-4">{row.diagnosisStatus || "-"}</td>
                    <td className="py-2 pr-4">{Number.isFinite(row.confidence) ? `${row.confidence}%` : "-"}</td>
                    <td className="py-2">{new Date(row.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </motion.section>
    </div>
  );
}

function MetricCard({ icon, title, value, hint }: { icon: ReactNode; title: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{title}</p>
        {icon}
      </div>
      <p className="text-2xl font-bold text-foreground mt-2">{value}</p>
      {hint ? <p className="text-xs text-muted-foreground mt-2">{hint}</p> : null}
    </div>
  );
}

function ModuleCard({ icon, name, route, status }: { icon: ReactNode; name: string; route: string; status: string }) {
  const isHealthy = status === "Active";
  return (
    <div className="rounded-xl border border-border/80 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground inline-flex items-center gap-2">
          {icon}
          {name}
        </p>
        <span
          className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
            isHealthy ? "bg-primary/15 text-primary" : "bg-amber-500/15 text-amber-700"
          }`}
        >
          {status}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mt-2">Route: {route}</p>
    </div>
  );
}
