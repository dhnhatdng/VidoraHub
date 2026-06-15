"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Wallet, LogOut, ChevronDown, Play, PlusCircle, ExternalLink } from "lucide-react";

export function Navbar() {
  const { connect, disconnect, connected, account, wallets } = useWallet();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch issues by only rendering client-side content after mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  const petraWallet = wallets.find((w) => w.name === "Petra");

  const handleConnect = async () => {
    if (petraWallet) {
      try {
        await connect(petraWallet.name);
      } catch (err) {
        console.error("Failed to connect Petra wallet:", err);
      }
    } else {
      // If Petra isn't in list, direct to Petra download
      window.open("https://petra.app/", "_blank");
    }
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/20">
                <Play className="h-5 w-5 fill-white text-white" />
              </div>
              <span className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-xl font-bold tracking-tight text-transparent">
                Vidora
              </span>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo / Brand */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 transition hover:opacity-90">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/20">
              <Play className="h-5 w-5 fill-white text-white" />
            </div>
            <span className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-xl font-bold tracking-tight text-transparent">
              Vidora
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname === "/"
                  ? "bg-slate-900 text-indigo-400 border border-slate-800"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/50"
              }`}
            >
              Gallery
            </Link>
            <Link
              href="/upload"
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${
                pathname === "/upload"
                  ? "bg-slate-900 text-indigo-400 border border-slate-800"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/50"
              }`}
            >
              <PlusCircle className="h-4 w-4" />
              Upload
            </Link>
          </nav>
        </div>

        {/* Action controls / Wallet Connect */}
        <div className="flex items-center gap-4">
          {/* Mobile links */}
          <div className="flex md:hidden items-center gap-2 mr-2">
            <Link
              href="/upload"
              className="p-2 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-900"
            >
              <PlusCircle className="h-5 w-5" />
            </Link>
          </div>

          {connected && account ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
                className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800/80 hover:text-white transition-all shadow-md hover:border-slate-700"
              >
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{truncateAddress(account.address.toString())}</span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl border border-slate-800 bg-slate-950 p-1 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="px-3 py-2 text-xs text-slate-500 border-b border-slate-900 mb-1">
                    Petra Wallet Connected
                  </div>
                  <button
                    onClick={() => {
                      disconnect();
                      setDropdownOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleConnect}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:from-indigo-600 hover:to-purple-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-500/25"
            >
              <Wallet className="h-4 w-4" />
              <span>{petraWallet ? "Connect Petra" : "Install Petra"}</span>
              {!petraWallet && <ExternalLink className="h-3.5 w-3.5 opacity-60" />}
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
