import { useOutletContext } from "react-router-dom";
import type { Project } from "../../../lib/data";

export const overviewTabs = [
  { to: "details", label: "Details" },
  { to: "services", label: "Services" },
  { to: "tunnels", label: "Tunnels" },
  { to: "logs", label: "Logs" },
];

export interface OverviewContext {
  project: Project;
  /** Auto-refresh interval (ms) selected in the overview header. */
  refreshMs: number;
}

export function useOverviewProject() {
  return useOutletContext<OverviewContext>().project;
}

export function useOverviewRefreshMs() {
  return useOutletContext<OverviewContext>().refreshMs;
}
