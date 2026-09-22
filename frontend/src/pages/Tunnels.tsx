import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RotateCcw, ScrollText, Trash2, Waypoints } from "lucide-react";
import { projects } from "../lib/data";
import { Page } from "../components/page";
import { DataTable, type DataTableColumn } from "../components/DataTable";
import { Badge, Button, Card } from "../components/primitives";
import { TunnelsFilterBar } from "../components/tunnels/TunnelsFilterBar";
import { EmptyState } from "../components/projects";
import { type TunnelRow } from "../components/projects/overview/TunnelsTab";
import { statusTone } from "../components/projects/statusTone";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";

interface TunnelTableRow extends TunnelRow {
  projectId: string;
  projectName: string;
}

export default function Tunnels() {
  const navigate = useNavigate();

  const seed = useMemo<TunnelTableRow[]>(() => projects.flatMap((p) => Array.from({ length: p.tunnels }).map((_, i) => {
    const host = "localhost";
    const port = 4001 + i;
    return {
      id: `${p.id}-tun-0${i + 1}`,
      projectId: p.id,
      projectName: p.name,
      name: `${p.id}-tun-0${i + 1}`,
      url: `https://${p.id}-tun-0${i + 1}.localy.dev`,
      address: `http://${host}:${port}`,
      host,
      port,
      status: p.status,
    };
  })), []);
  const [tunnels, setTunnels] = useState(seed);

  const [query, setQuery] = useState("");
  const [project, setProject] = useState("All");
  const [status, setStatus] = useState("All");
  const [asc, setAsc] = useState(true);
  const [deleting, setDeleting] = useState<TunnelTableRow | null>(null);

  const projectOptions = useMemo(() => [{ label: "All", value: "All" }, ...projects.map((p) => ({ label: p.name, value: p.id }))], []);
  const statusOptions = useMemo(() => ["All", "Running", "Stopped"].map((s) => ({ label: s, value: s })), []);

  const visible = useMemo(
    () =>
      tunnels
        .filter(
          (t) =>
            (project === "All" || t.projectId === project) &&
            (status === "All" || t.status === status) &&
            `${t.projectName} ${t.name} ${t.url} ${t.address}`.toLowerCase().includes(query.trim().toLowerCase())
        )
        .sort((a, b) => (asc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name))),
    [tunnels, project, status, query, asc]
  );

  const columns: DataTableColumn<TunnelTableRow>[] = [
    { key: "project", header: "Project", cell: (t) => <span className="whitespace-nowrap">{t.projectName}</span> },
    { key: "name", header: "Tunnel", cell: (t) => <span className="font-medium tabular-nums">{t.name}</span> },
    { key: "status", header: "Status", cell: (t) => <Badge tone={statusTone[t.status]}>{t.status}</Badge> },
    { key: "url", header: "Public URL", cell: (t) => <span className="block max-w-52 truncate font-mono text-xs tabular-nums text-muted-foreground">{t.url}</span> },
    { key: "address", header: "Local URL", cell: (t) => <span className="whitespace-nowrap font-mono text-xs tabular-nums text-muted-foreground">{t.address}</span> },
    {
      key: "actions", header: "Actions", headerClassName: "text-right", cellClassName: "text-right", enableHiding: false,
      cell: (t) => (
        <span className="inline-flex items-center gap-1.5">
          <Button
            variant="outline" size="icon"
            onClick={() => navigate("/projects/overview/logs", { state: { project: projects.find((p) => p.id === t.projectId) } })}
            aria-label={`View logs for ${t.name}`} title="Logs"
          >
            <ScrollText className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setTunnels((prev) => prev.map((x) => x.id === t.id ? { ...x, status: "Running" as const } : x))} aria-label={`Restart ${t.name}`} title="Restart"><RotateCcw className="h-4 w-4" /></Button>
          <Button variant="destructive" size="icon" onClick={() => setDeleting(t)} aria-label={`Delete ${t.name}`} title="Delete"><Trash2 className="h-4 w-4" /></Button>
        </span>
      ),
    },
  ];

  return (
    <Page title="Tunnels" subtitle="Every tunnel across all projects.">
      <TunnelsFilterBar
        query={query} onQueryChange={setQuery}
        project={project} onProjectChange={setProject} projects={projectOptions}
        status={status} onStatusChange={setStatus} statuses={statusOptions}
        asc={asc} onToggleSort={() => setAsc((v) => !v)}
      />
      <Card className="overflow-hidden">
        <DataTable
          columns={columns}
          data={visible}
          empty={<div className="p-6"><EmptyState icon={Waypoints} title="No tunnels found" hint="Try a different search term or filter." /></div>}
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
    </Page>
  );
}
