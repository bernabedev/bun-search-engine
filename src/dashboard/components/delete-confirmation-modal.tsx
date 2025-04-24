"use client";

import { Alert, AlertDescription } from "@/dashboard/components/ui/alert";
import { Button } from "@/dashboard/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/dashboard/components/ui/dialog";
import { Input } from "@/dashboard/components/ui/input";
import { AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { deleteIndex, type Index } from "../lib/api";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  index: Index;
  apiKey: string;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  index,
  apiKey,
}: DeleteConfirmationModalProps) {
  const [confirmation, setConfirmation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (confirmation !== index.name) {
      setError(`Please type "${index.name}" to confirm deletion`);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await deleteIndex(apiKey, index.name);
      onClose();
      // TODO: refresh index list
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete index");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Index</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to delete the index{" "}
            <span className="font-semibold">&apos;{index.name}&apos;</span>?
            This action cannot be undone.
          </p>

          <div className="space-y-2">
            <p className="text-sm">
              Type <span className="font-semibold">{index.name}</span> to
              confirm:
            </p>
            <Input
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder={`Type ${index.name} to confirm`}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Index"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
