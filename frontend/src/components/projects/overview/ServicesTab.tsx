import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Pencil, Plus, ScrollText, Search, Server, Trash2 } from "lucide-react";
import { DataTable, ColumnVisibilityMenu, type DataTableColumn } from "../../DataTable";
import { Badge, Button, Card, Input } from "../../primitives";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { EmptyState } from "../EmptyState";
import type { FilterOption } from "../ProjectsFilterBar";
import { statusTone } from "../statusTone";
import { useOverviewProject } from "./useOverviewProject";
import { toAddress } from "../../../lib/utils";
import type { ProjectStatus } from "../../../lib/data";

export interface ServiceRow {
  id: string;
  name: string;
  type: "API" | "UI";
  address: string;
  host: string;
  port: number;
  status: ProjectStatus;
  health: number | null;
  url: string;
}

const typeOptions: FilterOption[] = [
  { label: "All", value: "All" },
  { label: "API", value: "API" },
  { label: "UI", value: "UI" },
];

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

export default function ServicesTab() {
  const project = useOverviewProject();
  const navigate = useNavigate();

  const seed = useMemo<ServiceRow[]>(() => Array.from({ length: project.services }).map((_, i) => {
    const host = "localhost";
    const port = 3001 + i;
    return {
      id: `${project.id}-svc-0${i + 1}`,
      name: `${project.id}-svc-0${i + 1}`,
      type: i % 2 === 0 ? "API" : "UI",
      address: toAddress(host, port),
      host,
      port,
      status: project.status,
      health: project.status === "Running" ? 99 - ((i * 7) % 5) : null,
      url: `https://${project.id}-svc-0${i + 1}.localy.dev`,
    };
  }), [project]);
  const [services, setServices] = useState(seed);

  const [query, setQuery] = useState("");
  const [fStatus, setFStatus] = useState("All");
  const [fType, setFType] = useState("All");
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ServiceRow | null>(null);
  const [deleting, setDeleting] = useState<ServiceRow | null>(null);

  const toggleColumn = (key: string) => setHiddenColumns((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);

  const visible = useMemo(() => services.filter(
    (s) =>
      (fStatus === "All" || s.status === fStatus) &&
      (fType === "All" || s.type === fType) &&
      `${s.name} ${s.address} ${s.url}`.toLowerCase().includes(query.trim().toLowerCase())
  ), [services, fStatus, fType, query]);

  const columns: DataTableColumn<ServiceRow>[] = [
    { key: "name", header: "Service Name", cell: (s) => <span className="font-medium tabular-nums">{s.name}</span> },
    { key: "type", header: "Type", cell: (s) => <Badge tone="neutral">{s.type}</Badge> },
    { key: "address", header: "Local Address", cell: (s) => <span className="whitespace-nowrap font-mono text-xs tabular-nums text-muted-foreground">{s.address}</span> },
    { key: "status", header: "Status", cell: (s) => <Badge tone={statusTone[s.status]}>{s.status}</Badge> },
    {
      key: "health", header: "Health",
      cell: (s) => s.health === null
        ? <span className="text-muted-foreground">—</span>
        : (
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
              <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${s.health}%` }} />
            </span>
            <span className="tabular-nums">{s.health}%</span>
          </span>
        ),
    },
    { key: "url", header: "Public URL", cell: (s) => <span className="block max-w-52 truncate font-mono text-xs tabular-nums text-muted-foreground">{s.url}</span> },
    {
      key: "actions", header: "Actions", headerClassName: "text-right", cellClassName: "text-right", enableHiding: false,
      cell: (s) => (
        <span className="inline-flex items-center gap-1.5">
          <Button variant="outline" size="icon" onClick={() => setEditing(s)} aria-label={`Edit ${s.name}`} title="Edit"><Pencil className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" onClick={() => navigate("../logs", { state: { project } })} aria-label={`View logs for ${s.name}`} title="Logs"><ScrollText className="h-4 w-4" /></Button>
          <Button variant="destructive" size="icon" onClick={() => setDeleting(s)} aria-label={`Delete ${s.name}`} title="Delete"><Trash2 className="h-4 w-4" /></Button>
        </span>
      ),
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-4">
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label htmlFor="overview-service-search" className="mb-1.5 block text-[13px] font-medium">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="overview-service-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search services…" className="pl-9" />
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-2.5">
            <FilterSelect label="Status" labelId="overview-service-status-label" value={fStatus} onChange={setFStatus} options={statusOptions} className="w-full sm:w-36" />
            <FilterSelect label="Type" labelId="overview-service-type-label" value={fType} onChange={setFType} options={typeOptions} className="w-full sm:w-32" />
            <ColumnVisibilityMenu columns={columns} hidden={hiddenColumns} onToggle={toggleColumn} />
            <Button size="sm" onClick={() => setCreating(true)}><Plus className="h-4 w-4" />Add Service</Button>
          </div>
        </div>
        <DataTable
          columns={columns}
          data={visible}
          hiddenColumns={hiddenColumns}
          pagination={false}
          empty={<div className="p-6"><EmptyState icon={Server} title="No services found" hint="Try a different search term or add a service." /></div>}
        />
      </Card>

      <ServiceDialog
        key={editing ? editing.id : "new"}
        open={creating || editing !== null}
        initial={editing ?? undefined}
        onOpenChange={(v) => { if (!v) { setCreating(false); setEditing(null); } }}
        onSubmit={(input) => {
          if (editing) {
            setServices((prev) => prev.map((x) => x.id === editing.id ? { ...x, ...input, address: toAddress(input.host, input.port) } : x));
          } else {
            const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            setServices((prev) => [{ id: `${slug}-${Date.now()}`, status: project.status, health: project.status === "Running" ? 100 : null, url: `https://${slug}.localy.dev`, ...input, address: toAddress(input.host, input.port) }, ...prev]);
          }
          setCreating(false); setEditing(null);
        }}
      />

      <Dialog open={deleting !== null} onOpenChange={(v) => { if (!v) setDeleting(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete service</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete “{deleting?.name}”? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" type="button" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => { if (deleting) setServices((prev) => prev.filter((x) => x.id !== deleting.id)); setDeleting(null); }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

export function ServiceDialog({ open, initial, onOpenChange, onSubmit }: {
  open: boolean;
  initial?: { name: string; type: "API" | "UI"; host: string; port: number };
  onOpenChange: (v: boolean) => void;
  onSubmit: (input: { name: string; type: "API" | "UI"; host: string; port: number }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<"API" | "UI">(initial?.type ?? "API");
  const [host, setHost] = useState(initial?.host ?? "");
  const [port, setPort] = useState(initial ? String(initial.port) : "");
  const portNum = Number(port);
  const valid = name.trim() !== "" && host.trim() !== "" && Number.isInteger(portNum) && portNum >= 1 && portNum <= 65535;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    onSubmit({ name: name.trim(), type, host: host.trim(), port: portNum });
    setName(""); setType("API"); setHost(""); setPort("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit service" : "Add service"}</DialogTitle>
          <DialogDescription>{initial ? "Update the service details." : "Expose a new service on this project."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="service-name" className="mb-1.5 block text-[13px] font-medium">Service name</label>
            <Input id="service-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. atlas-api-svc-01" required />
          </div>
          <div>
            <span id="service-type-label" className="mb-1.5 block text-[13px] font-medium">Type</span>
            <Select value={type} onValueChange={(v) => setType(v === "UI" ? "UI" : "API")}>
              <SelectTrigger aria-labelledby="service-type-label" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start" alignItemWithTrigger={false}>
                <SelectGroup>
                  <SelectItem value="API">API</SelectItem>
                  <SelectItem value="UI">UI</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="service-host" className="mb-1.5 block text-[13px] font-medium">Host</label>
            <Input id="service-host" value={host} onChange={(e) => setHost(e.target.value)} placeholder="localhost" required />
          </div>
          <div>
            <label htmlFor="service-port" className="mb-1.5 block text-[13px] font-medium">Port</label>
            <Input id="service-port" value={port} onChange={(e) => setPort(e.target.value)} placeholder="3001" required inputMode="numeric" />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button size="sm" disabled={!valid}>{initial ? "Save changes" : "Add service"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
