import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, Pencil, Play, Plus, RotateCcw, ScrollText, Search, Server, Square, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DataTable, ColumnVisibilityMenu, type DataTableColumn } from "../../DataTable";
import { Badge, Button, Card, Input } from "../../primitives";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { EmptyState } from "../EmptyState";
import type { FilterOption } from "../ProjectsFilterBar";
import { statusTone } from "../statusTone";
import { useOverviewProject, useOverviewRefreshMs } from "./useOverviewProject";
import ServiceViewDialog from "./ServiceViewDialog";
import type { ProjectStatus } from "../../../lib/data";
import { ApiError, addServiceApi, controlServiceApi, deleteServiceApi, getProjectServicesApi, updateServiceApi, type ServiceDTO } from "../../../lib/api";
import { useDebouncedValue } from "../../../lib/useDebouncedValue";

export type ServiceHealth = "available" | "unavailable" | "healthy" | "unhealthy";

export interface ServiceRow {
  id: string;
  name: string;
  type: "API" | "UI";
  address: string;
  host: string;
  port: number;
  status: ProjectStatus;
  serviceDirectory: string;
  runCommand: string;
  runnable: boolean;
  /** number = legacy percent (standalone Services page); string = live probe status. */
  health: number | ServiceHealth | null;
  url: string;
}

export interface ServiceFormInput {
  name: string;
  type: "API" | "UI";
  host: string;
  port: number;
  serviceDirectory: string;
  runCommand: string;
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

const healthTone: Record<ServiceHealth, "green" | "amber" | "red" | "neutral"> = {
  healthy: "green",
  available: "amber",
  unhealthy: "red",
  unavailable: "neutral",
};

function HealthCell({ health }: { health: ServiceRow["health"] }) {
  if (typeof health === "number") {
    return (
      <span className="flex items-center gap-2">
        <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
          <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${health}%` }} />
        </span>
        <span className="tabular-nums">{health}%</span>
      </span>
    );
  }
  if (typeof health === "string") {
    return <Badge tone={healthTone[health]}>{health.charAt(0).toUpperCase() + health.slice(1)}</Badge>;
  }
  return <span className="text-muted-foreground">—</span>;
}

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

const SEARCH_DEBOUNCE_MS = 400;

function toServiceRow(dto: ServiceDTO): ServiceRow {
  return {
    id: dto.id,
    name: dto.name,
    type: dto.type === "UI" ? "UI" : "API",
    address: dto.address,
    host: dto.host,
    port: dto.port,
    status: dto.status,
    serviceDirectory: dto.service_directory,
    runCommand: dto.run_command,
    runnable: dto.runnable,
    health: dto.health,
    url: dto.public_url,
  };
}

export default function ServicesTab() {
  const project = useOverviewProject();
  const refreshMs = useOverviewRefreshMs();
  const navigate = useNavigate();

  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const [fStatus, setFStatus] = useState("All");
  const [fType, setFType] = useState("All");
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ServiceRow | null>(null);
  const [deleting, setDeleting] = useState<ServiceRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<ServiceRow | null>(null);

  const toggleColumn = (key: string) => setHiddenColumns((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);

  const fetchServices = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (!silent) setLoading(true);
    try {
      const data = await getProjectServicesApi({
        project_id: project.id,
        search: debouncedQuery.trim(),
        status: fStatus,
        type: fType,
      });
      setServices(data.services.map(toServiceRow));
    } catch (err) {
      // Silent background refreshes never toast — a failing poll would
      // otherwise spam an error every interval.
      if (!silent) {
        toast.error(err instanceof ApiError ? err.message : "Failed to load services.");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [project.id, debouncedQuery, fStatus, fType]);

  // Full load on mount and project change; silent background updates after.
  const fullLoadNeeded = useRef(true);
  useEffect(() => {
    fullLoadNeeded.current = true;
  }, [project.id]);

  useEffect(() => {
    const silent = !fullLoadNeeded.current;
    fullLoadNeeded.current = false;
    void fetchServices({ silent });

    // Background polling on the header-selected interval. Skipped while the
    // tab is hidden; changing the interval refetches immediately.
    const timer = setInterval(() => {
      if (document.hidden) return;
      void fetchServices({ silent: true });
    }, refreshMs);
    return () => clearInterval(timer);
  }, [fetchServices, refreshMs]);

  // Refetch when the browser tab becomes visible again.
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden) void fetchServices({ silent: true });
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchServices]);

  const handleSubmit = async (input: ServiceFormInput) => {
    const payload = {
      name: input.name,
      type: input.type,
      host: input.host,
      port: input.port,
      service_directory: input.serviceDirectory,
      run_command: input.runCommand,
    };
    if (editing) {
      try {
        const data = await updateServiceApi({ service_id: editing.id, ...payload });
        toast.success(data.message ?? `Service "${input.name}" updated`);
        setCreating(false); setEditing(null);
        await fetchServices();
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to update service.");
      }
      return;
    }
    try {
      await addServiceApi({ project_id: project.id, ...payload });
      toast.success(`Service "${input.name}" added`);
      setCreating(false); setEditing(null);
      await fetchServices();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to add service.");
    }
  };

  const handleControl = async (s: ServiceRow, action: "start" | "stop" | "restart") => {
    if (actingId) return;
    setActingId(s.id);
    try {
      const data = await controlServiceApi(s.id, action);
      toast.success(data.message ?? `Service "${s.name}" ${action}ed`);
      await fetchServices();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : `Failed to ${action} service.`);
    } finally {
      setActingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleting || isDeleting) return;
    setIsDeleting(true);
    try {
      const data = await deleteServiceApi(deleting.id);
      toast.success(data.message ?? `Service "${deleting.name}" deleted`);
      setDeleting(null);
      await fetchServices();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete service.");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: DataTableColumn<ServiceRow>[] = [
    { key: "name", header: "Service Name", cell: (s) => <span className="font-medium tabular-nums">{s.name}</span> },
    { key: "type", header: "Type", cell: (s) => <Badge tone="neutral">{s.type}</Badge> },
    { key: "address", header: "Local Address", cell: (s) => <span className="whitespace-nowrap font-mono text-xs tabular-nums text-muted-foreground">{s.address}</span> },
    { key: "status", header: "Status", cell: (s) => <Badge tone={statusTone[s.status]}>{s.status}</Badge> },
    {
      key: "health", header: "Health",
      cell: (s) => <HealthCell health={s.health} />,
    },
    { key: "url", header: "Public URL", cell: (s) => <span className="block max-w-52 truncate font-mono text-xs tabular-nums text-muted-foreground">{s.url}</span> },
    {
      key: "actions", header: "Actions", headerClassName: "text-right", cellClassName: "text-right", enableHiding: false,
      cell: (s) => (
        <span className="inline-flex items-center gap-1.5">
          <Button variant="outline" size="icon" onClick={() => setViewing(s)} aria-label={`View ${s.name}`} title="View"><Eye className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" onClick={() => setEditing(s)} aria-label={`Edit ${s.name}`} title="Edit"><Pencil className="h-4 w-4" /></Button>
          {s.runnable && s.status === "Stopped" && (
            <Button variant="outline" size="icon" onClick={() => handleControl(s, "start")} disabled={actingId === s.id} aria-label={`Start ${s.name}`} title="Start"><Play className="h-4 w-4" /></Button>
          )}
          {s.runnable && s.status === "Running" && (
            <>
              <Button variant="outline" size="icon" onClick={() => handleControl(s, "restart")} disabled={actingId === s.id} aria-label={`Restart ${s.name}`} title="Restart"><RotateCcw className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" onClick={() => handleControl(s, "stop")} disabled={actingId === s.id} aria-label={`Stop ${s.name}`} title="Stop"><Square className="h-4 w-4" /></Button>
            </>
          )}
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
          data={loading ? [] : services}
          hiddenColumns={hiddenColumns}
          pagination={false}
          empty={loading
            ? <div className="p-6 text-center text-[13px] text-muted-foreground">Loading services…</div>
            : <div className="p-6"><EmptyState icon={Server} title="No services found" hint="Try a different search term or add a service." /></div>}
        />
      </Card>

      <ServiceDialog
        key={editing ? editing.id : "new"}
        open={creating || editing !== null}
        initial={editing ?? undefined}
        onOpenChange={(v) => { if (!v) { setCreating(false); setEditing(null); } }}
        onSubmit={handleSubmit}
      />

      <ServiceViewDialog
        key={viewing ? viewing.id : "closed"}
        service={viewing}
        onOpenChange={(v) => { if (!v) setViewing(null); }}
      />

      <Dialog open={deleting !== null} onOpenChange={(v) => { if (!v && !isDeleting) setDeleting(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete service</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete “{deleting?.name}”? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" type="button" onClick={() => setDeleting(null)} disabled={isDeleting}>Cancel</Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

export function ServiceDialog({ open, initial, onOpenChange, onSubmit }: {
  open: boolean;
  initial?: ServiceFormInput;
  onOpenChange: (v: boolean) => void;
  onSubmit: (input: ServiceFormInput) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<"API" | "UI">(initial?.type ?? "API");
  const [host, setHost] = useState(initial?.host ?? "");
  const [port, setPort] = useState(initial ? String(initial.port) : "");
  const [serviceDirectory, setServiceDirectory] = useState(initial?.serviceDirectory ?? "");
  const [runCommand, setRunCommand] = useState(initial?.runCommand ?? "");
  const portNum = Number(port);
  const valid = name.trim() !== "" && host.trim() !== "" && Number.isInteger(portNum) && portNum >= 1 && portNum <= 65535;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    onSubmit({ name: name.trim(), type, host: host.trim(), port: portNum, serviceDirectory: serviceDirectory.trim(), runCommand: runCommand.trim() });
    setName(""); setType("API"); setHost(""); setPort(""); setServiceDirectory(""); setRunCommand("");
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
          <div>
            <label htmlFor="service-directory" className="mb-1.5 block text-[13px] font-medium">Service directory <span className="font-normal text-muted-foreground">(optional)</span></label>
            <Input id="service-directory" value={serviceDirectory} onChange={(e) => setServiceDirectory(e.target.value)} placeholder="e.g. C:\repos\atlas-api" />
          </div>
          <div>
            <label htmlFor="service-command" className="mb-1.5 block text-[13px] font-medium">Run command <span className="font-normal text-muted-foreground">(optional)</span></label>
            <Input id="service-command" value={runCommand} onChange={(e) => setRunCommand(e.target.value)} placeholder="e.g. npm run dev" />
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
