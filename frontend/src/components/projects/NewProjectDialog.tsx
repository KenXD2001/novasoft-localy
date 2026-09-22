import { useState } from "react";
import { Button, Input, Textarea } from "../primitives";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import type { FilterOption } from "./ProjectsFilterBar";

export interface NewProjectInput {
  name: string;
  category: string;
  description: string;
}

export function NewProjectDialog({ open, onOpenChange, categories, onCreate }: { open: boolean; onOpenChange: (v: boolean) => void; categories: FilterOption[]; onCreate: (input: NewProjectInput) => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const reset = () => { setName(""); setCategory(""); setDescription(""); };
  const close = (v: boolean) => { if (!v) reset(); onOpenChange(v); };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !category) return;
    onCreate({ name: name.trim(), category, description: description.trim() });
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>Spin up a workspace for services and tunnels.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="project-name" className="mb-1.5 block text-[13px] font-medium">Project name</label>
            <Input id="project-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Atlas API" required />
          </div>
          <div>
            <span id="project-category-label" className="mb-1.5 block text-[13px] font-medium">Category</span>
            <Select value={category} onValueChange={(v) => setCategory(v ?? "")}>
              <SelectTrigger aria-labelledby="project-category-label" className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent align="start" alignItemWithTrigger={false}>
                <SelectGroup>
                  {categories.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="project-description" className="mb-1.5 block text-[13px] font-medium">Description</label>
            <Textarea id="project-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this project for?" rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" type="button" onClick={() => close(false)}>Cancel</Button>
            <Button size="sm" disabled={!name.trim() || !category}>Create project</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
