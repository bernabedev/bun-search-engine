"use client";

import { useState } from "react";
import { ApiKeyForm } from "./components/api-key-form";
import Dashboard from "./components/dashboard";
import "./index.css";
import { getCookie } from "./lib/api";

export function App() {
  const cookie = getCookie();
  const [showForm, setShowForm] = useState(!cookie);
  return (
    <>
      <div className="fixed inset-0 -z-10 h-full w-full bg-white dark:bg-slate-900 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      <main className="flex flex-col items-center justify-center max-w-6xl mx-auto">
        {showForm && (
          <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Search Engine Dashboard
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Enter your API key to access the dashboard
              </p>
            </div>
            <ApiKeyForm onCompleted={(success) => setShowForm(!success)} />
          </div>
        )}
        {!showForm && <Dashboard />}
      </main>
    </>
  );
}

export default App;
