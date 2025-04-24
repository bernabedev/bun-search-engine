"use client";

import type React from "react";

import { Alert, AlertDescription } from "@/dashboard/components/ui/alert";
import { Button } from "@/dashboard/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/dashboard/components/ui/dialog";
import { Input } from "@/dashboard/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/dashboard/components/ui/tabs";
import { Textarea } from "@/dashboard/components/ui/textarea";
import { updateIndex, type Index } from "@/dashboard/lib/api";
import { AlertCircle, CheckCircle, Loader2, Upload } from "lucide-react";
import { useState } from "react";

interface ManageDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  index: Index;
  apiKey: string;
}

export function ManageDocumentsModal({
  isOpen,
  onClose,
  index,
  apiKey,
}: ManageDocumentsModalProps) {
  const [jsonData, setJsonData] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);

      // Read file content
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          // Validate JSON
          JSON.parse(content);
          setJsonData(content);
          setError("");
        } catch (err) {
          setError("Invalid JSON file. Please upload a valid JSON array.");
        }
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // Validate JSON
      let documents;
      try {
        documents = JSON.parse(jsonData);
        if (!Array.isArray(documents)) {
          throw new Error("Data must be a JSON array of documents");
        }
      } catch (err) {
        throw new Error(
          "Invalid JSON format. Please provide a valid JSON array."
        );
      }

      // Update index with documents
      await updateIndex(apiKey, index.name, documents);
      setSuccess(`Successfully indexed ${documents.length} documents`);

      // Clear form
      setJsonData("");
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update index");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Manage Documents in &apos;{index.name}&apos;
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Index Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-md">
              <div>
                <p className="text-sm font-medium text-gray-500">ID Field</p>
                <p className="text-sm">{index.config.idField}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Indexed Fields
                </p>
                <p className="text-sm">{index.config.fields.join(", ")}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Stored Fields
                </p>
                <p className="text-sm">{index.config.storeFields.join(", ")}</p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="paste">
            <TabsList className="w-full">
              <TabsTrigger value="paste" className="flex-1">
                Paste JSON
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex-1">
                Upload File
              </TabsTrigger>
            </TabsList>

            <TabsContent value="paste" className="space-y-4 mt-4">
              <Textarea
                placeholder={`Paste JSON array of documents here...\n[\n  {\n    "id": "1",\n    "name": "Product name",\n    ...\n  }\n]`}
                className="min-h-[200px] font-mono text-sm"
                value={jsonData}
                onChange={(e) => setJsonData(e.target.value)}
              />
            </TabsContent>

            <TabsContent value="upload" className="space-y-4 mt-4">
              <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  Upload a JSON file containing an array of documents
                </p>
                <Input
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="mt-4 mx-auto max-w-xs"
                />
                {file && (
                  <p className="mt-2 text-sm text-gray-500">
                    Selected file: {file.name}
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert
              variant="default"
              className="bg-green-50 text-green-800 border-green-200"
            >
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !jsonData.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Indexing...
                </>
              ) : (
                "Index Documents"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
