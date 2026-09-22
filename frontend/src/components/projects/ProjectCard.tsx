import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Globe, Layers, Server, Waypoints, type LucideIcon } from "lucide-react";
import type { Project } from "../../lib/data";
import { cn } from "../../lib/utils";
import { Badge, Button, Card } from "../primitives";
import { statusTone } from "./statusTone";

const categoryIcon: Record<string, LucideIcon> = {
  Backend: Server,
  Frontend: Globe,
  Fullstack: Layers,
};

export function ProjectCard({ project, horizontal = false }: { project: Project; horizontal?: boolean }) {
  const navigate = useNavigate();
  const CategoryGlyph = categoryIcon[project.category] ?? Layers;
  return (
    <Card
      className={cn(
        "group flex h-full flex-col gap-4 p-5 transition-all duration-300",
        "hover:border-primary/40 hover:shadow-xl hover:shadow-primary/[0.07]",
        horizontal && "md:flex-row md:items-center md:gap-6"
      )}
    >
      <div className={cn("flex items-center gap-3", horizontal && "md:w-60 md:shrink-0")}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
          <CategoryGlyph className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold tracking-tight">{project.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{project.category}</p>
        </div>
        <Badge tone={statusTone[project.status]} className="shrink-0">{project.status}</Badge>
      </div>

      <div className={cn("flex items-center gap-5 border-t border-border/60 pt-4 text-[13px]", horizontal && "md:flex-1 md:border-t-0 md:pt-0")}>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Layers className="h-4 w-4" />
          <strong className="font-semibold tabular-nums text-foreground">{project.services}</strong> Services
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Waypoints className="h-4 w-4" />
          <strong className="font-semibold tabular-nums text-foreground">{project.tunnels}</strong> Tunnels
        </span>
      </div>

      {!horizontal && <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{project.description}</p>}

      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate("/projects/overview/details", { state: { project } })}
        className={cn(
          !horizontal && "w-full",
          horizontal && "md:ml-auto",
          "transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
        )}
      >
        Open
        <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </Button>
    </Card>
  );
}
