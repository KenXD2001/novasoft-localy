import { useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Settings2 } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./primitives";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  /** Set false to always keep the column visible. Defaults to true. */
  enableHiding?: boolean;
}

interface DataTableProps<T extends { id: string | number }> {
  columns: DataTableColumn<T>[];
  data: T[];
  density?: "comfortable" | "compact";
  pagination?: boolean;
  pageSize?: number;
  hiddenColumns?: string[];
  empty?: ReactNode;
}

// Column visibility toggle. Pair with DataTable's hiddenColumns prop.
export function ColumnVisibilityMenu<T>({ columns, hidden, onToggle }: { columns: DataTableColumn<T>[]; hidden: string[]; onToggle: (key: string) => void }) {
  const hideable = columns.filter((c) => c.enableHiding !== false);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
        <Settings2 className="h-4 w-4" />View
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
          {hideable.map((c) => (
            <DropdownMenuCheckboxItem key={c.key} checked={!hidden.includes(c.key)} onCheckedChange={() => onToggle(c.key)}>
              {typeof c.header === "string" ? c.header : c.key}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Generic table. Pagination is built in — pass pagination={false} to render all rows.
export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  density = "comfortable",
  pagination = true,
  pageSize = 8,
  hiddenColumns = [],
  empty,
}: DataTableProps<T>) {
  const [page, setPage] = useState(0);
  const [prevData, setPrevData] = useState(data);
  if (prevData !== data) {
    setPrevData(data);
    setPage(0);
  }
  const visibleColumns = columns.filter((c) => c.enableHiding === false || !hiddenColumns.includes(c.key));
  const pageCount = Math.max(1, Math.ceil(data.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const rows = pagination ? data.slice(safePage * pageSize, safePage * pageSize + pageSize) : data;

  const cellPad = density === "compact" ? "py-1.5" : "py-3";

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-muted-foreground">
              {visibleColumns.map((c) => (
                <th key={c.key} className={cn("whitespace-nowrap px-4 py-2.5 font-medium", c.headerClassName)}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40">
                {visibleColumns.map((c) => (
                  <td key={c.key} className={cn("px-4", cellPad, c.cellClassName)}>{c.cell(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && empty}

      {pagination && pageCount > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
          <p className="text-xs tabular-nums text-muted-foreground">
            Showing {safePage * pageSize + 1}–{Math.min(safePage * pageSize + pageSize, data.length)} of {data.length}
          </p>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={safePage === 0} aria-label="Previous page">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-1 text-xs tabular-nums text-muted-foreground">Page {safePage + 1} of {pageCount}</span>
            <Button variant="ghost" size="icon" onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} disabled={safePage >= pageCount - 1} aria-label="Next page">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
