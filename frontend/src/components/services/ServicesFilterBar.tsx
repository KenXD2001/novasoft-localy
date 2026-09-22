import { ArrowUpDown, Search } from "lucide-react";
import { Button, Card, Input } from "../primitives";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import type { FilterOption } from "../projects/ProjectsFilterBar";

interface ServicesFilterBarProps {
  query: string;
  onQueryChange: (v: string) => void;
  project: string;
  onProjectChange: (v: string) => void;
  projects: FilterOption[];
  type: string;
  onTypeChange: (v: string) => void;
  types: FilterOption[];
  status: string;
  onStatusChange: (v: string) => void;
  statuses: FilterOption[];
  asc: boolean;
  onToggleSort: () => void;
}

export function ServicesFilterBar({
  query, onQueryChange,
  project, onProjectChange, projects,
  type, onTypeChange, types,
  status, onStatusChange, statuses,
  asc, onToggleSort,
}: ServicesFilterBarProps) {
  return (
    <Card className="flex flex-col gap-3 p-4 lg:flex-row lg:items-end">
      <div className="flex-1">
        <label htmlFor="services-search" className="mb-1.5 block text-[13px] font-medium">Search</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="services-search" value={query} onChange={(e) => onQueryChange(e.target.value)} placeholder="Search services…" className="pl-9" />
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <span id="services-project-label" className="mb-1.5 block text-[13px] font-medium">Project</span>
          <Select value={project} onValueChange={(v) => onProjectChange(v ?? "All")}>
            <SelectTrigger aria-labelledby="services-project-label" className="w-full sm:w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start" alignItemWithTrigger={false}>
              <SelectGroup>
                {projects.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div>
          <span id="services-type-label" className="mb-1.5 block text-[13px] font-medium">Type</span>
          <Select value={type} onValueChange={(v) => onTypeChange(v ?? "All")}>
            <SelectTrigger aria-labelledby="services-type-label" className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start" alignItemWithTrigger={false}>
              <SelectGroup>
                {types.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div>
          <span id="services-status-label" className="mb-1.5 block text-[13px] font-medium">Status</span>
          <Select value={status} onValueChange={(v) => onStatusChange(v ?? "All")}>
            <SelectTrigger aria-labelledby="services-status-label" className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start" alignItemWithTrigger={false}>
              <SelectGroup>
                {statuses.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <Button variant="ghost" size="icon" onClick={onToggleSort} aria-label="Toggle sort direction" title={asc ? "Name A–Z" : "Name Z–A"}>
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
