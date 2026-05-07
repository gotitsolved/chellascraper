"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { JobCreateForm } from "@/components/job-create-form";

export function JobCreateFormDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5">
          <Plus className="h-4 w-4" />
          New Job
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Create New Job</DialogTitle>
        </DialogHeader>
        <JobCreateForm onSubmit={async () => {
          setOpen(false);
          // Trigger page refresh
          window.location.reload();
        }} />
      </DialogContent>
    </Dialog>
  );
}
