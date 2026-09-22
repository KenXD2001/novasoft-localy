import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { DataLog, type LogRow } from "../../DataLog";
import { useOverviewProject } from "./useOverviewProject";

export default function LogsTab() {
  const project = useOverviewProject();
  const seed = useMemo<LogRow[]>(() => [
    { id: "log-1", date: "Sep 22, 2026", time: "14:02:11", category: "tunnel", type: "info", message: `Handshake completed for ${project.id} (edge fra-2, 42ms)` },
    { id: "log-2", date: "Sep 22, 2026", time: "14:01:48", category: "service", type: "info", message: "Health check passed on all services" },
    { id: "log-3", date: "Sep 22, 2026", time: "13:58:03", category: "service", type: "warn", message: "Retry budget at 70% on svc-02, backing off" },
    { id: "log-4", date: "Sep 22, 2026", time: "13:54:37", category: "system", type: "info", message: "Deployed revision a3f9c1d to 3 services" },
    { id: "log-5", date: "Sep 22, 2026", time: "13:51:20", category: "service", type: "error", message: "Upstream timeout on svc-01, recovered in 1.2s" },
    { id: "log-6", date: "Sep 22, 2026", time: "13:47:55", category: "system", type: "info", message: "Autoscaler holding at 2 replicas (load 34%)" },
    { id: "log-7", date: "Sep 22, 2026", time: "13:44:09", category: "tunnel", type: "info", message: "TLS certificates renewed for all tunnels" },
    { id: "log-8", date: "Sep 22, 2026", time: "13:39:52", category: "tunnel", type: "warn", message: "Unusual traffic spike on tun-01, within limits" },
  ], [project]);
  const [logs, setLogs] = useState(seed);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <DataLog logs={logs} onClearAll={() => setLogs([])} />
    </motion.div>
  );
}
