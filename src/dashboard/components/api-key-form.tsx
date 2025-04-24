"use client";

import type React from "react";

import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { getIndexes } from "../lib/api";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

type Props = {
  onCompleted: (success: boolean) => void;
};

export function ApiKeyForm({ onCompleted }: Props) {
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // In a real app, you would validate the API key with your backend
      // This is a simplified example
      if (!apiKey.trim()) {
        throw new Error("API key is required");
      }

      // Simulate API validation delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Store API key in cookie
      document.cookie = `api-key=${apiKey}; path=/; max-age=${
        60 * 60 * 24 * 7
      }`; // 1 week

      const res = await getIndexes(apiKey);
      if (!res) {
        throw new Error("Failed to authenticate");
      }

      onCompleted(true);

      // Refresh the page to trigger the redirect in the server component
      // TODO: Implement proper authentication flow
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to authenticate");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Input
          id="apiKey"
          type="password"
          placeholder="Enter your API key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full"
          disabled={isLoading}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Authenticating..." : "Authenticate"}
      </Button>
    </form>
  );
}
