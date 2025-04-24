"use client";

import { useState } from "react";
import { ApiKeyForm } from "./components/api-key-form";
import Dashboard from "./components/dashboard";
import { Card } from "./components/ui/card";
import "./index.css";
import { getCookie } from "./lib/api";

export function App() {
  const cookie = getCookie();
  const [showForm, setShowForm] = useState(!cookie);
  return (
    <>
      <div className="fixed inset-0 -z-10 h-full w-full bg-white dark:bg-slate-900 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      {showForm && (
        <main className="flex flex-col min-h-screen items-center justify-center max-w-6xl mx-auto">
          <Card className="w-full max-w-md p-8 space-y-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Search Engine Dashboard
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Enter your API key to access the dashboard
              </p>
            </div>
            <ApiKeyForm onCompleted={(success) => setShowForm(!success)} />
          </Card>
        </main>
      )}
      {!showForm && (
        <main className="flex flex-col items-center justify-center max-w-7xl mx-auto px-4 py-8">
          <Dashboard />
        </main>
      )}
    </>
  );
}

export default App;
