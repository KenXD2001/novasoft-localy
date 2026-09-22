import { useId, useMemo, useState } from "react";
import { ScrollText, Search, Trash2 } from "lucide-react";
import { cn } from "../lib/utils";
import { Button, Card, Input } from "./primitives";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { EmptyState } from "./projects/EmptyState";
import type { FilterOption } from "./projects/ProjectsFilterBar";

export type LogCategory = "system" | "service" | "tunnel";
export type LogType = "info" | "warn" | "error";

export interface LogRow {
  id: string | number;
  date: string;
  time: string;
  category: LogCategory;
  type: LogType;
  message: string;
}

const typeTone: Record<LogType, string> = {
  info: "text-muted-foreground",
  warn: "text-amber-500",
  error: "text-rose-500",
};

const categoryOptions: FilterOption[] = [
  { label: "All", value: "All" },
  { label: "System", value: "system" },
  { label: "Service", value: "service" },
  { label: "Tunnel", value: "tunnel" },
];

const typeOptions: FilterOption[] = [
  { label: "All", value: "All" },
  { label: "Info", value: "info" },
  { label: "Warn", value: "warn" },
  { label: "Error", value: "error" },
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

// Reusable log viewer. Same header pattern as the services table:
// search on the left, category + type filters + clear action on the right.
export function DataLog({ logs, onClearAll, searchPlaceholder = "Search logs…" }: { logs: LogRow[]; onClearAll?: () => void; searchPlaceholder?: string }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [logType, setLogType] = useState("All");
  const uid = useId();
  const searchId = `${uid}-search`;
  const categoryId = `${uid}-category`;
  const typeId = `${uid}-type`;

  const visible = useMemo(() => logs.filter(
    (l) =>
      (category === "All" || l.category === category) &&
      (logType === "All" || l.type === logType) &&
      `${l.date} ${l.time} ${l.category} ${l.type} ${l.message}`.toLowerCase().includes(query.trim().toLowerCase())
  ), [logs, category, logType, query]);

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-end">
        <div className="flex-1">
          <label htmlFor={searchId} className="mb-1.5 block text-[13px] font-medium">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id={searchId} value={query} onChange={(e) => setQuery(e.target.value)} placeholder={searchPlaceholder} className="pl-9" />
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-2.5">
          <FilterSelect label="Category" labelId={categoryId} value={category} onChange={setCategory} options={categoryOptions} className="w-full sm:w-32" />
          <FilterSelect label="Type" labelId={typeId} value={logType} onChange={setLogType} options={typeOptions} className="w-full sm:w-32" />
          <Button variant="outline" onClick={onClearAll} disabled={logs.length === 0}><Trash2 className="h-4 w-4" />Clear All</Button>
        </div>
      </div>
      {visible.length === 0 ? (
        <div className="p-6"><EmptyState icon={ScrollText} title="No logs found" hint="Try a different search term or filter." /></div>
      ) : (
        <div className="space-y-0 overflow-x-auto p-2 font-mono text-xs leading-6">
          <p className="flex gap-3 whitespace-nowrap px-3 pb-1 pt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
            <span className="w-24 shrink-0 tabular-nums">Date</span>
            <span className="w-16 shrink-0 tabular-nums">Time</span>
            <span className="w-14 shrink-0">Category</span>
            <span className="w-11 shrink-0">Type</span>
            <span className="shrink-0">Log</span>
          </p>
          {visible.map((l) => (
            <p key={l.id} className="flex gap-3 whitespace-nowrap rounded-md px-3 py-0.5 hover:bg-muted/60">
              <span className="w-24 shrink-0 tabular-nums text-muted-foreground">{l.date}</span>
              <span className="w-16 shrink-0 tabular-nums text-muted-foreground">{l.time}</span>
              <span className="w-14 shrink-0 capitalize text-muted-foreground">{l.category}</span>
              <span className={cn("w-11 shrink-0 font-semibold uppercase", typeTone[l.type])}>{l.type}</span>
              <span className="truncate text-foreground/90">{l.message}</span>
            </p>
          ))}
        </div>
      )}
    </Card>
  );
}
