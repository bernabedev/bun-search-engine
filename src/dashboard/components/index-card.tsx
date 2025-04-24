"use client";

import { Badge } from "@/dashboard/components/ui/badge";
import { Button } from "@/dashboard/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/dashboard/components/ui/card";
import { Database, FileText, Search, Trash2 } from "lucide-react";
import type { Index } from "../lib/api";

interface IndexCardProps {
  index: Index;
  onSearchClick: () => void;
  onManageClick: () => void;
  onDeleteClick: () => void;
}

export function IndexCard({
  index,
  onSearchClick,
  onManageClick,
  onDeleteClick,
}: IndexCardProps) {
  // Calculate field counts for visual indicators
  const fieldCount = index.config.fields.length;
  const storeFieldCount = index.config.storeFields.length;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center mb-1">
          <Database className="h-4 w-4 text-blue-500 mr-2" />
          <CardTitle className="flex items-center justify-between text-lg font-bold">
            <span className="truncate">{index.name}</span>
          </CardTitle>
        </div>
        <div className="flex items-center text-sm text-gray-500 mt-1">
          <span className="font-medium">ID Field:</span>
          <Badge
            variant="outline"
            className="ml-2 bg-blue-50 dark:bg-white/20 dark:border-slate-600 dark:text-blue-100"
          >
            {index.config.idField}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-grow py-2">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-gray-700">
                Indexed Fields
              </p>
              <Badge
                variant="secondary"
                className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100"
              >
                {fieldCount}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-1 mt-1 max-h-16 overflow-y-auto">
              {index.config.fields.map((field) => (
                <Badge
                  key={field}
                  variant="outline"
                  className="bg-gray-50 hover:bg-gray-100 transition-colors dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-700"
                >
                  {field}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-gray-700">Stored Fields</p>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800"
              >
                {storeFieldCount}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-1 mt-1 max-h-16 overflow-y-auto">
              {index.config.storeFields.map((field) => (
                <Badge
                  key={field}
                  variant="outline"
                  className="bg-gray-50 hover:bg-gray-100 transition-colors dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-700"
                >
                  {field}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t dark:border-slate-700 border-slate-100 pt-4 flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={onSearchClick}
          className="min-w-36 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-800 dark:hover:text-blue-100 transition-colors"
        >
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onManageClick}
          className="min-w-36 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-800 dark:hover:text-green-100 transition-colors"
        >
          <FileText className="h-4 w-4 mr-2" />
          Manage
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onDeleteClick}
          className="min-w-36 text-red-500 hover:text-red-700 dark:hover:text-red-100 dark:hover:bg-red-800 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
