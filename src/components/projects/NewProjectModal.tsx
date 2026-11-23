"use client";

import { useState } from "react";
import { FolderPlus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { useProjects } from "@/components/providers/ProjectsProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { projectTypeLabel } from "@/lib/mock";
import { validatePositiveNumber, validateRequired } from "@/lib/validation";
import { sleep } from "@/lib/utils";
import type { Project } from "@/lib/types";

interface NewProjectModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (project: Project) => void;
}

/** Create-project dialog shared by the Dashboard and Projects pages. */
export function NewProjectModal({ open, onClose, onCreated }: NewProjectModalProps) {
  if (!open) return null;
  return <NewProjectForm onClose={onClose} onCreated={onCreated} />;
}

function NewProjectForm({ onClose, onCreated }: Omit<NewProjectModalProps, "open">) {
  const { createProject } = useProjects();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [type, setType] = useState<Project["type"]>("civic");
  const [width, setWidth] = useState("30");
  const [height, setHeight] = useState("20");
  const [spaces, setSpaces] = useState("6");
  const [description, setDescription] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const spacesNum = Number(spaces);
  const errors = {
    name: validateRequired(name, "Project name"),
    width: validatePositiveNumber(width, "Plot width", 500),
    height: validatePositiveNumber(height, "Plot height", 500),
    spaces:
      spaces.trim() === "" || !Number.isInteger(spacesNum) || spacesNum < 1 || spacesNum > 60
        ? "Number of spaces must be a whole number between 1 and 60."
        : null,
  };
  const show = (k: keyof typeof errors) => (touched[k] ? errors[k] : null);
  const touch = (k: string) => setTouched((t) => ({ ...t, [k]: true }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, width: true, height: true, spaces: true });
    if (Object.values(errors).some(Boolean)) return;
    setSubmitting(true);
    await sleep(600);
    const project = createProject({
      name,
      type,
      plotWidth: Number(width),
      plotHeight: Number(height),
      spaces: spacesNum,
      description,
    });
    setSubmitting(false);
    toast({ kind: "success", title: "Project created", description: `${project.name} was added as a draft.` });
    onCreated?.(project);
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="New Project"
      description="Define the plot and the number of required spaces. You can refine rooms and adjacency in the Space Planner."
      size="md"
      locked={submitting}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="new-project-form" loading={submitting} leftIcon={<FolderPlus className="h-4 w-4" />}>
            Create Project
          </Button>
        </>
      }
    >
      <form id="new-project-form" className="flex flex-col gap-4" onSubmit={submit} noValidate>
        <Input
          label="Project name"
          placeholder="e.g. Community Centre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => touch("name")}
          error={show("name")}
          required
          data-autofocus
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Project type"
            value={type}
            onChange={(e) => setType(e.target.value as Project["type"])}
            options={Object.entries(projectTypeLabel).map(([value, label]) => ({ value, label }))}
          />
          <Input
            label="Number of spaces"
            type="number"
            min={1}
            max={60}
            step={1}
            value={spaces}
            onChange={(e) => setSpaces(e.target.value)}
            onBlur={() => touch("spaces")}
            error={show("spaces")}
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Plot width"
            type="number"
            min={1}
            max={500}
            step="0.5"
            suffix="m"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            onBlur={() => touch("width")}
            error={show("width")}
            required
          />
          <Input
            label="Plot height"
            type="number"
            min={1}
            max={500}
            step="0.5"
            suffix="m"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            onBlur={() => touch("height")}
            error={show("height")}
            required
          />
        </div>
        <Textarea
          label="Description"
          placeholder="Short brief: spaces, relationships and constraints."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          hint="Optional."
        />
      </form>
    </Modal>
  );
}
