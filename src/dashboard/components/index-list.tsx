"use client";

import { DeleteConfirmationModal } from "@/dashboard/components/delete-confirmation-modal";
import { IndexCard } from "@/dashboard/components/index-card";
import { ManageDocumentsModal } from "@/dashboard/components/manage-documents-modal";
import { SearchModal } from "@/dashboard/components/search-modal";
import { useState } from "react";
import type { Index } from "../lib/api";

interface IndexListProps {
  indexes: Index[];
  apiKey: string;
}

export function IndexList({ indexes, apiKey }: IndexListProps) {
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<Index | null>(null);

  const handleSearchClick = (index: Index) => {
    setSelectedIndex(index);
    setSearchModalOpen(true);
  };

  const handleManageClick = (index: Index) => {
    setSelectedIndex(index);
    setManageModalOpen(true);
  };

  const handleDeleteClick = (index: Index) => {
    setSelectedIndex(index);
    setDeleteModalOpen(true);
  };

  return (
    <div>
      {indexes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No indexes found. Create your first index to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2  gap-6">
          {indexes.map((index) => (
            <IndexCard
              key={index.name}
              index={index}
              onSearchClick={() => handleSearchClick(index)}
              onManageClick={() => handleManageClick(index)}
              onDeleteClick={() => handleDeleteClick(index)}
            />
          ))}
        </div>
      )}

      {selectedIndex && (
        <>
          <SearchModal
            isOpen={searchModalOpen}
            onClose={() => setSearchModalOpen(false)}
            index={selectedIndex}
            apiKey={apiKey}
          />
          <ManageDocumentsModal
            isOpen={manageModalOpen}
            onClose={() => setManageModalOpen(false)}
            index={selectedIndex}
            apiKey={apiKey}
          />
          <DeleteConfirmationModal
            isOpen={deleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            index={selectedIndex}
            apiKey={apiKey}
          />
        </>
      )}
    </div>
  );
}
