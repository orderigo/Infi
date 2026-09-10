"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (!isSupabaseConfigured()) {
      setErrorMsg(
        "Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.",
      );
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (data.user && !data.session) {
          setInfoMsg(
            "Sign up successful! Please check your email to confirm your account.",
          );
        } else {
          setInfoMsg("Account created successfully!");
          if (onSuccess) onSuccess();
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (onSuccess) onSuccess();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (
          err.message.includes("Failed to fetch") ||
          err.message.includes("fetch") ||
          err.message.includes("NetworkError")
        ) {
          setErrorMsg(
            "Failed to connect to the authentication service. Please check your internet connection or verify your Supabase URL.",
          );
        } else {
          setErrorMsg(err.message);
        }
      } else {
        setErrorMsg("An unexpected error occurred during authentication.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-2xl border border-cyan-500/30 bg-zinc-950 p-6 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-800 pb-3">
          <h2 className="text-lg font-mono font-bold text-cyan-400">
            {isSignUp ? "CREATE AN ACCOUNT" : "SIGN IN TO HELIOS"}
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-100 font-mono text-sm"
            >
              ✕
            </button>
          )}
        </div>

        <p className="mb-6 text-xs text-zinc-400">
          {isSignUp
            ? "Create an account to start real-time video generation and use the Gemini Voice Agent."
            : "Sign in with your email and password to access video generation and the Gemini Voice Agent."}
        </p>

        {errorMsg && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300">
            {errorMsg}
          </div>
        )}

        {infoMsg && (
          <div className="mb-4 rounded-lg border border-cyan-500/30 bg-cyan-950/40 p-3 text-xs text-cyan-300">
            {infoMsg}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-mono text-zinc-300">
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-mono text-zinc-300">
              PASSWORD
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-cyan-500 py-2.5 text-xs font-mono font-bold text-zinc-950 transition hover:bg-cyan-400 disabled:opacity-50 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
          >
            {loading ? "PROCESSING..." : isSignUp ? "SIGN UP" : "SIGN IN"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg(null);
              setInfoMsg(null);
            }}
            className="text-xs text-zinc-400 hover:text-cyan-400 transition"
          >
            {isSignUp
              ? "Already have an account? Sign In"
              : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}
