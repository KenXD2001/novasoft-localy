import { useOutletContext } from "react-router-dom";
import type { Project } from "../../../lib/data";

export const overviewTabs = [
  { to: "details", label: "Details" },
  { to: "services", label: "Services" },
  { to: "tunnels", label: "Tunnels" },
  { to: "logs", label: "Logs" },
];

export function useOverviewProject() {
  return useOutletContext<{ project: Project }>().project;
}
