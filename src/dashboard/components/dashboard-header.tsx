"use client";

import {
  Copy,
  HelpCircle,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu.tsx";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface DashboardHeaderProps {
  apiKey: string;
  userName?: string;
}

export function DashboardHeader({
  apiKey,
  userName = "User",
}: DashboardHeaderProps) {
  const maskedApiKey = `${apiKey.substring(0, 4)}...${apiKey.substring(
    apiKey.length - 4
  )}`;

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check if user has a theme preference stored
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setIsDarkMode(!isDarkMode);
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    // Clear the API key cookie
    document.cookie = "api-key=; path=/; max-age=0";
    location.reload();
  };

  return (
    <header className="bg-white/80 w-full dark:bg-slate-800/80 border border-gray-100 rounded-full dark:border-slate-700 sticky top-4 z-10 backdrop-blur">
      <div className="w-full px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="rounded-full p-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-700">
            <img
              src="/public/images/bunflare.webp"
              alt="Bunflare Logo"
              className="w-8 h-8"
            />
          </div>
          <h1 className="text-xl font-bold">Bunflare</h1>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Right Side Controls */}
        <div className="hidden md:flex items-center space-x-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                  <span className="text-sm text-gray-600 dark:text-gray-300 mr-2">
                    API Key: {maskedApiKey}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    onClick={copyApiKey}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {copied ? "Copied!" : "Copy API Key"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="rounded-full"
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5 text-gray-400 hover:text-yellow-400" />
            ) : (
              <Moon className="h-5 w-5 text-gray-600 hover:text-blue-800" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative rounded-full h-8 w-8 bg-gray-200 dark:bg-gray-700"
              >
                <span className="font-medium text-sm">
                  {userName.charAt(0)}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{userName}</p>
                <p
                  className="text-xs text-gray-500 dark:text-gray-400 truncate"
                  title={apiKey}
                >
                  {maskedApiKey}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Help & Support</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-800 px-4 py-3 shadow-lg">
          <nav className="flex flex-col space-y-3">
            <a
              href="/dashboard"
              className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
            >
              Dashboard
            </a>
            <a
              href="/indexes"
              className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400"
            >
              Indexes
            </a>
            <a
              href="/analytics"
              className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400"
            >
              Analytics
            </a>
            <a
              href="/documentation"
              className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400"
            >
              Docs
            </a>
          </nav>

          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300 mr-2">
                  API Key: {maskedApiKey}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={copyApiKey}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <Button variant="ghost" size="sm" onClick={toggleDarkMode}>
                {isDarkMode ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleLogout}
              className="mt-3 w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
