import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { RotateCcw, ScrollText, Search, Trash2, Waypoints } from "lucide-react";
import { DataTable, ColumnVisibilityMenu, type DataTableColumn } from "../../DataTable";
import { Badge, Button, Card, Input } from "../../primitives";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { EmptyState } from "../EmptyState";
import type { FilterOption } from "../ProjectsFilterBar";
import { statusTone } from "../statusTone";
import { useOverviewProject } from "./useOverviewProject";
import type { ProjectStatus } from "../../../lib/data";

export interface TunnelRow {
  id: string;
  name: string;
  url: string;
  address: string;
  host: string;
  port: number;
  status: ProjectStatus;
}

const statusOptions: FilterOption[] = [
  { label: "All", value: "All" },
  { label: "Running", value: "Running" },
  { label: "Stopped", value: "Stopped" },
];

function FilterSelect({ label, labelId, value, onChange, options, className }: { label: string; labelId: string; value: string; onChange: (v: string) => void; options: FilterOption[]; className?: string }) {
  return (
    <div>
      <span id={labelId} className="mb-1.5 block text-[13px] font-medium">{label}</span>
      <Select value={value} onValueChange={(v) => onChange(v ?? "All")}>
        <SelectTrigger aria-labelledby={labelId} className={className}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start" alignItemWithTrigger={false}>
          <SelectGroup>
            {options.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

export default function TunnelsTab() {
  const project = useOverviewProject();
  const navigate = useNavigate();

  const seed = useMemo<TunnelRow[]>(() => Array.from({ length: project.tunnels }).map((_, i) => {
    const host = "localhost";
    const port = 4001 + i;
    return {
      id: `${project.id}-tun-0${i + 1}`,
      name: `${project.id}-tun-0${i + 1}`,
      url: `https://${project.id}-tun-0${i + 1}.locally.dev`,
      address: `http://${host}:${port}`,
      host,
      port,
      status: project.status,
    };
  }), [project]);
  const [tunnels, setTunnels] = useState(seed);

  const [query, setQuery] = useState("");
  const [fStatus, setFStatus] = useState("All");
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<TunnelRow | null>(null);

  const toggleColumn = (key: string) => setHiddenColumns((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);

  const visible = useMemo(() => tunnels.filter(
    (t) =>
      (fStatus === "All" || t.status === fStatus) &&
      `${t.name} ${t.url} ${t.address}`.toLowerCase().includes(query.trim().toLowerCase())
  ), [tunnels, fStatus, query]);

  const columns: DataTableColumn<TunnelRow>[] = [
    { key: "name", header: "Tunnel Name", cell: (t) => <span className="font-medium tabular-nums">{t.name}</span> },
    { key: "url", header: "Public URL", cell: (t) => <span className="block max-w-52 truncate font-mono text-xs tabular-nums text-muted-foreground">{t.url}</span> },
    { key: "address", header: "Local Address", cell: (t) => <span className="whitespace-nowrap font-mono text-xs tabular-nums text-muted-foreground">{t.address}</span> },
    { key: "status", header: "Status", cell: (t) => <Badge tone={statusTone[t.status]}>{t.status}</Badge> },
    {
      key: "actions", header: "Actions", headerClassName: "text-right", cellClassName: "text-right", enableHiding: false,
      cell: (t) => (
        <span className="inline-flex items-center gap-1.5">
          <Button variant="outline" size="icon" onClick={() => navigate("../logs", { state: { project } })} aria-label={`View logs for ${t.name}`} title="Logs"><ScrollText className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" onClick={() => setTunnels((prev) => prev.map((x) => x.id === t.id ? { ...x, status: "Running" as const } : x))} aria-label={`Restart ${t.name}`} title="Restart"><RotateCcw className="h-4 w-4" /></Button>
          <Button variant="destructive" size="icon" onClick={() => setDeleting(t)} aria-label={`Delete ${t.name}`} title="Delete"><Trash2 className="h-4 w-4" /></Button>
        </span>
      ),
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-4">
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label htmlFor="overview-tunnel-search" className="mb-1.5 block text-[13px] font-medium">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="overview-tunnel-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tunnels…" className="pl-9" />
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-2.5">
            <FilterSelect label="Status" labelId="overview-tunnel-status-label" value={fStatus} onChange={setFStatus} options={statusOptions} className="w-full sm:w-36" />
            <ColumnVisibilityMenu columns={columns} hidden={hiddenColumns} onToggle={toggleColumn} />
            <Button size="sm" onClick={() => setTunnels((prev) => prev.map((x) => ({ ...x, status: "Running" as const })))}><RotateCcw className="h-4 w-4" />Restart All</Button>
          </div>
        </div>
        <DataTable
          columns={columns}
          data={visible}
          hiddenColumns={hiddenColumns}
          pagination={false}
          empty={<div className="p-6"><EmptyState icon={Waypoints} title="No tunnels found" hint="Try a different search term or expose a local port." /></div>}
        />
      </Card>

      <Dialog open={deleting !== null} onOpenChange={(v) => { if (!v) setDeleting(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete tunnel</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete “{deleting?.name}”? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" type="button" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => { if (deleting) setTunnels((prev) => prev.filter((x) => x.id !== deleting.id)); setDeleting(null); }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
