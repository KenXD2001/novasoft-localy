import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, FolderKanban, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../../lib/utils";
import { Badge, Button } from "../../primitives";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { statusTone } from "../statusTone";
import { overviewTabs } from "./useOverviewProject";
import { ApiError, getProjectApi, getProjectsApi, type Project } from "../../../lib/api";
import { EmptyState } from "../EmptyState";

const REFRESH_OPTIONS = [
  { label: "5s", value: "5s" },
  { label: "10s", value: "10s" },
  { label: "15s", value: "15s" },
  { label: "30s", value: "30s" },
  { label: "60s", value: "60s" },
];

export default function Overview() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state?: { project?: Project; projectId?: string } };
  const { pathname } = useLocation();
  const isServicesTab = pathname.endsWith("/services");
  const [refreshMs, setRefreshMs] = useState(10000);
  const hintId = state?.project?.id;
  const hintProjectId = state?.projectId;
  const hintName = state?.project?.name;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Always resolve to a real database project. Navigation state may carry a
  // stale/mock reference (direct URL, legacy callers), so hints are resolved
  // through the API (id, then name) instead of trusted blindly.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const hints = [hintId, hintProjectId, hintName].filter(
          (h): h is string => !!h && h.trim() !== ""
        );
        let resolved: Project | null = null;
        for (const hint of hints) {
          try {
            resolved = await getProjectApi(hint);
            break;
          } catch (err) {
            if (!(err instanceof ApiError) || err.status !== 404) throw err;
          }
        }
        if (!resolved && hints.length === 0) {
          const list = await getProjectsApi({ search: "", status: "All", category: "All", sort: "asc" });
          resolved = list.projects[0] ?? null;
        }
        if (cancelled) return;
        if (resolved) setProject(resolved);
        else setNotFound(true);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
        else toast.error(err instanceof ApiError ? err.message : "Failed to load project.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hintId, hintProjectId, hintName]);

  if (loading) {
    return (
      <div className="space-y-6" aria-label="Loading project">
        <div className="animate-pulse space-y-2">
          <div className="h-7 w-56 rounded-md bg-muted" />
          <div className="h-4 w-40 rounded-md bg-muted" />
        </div>
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="space-y-6">
        <Button variant="outline" size="sm" onClick={() => navigate("/projects")}>
          <ArrowLeft className="h-4 w-4" />Back to Projects Page
        </Button>
        <EmptyState
          icon={FolderKanban}
          title="Project not found"
          hint="It may have been deleted, or the link holds an outdated reference."
          action={<Button variant="outline" size="sm" onClick={() => navigate("/projects")}>Browse projects</Button>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[26px] font-semibold tracking-tight">{project.name}</h1>
              <Badge tone={statusTone[project.status]}>{project.status}</Badge>
            </div>
            <p className="mt-1 text-[14px] tabular-nums text-muted-foreground">
              {project.category} · {project.services} services · {project.tunnels} tunnels
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            {isServicesTab && (
              <span className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Select value={`${refreshMs / 1000}s`} onValueChange={(v) => setRefreshMs((parseInt(v ?? "") || 10) * 1000)}>
                  <SelectTrigger aria-label="Auto-refresh interval" className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end" alignItemWithTrigger={false}>
                    <SelectGroup>
                      {REFRESH_OPTIONS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </span>
            )}
            <Button variant="outline" size="sm" onClick={() => navigate("/projects")}>
              <ArrowLeft className="h-4 w-4" />Back to Projects Page
            </Button>
          </div>
        </div>
      </motion.div>

      <nav aria-label="Project sections" className="flex gap-1 overflow-x-auto border-b border-border">
        {overviewTabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) => cn(
              "-mb-px border-b-2 px-3 py-2 text-sm whitespace-nowrap transition-colors",
              isActive ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </NavLink>
        ))}
      </nav>

      <Outlet context={{ project, refreshMs }} />
    </div>
  );
}
