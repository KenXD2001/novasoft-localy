import type { ProjectStatus } from "../../lib/data";

export const statusTone: Record<ProjectStatus, "default" | "destructive"> = {
  Running: "default",
  Stopped: "destructive",
};
