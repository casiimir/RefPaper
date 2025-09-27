"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Assistant } from "@/types/assistant";
import { ButtonLoading } from "@/components/ui/loading";

interface AssistantSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assistant: Assistant | null;
}

export function AssistantSettingsModal({
  open,
  onOpenChange,
  assistant,
}: AssistantSettingsModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    name: assistant?.name || "",
    description: assistant?.description || "",
  });

  const updateAssistant = useMutation(api.assistants.updateAssistant);
  const deleteAssistant = useMutation(api.assistants.deleteAssistantRecord);

  // Update form data when assistant changes
  useEffect(() => {
    if (assistant) {
      setFormData({
        name: assistant.name,
        description: assistant.description || "",
      });
    }
  }, [assistant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!assistant || !formData.name.trim()) {
      return;
    }

    setIsLoading(true);

    try {
      await updateAssistant({
        id: assistant._id as Id<"assistants">,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Error updating assistant:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!assistant) return;

    setIsDeleting(true);

    try {
      await deleteAssistant({
        id: assistant._id as Id<"assistants">,
      });

      onOpenChange(false);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Error deleting assistant:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleInputChange = (
    field: keyof typeof formData,
    value: string
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleClose = () => {
    setShowDeleteConfirm(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open && !!assistant} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assistant Settings</DialogTitle>
          <DialogDescription>
            Manage settings for "{assistant?.name || ''}"
          </DialogDescription>
        </DialogHeader>

        {showDeleteConfirm ? (
          // Delete Confirmation View
          <div className="py-4">
            <Alert className="border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">Are you sure you want to delete this assistant?</div>
                  <div className="text-sm">
                    This action cannot be undone. This will permanently delete:
                  </div>
                  <ul className="text-xs space-y-1 ml-4">
                    <li>• The assistant and all its settings</li>
                    <li>• All chat messages and conversation history</li>
                    <li>• All processed documents and embeddings</li>
                  </ul>
                  <div className="text-sm font-medium mt-3">
                    Assistant: <span className="font-normal">"{assistant?.name || ''}"</span>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          // Settings Form View
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Assistant Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., React Docs Assistant"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this assistant helps with..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  disabled={isLoading}
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-muted-foreground">Documentation URL</Label>
                <div className="px-3 py-2 bg-muted rounded-md text-sm text-muted-foreground">
                  {assistant?.docsUrl || ''}
                </div>
                <p className="text-xs text-muted-foreground">
                  URL cannot be changed after creation
                </p>
              </div>
            </div>
          </form>
        )}

        <DialogFooter className="flex-col gap-4">
          {showDeleteConfirm ? (
            // Delete Confirmation Buttons
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1"
              >
                <ButtonLoading isLoading={isDeleting} loadingText="Deleting...">
                  Delete Forever
                </ButtonLoading>
              </Button>
            </div>
          ) : (
            // Settings Form Buttons
            <>
              <div className="flex gap-2 w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || !formData.name.trim()}
                  className="flex-1"
                >
                  <ButtonLoading isLoading={isLoading} loadingText="Saving...">
                    Save Changes
                  </ButtonLoading>
                </Button>
              </div>

              <div className="w-full border-t border-border my-2"></div>

              <div className="w-full">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isLoading}
                  className="w-full"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Assistant
                </Button>
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}