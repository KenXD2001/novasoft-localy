import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Page } from "../components/page";
import { Button } from "../components/primitives";
import { NewProjectDialog, ProjectsFilterBar, ProjectsGrid, type NewProjectInput } from "../components/projects";
import { ApiError, createProjectApi, getProjectsApi, type Project } from "../lib/api";
import { useDebouncedValue } from "../lib/useDebouncedValue";

const STATUSES = [
  { label: "All", value: "All" },
  { label: "Running", value: "Running" },
  { label: "Stopped", value: "Stopped" },
];

const SEARCH_DEBOUNCE_MS = 400;

// Fixed category options for the New Project dialog.
const PROJECT_CATEGORY_OPTIONS = [
  { label: "FRONTEND", value: "FRONTEND" },
  { label: "BACKEND", value: "BACKEND" },
  { label: "SERVICE", value: "SERVICE" },
  { label: "FULL STACK", value: "FULL STACK" },
];

export default function Projects() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const [status, setStatus] = useState("All");
  const [category, setCategory] = useState("All");
  const [asc, setAsc] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [open, setOpen] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProjectsApi({
        search: debouncedQuery.trim(),
        status,
        category,
        sort: asc ? "asc" : "desc",
      });
      setProjects(data.projects);
      setTotal(data.total);
      setCategories(data.categories);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, status, category, asc]);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  const resetFilters = () => { setQuery(""); setStatus("All"); setCategory("All"); };

  const createProject = async (input: NewProjectInput) => {
    try {
      await createProjectApi(input);
      toast.success(`Project "${input.name}" created`);
      setOpen(false);
      await fetchProjects();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create project.");
    }
  };

  return (
    <Page
      title="Projects"
      subtitle="Spin up services and tunnels for every environment."
      actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />New Project</Button>}
    >
      <ProjectsFilterBar
        query={query} onQueryChange={setQuery}
        status={status} onStatusChange={setStatus} statuses={STATUSES}
        category={category} onCategoryChange={setCategory} categories={[{ label: "All", value: "All" }, ...categories.map((c) => ({ label: c, value: c }))]}
        asc={asc} onToggleSort={() => setAsc((v) => !v)}
        view={view} onViewChange={setView}
      />
      <ProjectsGrid projects={projects} total={total} view={view} onClearFilters={resetFilters} loading={loading} />
      <NewProjectDialog
        open={open}
        onOpenChange={setOpen}
        categories={PROJECT_CATEGORY_OPTIONS}
        onCreate={createProject}
      />
    </Page>
  );
}
