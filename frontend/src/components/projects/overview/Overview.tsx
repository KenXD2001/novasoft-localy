import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { projects, type Project } from "../../../lib/data";
import { cn } from "../../../lib/utils";
import { Badge, Button } from "../../primitives";
import { statusTone } from "../statusTone";
import { overviewTabs } from "./useOverviewProject";

export default function Overview() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state?: { project?: Project; projectId?: string } };
  const project = state?.project ?? projects.find((p) => p.id === state?.projectId) ?? projects[0];

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
          <Button variant="outline" size="sm" onClick={() => navigate("/projects")}>
            <ArrowLeft className="h-4 w-4" />Back to Projects Page
          </Button>
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

      <Outlet context={{ project }} />
    </div>
  );
}
