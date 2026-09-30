import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, ScrollText, Server, Trash2 } from "lucide-react";
import { projects } from "../lib/data";
import { Page } from "../components/page";
import { DataTable, type DataTableColumn } from "../components/DataTable";
import { Badge, Button, Card } from "../components/primitives";
import { ServicesFilterBar } from "../components/services/ServicesFilterBar";
import { EmptyState } from "../components/projects";
import { ServiceDialog, type ServiceRow } from "../components/projects/overview/ServicesTab";
import { toAddress } from "../lib/utils";
import { statusTone } from "../components/projects/statusTone";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";

interface ServiceTableRow extends ServiceRow {
  projectId: string;
  projectName: string;
}

export default function Services() {
  const navigate = useNavigate();

  const seed = useMemo<ServiceTableRow[]>(() => projects.flatMap((p) => Array.from({ length: p.services }).map((_, i) => {
    const host = "localhost";
    const port = 3001 + i;
    return {
      id: `${p.id}-svc-0${i + 1}`,
      projectId: p.id,
      projectName: p.name,
      name: `${p.id}-svc-0${i + 1}`,
      type: (i % 2 === 0 ? "API" : "UI") as ServiceRow["type"],
      address: toAddress(host, port),
      host,
      port,
      status: p.status,
      serviceDirectory: "",
      runCommand: "",
      runnable: false,
      health: p.status === "Running" ? 99 - ((i * 7) % 5) : null,
      url: `https://${p.id}-svc-0${i + 1}.locally.dev`,
    };
  })), []);
  const [services, setServices] = useState(seed);

  const [query, setQuery] = useState("");
  const [project, setProject] = useState("All");
  const [type, setType] = useState("All");
  const [status, setStatus] = useState("All");
  const [asc, setAsc] = useState(true);
  const [editing, setEditing] = useState<ServiceTableRow | null>(null);
  const [deleting, setDeleting] = useState<ServiceTableRow | null>(null);

  const projectOptions = useMemo(() => [{ label: "All", value: "All" }, ...projects.map((p) => ({ label: p.name, value: p.id }))], []);
  const typeOptions = useMemo(() => ["All", "API", "UI"].map((t) => ({ label: t, value: t })), []);
  const statusOptions = useMemo(() => ["All", "Running", "Stopped"].map((s) => ({ label: s, value: s })), []);

  const visible = useMemo(
    () =>
      services
        .filter(
          (s) =>
            (project === "All" || s.projectId === project) &&
            (type === "All" || s.type === type) &&
            (status === "All" || s.status === status) &&
            `${s.projectName} ${s.name} ${s.address} ${s.url}`.toLowerCase().includes(query.trim().toLowerCase())
        )
        .sort((a, b) => (asc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name))),
    [services, project, type, status, query, asc]
  );

  const columns: DataTableColumn<ServiceTableRow>[] = [
    { key: "project", header: "Project", cell: (s) => <span className="whitespace-nowrap">{s.projectName}</span> },
    { key: "name", header: "Service", cell: (s) => <span className="font-medium tabular-nums">{s.name}</span> },
    { key: "type", header: "Type", cell: (s) => <Badge tone="neutral">{s.type}</Badge> },
    { key: "address", header: "Address", cell: (s) => <span className="whitespace-nowrap font-mono text-xs tabular-nums text-muted-foreground">{s.address}</span> },
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
          <Button
            variant="outline" size="icon"
            onClick={() => navigate("/projects/overview/logs", { state: { project: projects.find((p) => p.id === s.projectId) } })}
            aria-label={`View logs for ${s.name}`} title="Logs"
          >
            <ScrollText className="h-4 w-4" />
          </Button>
          <Button variant="destructive" size="icon" onClick={() => setDeleting(s)} aria-label={`Delete ${s.name}`} title="Delete"><Trash2 className="h-4 w-4" /></Button>
        </span>
      ),
    },
  ];

  return (
    <Page title="Services" subtitle="Every service across all projects.">
      <ServicesFilterBar
        query={query} onQueryChange={setQuery}
        project={project} onProjectChange={setProject} projects={projectOptions}
        type={type} onTypeChange={setType} types={typeOptions}
        status={status} onStatusChange={setStatus} statuses={statusOptions}
        asc={asc} onToggleSort={() => setAsc((v) => !v)}
      />
      <Card className="overflow-hidden">
        <DataTable
          columns={columns}
          data={visible}
          empty={<div className="p-6"><EmptyState icon={Server} title="No services found" hint="Try a different search term or filter." /></div>}
        />
      </Card>

      <ServiceDialog
        key={editing ? editing.id : "closed"}
        open={editing !== null}
        initial={editing ?? undefined}
        onOpenChange={(v) => { if (!v) setEditing(null); }}
        onSubmit={(input) => {
          if (editing) {
            setServices((prev) => prev.map((x) => x.id === editing.id ? { ...x, ...input, address: toAddress(input.host, input.port) } : x));
            setEditing(null);
          }
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
    </Page>
  );
}
