import { AnimatePresence, motion } from "framer-motion";
import { SearchX } from "lucide-react";
import type { Project } from "../../lib/data";
import { cn } from "../../lib/utils";
import { Button, Card } from "../primitives";
import { EmptyState } from "./EmptyState";
import { ProjectCard } from "./ProjectCard";
import type { ProjectsView } from "./ProjectsFilterBar";

export function ProjectsGrid({ projects: visible, total, view, onClearFilters, loading = false }: { projects: Project[]; total: number; view: ProjectsView; onClearFilters: () => void; loading?: boolean }) {
  return (
    <section aria-label="Projects" className="space-y-4">
      <p className="text-[13px] tabular-nums text-muted-foreground">
        {loading ? "Loading projects…" : `Showing ${visible.length} of ${total} projects`}
      </p>

      {loading ? (
        <div className={cn("grid gap-4", view === "grid" ? "sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1")}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-5" aria-hidden="true">
              <div className="animate-pulse space-y-3">
                <div className="h-4 w-2/3 rounded-md bg-muted" />
                <div className="h-3 w-1/3 rounded-md bg-muted" />
                <div className="h-3 w-full rounded-md bg-muted" />
              </div>
            </Card>
          ))}
        </div>
      ) : visible.length > 0 ? (
        <motion.div layout className={cn("grid gap-4", view === "grid" ? "sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1")}>
          <AnimatePresence mode="popLayout">
            {visible.map((p, i) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.25) }}
              >
                <ProjectCard project={p} horizontal={view === "list"} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <EmptyState
          icon={SearchX}
          title="No projects found"
          hint="Try a different search term or clear the filters."
          action={<Button variant="outline" size="sm" onClick={onClearFilters}>Clear filters</Button>}
        />
      )}
    </section>
  );
}
