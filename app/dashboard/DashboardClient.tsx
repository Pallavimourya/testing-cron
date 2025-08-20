"use client";

import { Button } from "@/components/ui/button";
import { handleSignOut } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function DashboardClient({ session }: { session: any }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-3xl bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-10 flex flex-col items-center">
        <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight drop-shadow-lg">
          Welcome, <span className="text-yellow-400">{session.user?.name || session.user?.email}</span>
        </h1>
        <p className="text-lg text-slate-200 mb-8 text-center max-w-xl">
          This is your luxury dashboard. Here you can manage your account, view analytics, and access premium features. Enjoy the exclusive experience!
        </p>
        <div className="flex flex-col md:flex-row gap-6 w-full justify-center">
          <div className="bg-gradient-to-tr from-yellow-400/80 to-yellow-600/80 rounded-2xl p-6 flex-1 shadow-lg border border-yellow-300/30">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Your Plan</h2>
            <p className="text-lg text-slate-800">Pro Member</p>
            <p className="text-sm text-slate-700 mt-2">Access to all premium features</p>
          </div>
          <div className="bg-gradient-to-tr from-white/20 to-slate-700/30 rounded-2xl p-6 flex-1 shadow-lg border border-white/20">
            <h2 className="text-2xl font-bold text-yellow-400 mb-2">Quick Actions</h2>
            <ul className="space-y-2">
              <li><a href="#" className="text-slate-200 hover:text-yellow-400 transition">View Analytics</a></li>
              <li><a href="#" className="text-slate-200 hover:text-yellow-400 transition">Manage Subscription</a></li>
              <li><a href="#" className="text-slate-200 hover:text-yellow-400 transition">Settings</a></li>
            </ul>
          </div>
        </div>
        <Button
          onClick={() => handleSignOut(router)}
          className="mt-10 px-8 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold rounded-full shadow-lg hover:from-yellow-500 hover:to-yellow-600 transition-all text-lg"
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
