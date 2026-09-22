import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { projects } from "../lib/data";
import { Page } from "../components/page";
import { Button } from "../components/primitives";
import { NewProjectDialog, ProjectsFilterBar, ProjectsGrid, type NewProjectInput } from "../components/projects";

export default function Projects() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [category, setCategory] = useState("All");
  const [asc, setAsc] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [open, setOpen] = useState(false);
  const [list, setList] = useState(projects);

  const statuses = useMemo(() => ["All", ...new Set(projects.map((p) => p.status))].map((s) => ({ label: s, value: s })), []);
  const categories = useMemo(() => ["All", ...new Set(projects.map((p) => p.category))].map((c) => ({ label: c, value: c })), []);
  const resetFilters = () => { setQuery(""); setStatus("All"); setCategory("All"); };

  const createProject = (input: NewProjectInput) => {
    const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    setList((prev) => [
      { id: `${slug}-${Date.now()}`, name: input.name, category: input.category, status: "Stopped" as const, description: input.description || "No description yet.", services: 0, tunnels: 0 },
      ...prev,
    ]);
  };

  const visible = useMemo(
    () =>
      list
        .filter(
          (p) =>
            (status === "All" || p.status === status) &&
            (category === "All" || p.category === category) &&
            `${p.name} ${p.description}`.toLowerCase().includes(query.trim().toLowerCase())
        )
        .sort((a, b) => (asc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name))),
    [query, status, category, asc, list]
  );

  return (
    <Page
      title="Projects"
      subtitle="Spin up services and tunnels for every environment."
      actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />New Project</Button>}
    >
      <ProjectsFilterBar
        query={query} onQueryChange={setQuery}
        status={status} onStatusChange={setStatus} statuses={statuses}
        category={category} onCategoryChange={setCategory} categories={categories}
        asc={asc} onToggleSort={() => setAsc((v) => !v)}
        view={view} onViewChange={setView}
      />
      <ProjectsGrid projects={visible} total={list.length} view={view} onClearFilters={resetFilters} />
      <NewProjectDialog
        open={open}
        onOpenChange={setOpen}
        categories={categories.filter((c) => c.value !== "All")}
        onCreate={createProject}
      />
    </Page>
  );
}
