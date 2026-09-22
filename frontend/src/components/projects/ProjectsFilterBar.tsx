import { ArrowUpDown, LayoutGrid, List, Search } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button, Card, Input } from "../primitives";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export interface FilterOption {
  label: string;
  value: string;
}

export type ProjectsView = "grid" | "list";

interface ProjectsFilterBarProps {
  query: string;
  onQueryChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
  statuses: FilterOption[];
  category: string;
  onCategoryChange: (v: string) => void;
  categories: FilterOption[];
  asc: boolean;
  onToggleSort: () => void;
  view: ProjectsView;
  onViewChange: (v: ProjectsView) => void;
}

export function ProjectsFilterBar({
  query, onQueryChange,
  status, onStatusChange, statuses,
  category, onCategoryChange, categories,
  asc, onToggleSort,
  view, onViewChange,
}: ProjectsFilterBarProps) {
  return (
    <Card className="flex flex-col gap-3 p-4 lg:flex-row lg:items-end">
      <div className="flex-1">
        <label htmlFor="projects-search" className="mb-1.5 block text-[13px] font-medium">Search</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="projects-search" value={query} onChange={(e) => onQueryChange(e.target.value)} placeholder="Search projects…" className="pl-9" />
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <span id="projects-status-label" className="mb-1.5 block text-[13px] font-medium">Status</span>
          {/* no `items` on Root: @base-ui 1.8 also renders data-items itself, causing duplicate [object Object] keys + object-child crash. Labels === values so Value output is identical. */}
          <Select value={status} onValueChange={(v) => onStatusChange(v ?? "All")}>
            <SelectTrigger aria-labelledby="projects-status-label" className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start" alignItemWithTrigger={false}>
              <SelectGroup>
                {statuses.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div>
          <span id="projects-category-label" className="mb-1.5 block text-[13px] font-medium">Category</span>
          <Select value={category} onValueChange={(v) => onCategoryChange(v ?? "All")}>
            <SelectTrigger aria-labelledby="projects-category-label" className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start" alignItemWithTrigger={false}>
              <SelectGroup>
                {categories.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto flex items-center gap-1.5 lg:ml-0">
          <Button variant="ghost" size="icon" onClick={onToggleSort} aria-label="Toggle sort direction" title={asc ? "Name A–Z" : "Name Z–A"}>
            <ArrowUpDown className="h-4 w-4" />
          </Button>
          <div className="flex items-center rounded-xl border border-border p-0.5">
            {([{ v: "list", Icon: List, label: "List view" }, { v: "grid", Icon: LayoutGrid, label: "Card view" }] as const).map(({ v, Icon, label }) => (
              <button key={v} onClick={() => onViewChange(v)} aria-label={label} title={label} className={cn("rounded-lg p-2", view === v ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}>
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
