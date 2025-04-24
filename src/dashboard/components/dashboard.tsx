"use client";

import { useEffect, useState } from "react";
import { getCookie, getIndexes, type Index } from "../lib/api";
import { DashboardHeader } from "./dashboard-header";
import { IndexList } from "./index-list";

export default function Dashboard() {
  const cookie = getCookie();

  if (!cookie) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Search Engine Management</h1>
        <p className="text-gray-600">Please log in to access the dashboard.</p>
      </div>
    );
  }

  const [indexes, setIndexes] = useState<Index[]>([]);

  useEffect(() => {
    const fetchIndexes = async () => {
      try {
        const indexes = await getIndexes(cookie);
        setIndexes(indexes);
      } catch (error) {
        console.error(error);
      }
    };
    fetchIndexes();
  }, []);

  return (
    <>
      <DashboardHeader apiKey={cookie} />
      <div className="mt-8">
        <h1 className="text-2xl font-bold mb-6">Search Engine Management</h1>
        <IndexList indexes={indexes} apiKey={cookie} />
      </div>
    </>
  );
}
