import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RefreshCw, Search, Terminal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../../lib/utils";
import { Badge, Button, Input } from "../../primitives";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { statusTone } from "../statusTone";
import { ApiError, clearServiceLogsApi, getServiceLogsApi, type ServiceLogDTO } from "../../../lib/api";
import type { ServiceRow } from "./ServicesTab";

const ANSI_RE = new RegExp("\u001B\\[[0-9;?]*[a-zA-Z]|\u001B\\][^\u0007\u001B]*(?:\u0007|\u001B\\\\)", "g");
const POLL_MS = 3000;
const LOG_LIMIT = 100;

const levelTone: Record<string, string> = {
  error: "text-rose-400",
  info: "text-sky-400",
};

interface LogLine {
  key: string;
  time: string;
  title: string;
  level: string;
  source: string;
  text: string;
}

function toLogLines(logs: ServiceLogDTO[]): LogLine[] {
  const lines: LogLine[] = [];
  for (const log of [...logs].reverse()) {
    const time = new Date(log.createdAt);
    const stamp = Number.isNaN(time.getTime())
      ? "--:--:--"
      : time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    for (const [i, raw] of log.logText.replace(ANSI_RE, "").split(/\r?\n/).entries()) {
      const text = raw.replace(/\s+$/, "");
      if (text === "") continue;
      lines.push({ key: `${log.id}-${i}`, time: stamp, title: log.createdAt, level: log.level, source: log.source, text });
    }
  }
  return lines;
}

function Detail({ label, children, mono = false }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className={cn("mt-0.5 truncate text-[13px]", mono && "font-mono text-xs")}>{children}</div>
    </div>
  );
}

export default function ServiceViewDialog({ service, onOpenChange }: {
  service: ServiceRow | null;
  onOpenChange: (v: boolean) => void;
}) {
  const [logs, setLogs] = useState<ServiceLogDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(true);
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("All");
  const [stick, setStick] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const paneRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef(live);
  liveRef.current = live;

  const fetchLogs = useCallback(async (silent: boolean) => {
    if (!service) return;
    if (!silent) setLoading(true);
    try {
      const data = await getServiceLogsApi(service.id, LOG_LIMIT);
      setLogs(data.logs);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      if (!silent) setError(err instanceof ApiError ? err.message : "Failed to load logs.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [service?.id]);

  useEffect(() => {
    if (!service) return;
    setLogs([]);
    setTotal(0);
    setError(null);
    setLive(true);
    setStick(true);
    void fetchLogs(false);
    const timer = setInterval(() => {
      if (!document.hidden && liveRef.current) void fetchLogs(true);
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [service?.id, fetchLogs]);

  const lines = useMemo(() => {
    const q = query.trim().toLowerCase();
    return toLogLines(logs).filter(
      (l) =>
        (level === "All" || l.level === level) &&
        (q === "" || `${l.time} ${l.level} ${l.source} ${l.text}`.toLowerCase().includes(q)),
    );
  }, [logs, level, query]);

  useEffect(() => {
    const el = paneRef.current;
    if (el && live && stick) el.scrollTop = el.scrollHeight;
  }, [lines, live, stick]);

  const onScroll = () => {
    const el = paneRef.current;
    if (el) setStick(el.scrollHeight - el.scrollTop - el.clientHeight < 48);
  };

  const handleClear = async () => {
    if (!service || isClearing) return;
    setIsClearing(true);
    try {
      const data = await clearServiceLogsApi(service.id);
      toast.success(data.message);
      await fetchLogs(true);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to clear logs.");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Dialog open={service !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2.5">
            <span className="truncate">{service?.name}</span>
            {service && <Badge tone={statusTone[service.status]}>{service.status}</Badge>}
          </DialogTitle>
          <DialogDescription>Service details and live output.</DialogDescription>
        </DialogHeader>

        {service && (
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-muted/40 p-4 sm:grid-cols-2">
            <Detail label="Type"><Badge tone="neutral">{service.type}</Badge></Detail>
            <Detail label="Health">
              {typeof service.health === "string"
                ? <span className="capitalize">{service.health}</span>
                : (service.health ?? "—")}
            </Detail>
            <Detail label="Local address" mono>{service.address}</Detail>
            <Detail label="Public URL" mono>{service.url || "—"}</Detail>
            <Detail label="Service directory" mono>{service.serviceDirectory || "—"}</Detail>
            <Detail label="Run command" mono>{service.runCommand || "—"}</Detail>
          </div>
        )}

        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-[13px] font-medium">
              <span className={cn("h-2 w-2 rounded-full", live ? "animate-pulse bg-emerald-500" : "bg-muted-foreground")} />
              {live ? "Live logs" : "Paused"}
              <span className="font-normal text-muted-foreground">· {total} lines</span>
            </span>
            <div className="ml-auto flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter logs…" className="h-8 w-40 pl-8 text-xs" />
              </div>
              <Select value={level} onValueChange={(v) => setLevel(v ?? "All")}>
                <SelectTrigger aria-label="Log level" className="h-8 w-24 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end" alignItemWithTrigger={false}>
                  <SelectGroup>
                    {["All", "info", "error"].map((l) => <SelectItem key={l} value={l}>{l === "All" ? "All" : l}</SelectItem>)}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => setLive((v) => !v)} aria-label={live ? "Pause live logs" : "Resume live logs"} title={live ? "Pause" : "Resume"} className="h-8 w-8">
                {live ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </Button>
              <Button variant="outline" size="icon" onClick={() => fetchLogs(false)} aria-label="Refresh logs" title="Refresh" className="h-8 w-8">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleClear} disabled={isClearing || total === 0} aria-label="Clear logs" title="Clear logs" className="h-8 w-8">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div
            ref={paneRef}
            onScroll={onScroll}
            className="h-72 overflow-y-auto rounded-xl bg-[#0b0d1a] p-3 font-mono text-xs leading-6"
          >
            {loading && lines.length === 0 ? (
              <p className="text-zinc-500">Loading logs…</p>
            ) : error && lines.length === 0 ? (
              <p className="text-rose-400">{error}</p>
            ) : lines.length === 0 ? (
              <p className="flex items-center gap-2 text-zinc-500"><Terminal className="h-4 w-4" />No logs yet — start the service to stream output.</p>
            ) : (
              lines.map((l) => (
                <p key={l.key} className="flex gap-2.5 whitespace-pre-wrap break-all hover:bg-white/5">
                  <span title={l.title} className="shrink-0 tabular-nums text-zinc-500">{l.time}</span>
                  <span className={cn("w-11 shrink-0 font-semibold uppercase", levelTone[l.level] ?? "text-zinc-400")}>{l.level}</span>
                  <span className="w-14 shrink-0 text-zinc-500">{l.source}</span>
                  <span className="min-w-0 flex-1 text-zinc-200">{l.text}</span>
                </p>
              ))
            )}
          </div>
          {!stick && (
            <Button variant="outline" size="sm" onClick={() => { setStick(true); if (paneRef.current) paneRef.current.scrollTop = paneRef.current.scrollHeight; }}>
              Jump to latest
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
