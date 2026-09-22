import { motion } from "framer-motion";
import { Badge, Card } from "../../primitives";
import { statusTone } from "../statusTone";
import { useOverviewProject } from "./useOverviewProject";

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-[13px]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}

export default function DetailsTab() {
  const project = useOverviewProject();
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="grid gap-4 md:grid-cols-2">
      <Card className="p-5">
        <h2 className="text-[15px] font-semibold">About</h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{project.description}</p>
      </Card>
      <Card className="p-5">
        <h2 className="text-[15px] font-semibold">Info</h2>
        <dl className="mt-1 divide-y divide-border/60">
          <InfoRow label="Status"><Badge tone={statusTone[project.status]}>{project.status}</Badge></InfoRow>
          <InfoRow label="Category">{project.category}</InfoRow>
          <InfoRow label="Services"><span className="tabular-nums">{project.services}</span></InfoRow>
          <InfoRow label="Tunnels"><span className="tabular-nums">{project.tunnels}</span></InfoRow>
        </dl>
      </Card>
    </motion.div>
  );
}
