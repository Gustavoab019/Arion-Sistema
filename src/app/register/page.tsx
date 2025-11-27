"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Loader2,
  Lock,
  Mail,
  User2,
  ArrowRight,
  Shield,
} from "lucide-react";
import { useCurrentUser } from "@/src/app/providers/UserProvider";

const roles = [
  { value: "gerente", label: "Gerente", description: "Acesso total" },
  { value: "instalador", label: "Instalador", description: "Medições em campo" },
  { value: "producao", label: "Produção", description: "Gestão de cortes" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useCurrentUser();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [role, setRole] = useState("instalador");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!nome.trim() || !email.trim() || !senha.trim()) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    if (senha !== confirmacao) {
      setError("As senhas não conferem.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ nome, email, senha, role }),
      });

      if (!res.ok) {
        let message = "Não foi possível registrar.";
        try {
          const data = await res.json();
          message = data?.message || message;
        } catch {
          const text = await res.text();
          if (text) message = text;
        }
        throw new Error(message);
      }

      await res.json();

      const me = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      }).then((r) => r.json());

      if (!me?.user) {
        throw new Error("Sessão não criada. Verifique se os cookies estão habilitados.");
      }

      await refresh();

      router.replace("/dashboard");
    } catch (err) {
      console.error("Erro ao registrar:", err);
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Image
              src="/logo.png"
              alt="Arion Logo"
              width={120}
              height={120}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            Arion - Mobiliário e Decoração Lda
          </h1>
          <p className="text-sm text-slate-500">
            Criar nova conta no sistema
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-8 shadow-xl shadow-slate-900/5">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">
              Cadastrar usuário
            </h2>
            <p className="text-sm text-slate-500">
              Preencha os dados para criar acesso
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700 uppercase tracking-wider">
                Nome completo
              </label>
              <div className="relative group">
                <User2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-slate-600" />
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="João Silva"
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5"
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700 uppercase tracking-wider">
                E-mail corporativo
              </label>
              <div className="relative group">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-slate-600" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Role Field */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700 uppercase tracking-wider">
                Perfil de acesso
              </label>
              <div className="relative group">
                <Shield className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-slate-600 pointer-events-none z-10" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5 appearance-none cursor-pointer"
                >
                  {roles.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label} • {r.description}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Senha
                </label>
                <div className="relative group">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-slate-600" />
                  <input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Confirmar
                </label>
                <div className="relative group">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-slate-600" />
                  <input
                    type="password"
                    value={confirmacao}
                    onChange={(e) => setConfirmacao(e.target.value)}
                    placeholder="••••••"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white py-3 text-sm font-semibold transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-900 shadow-lg shadow-slate-900/10"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Criando conta...</span>
                </>
              ) : (
                <>
                  <span>Criar conta</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-center text-xs text-slate-500">
              Já tem conta?{" "}
              <Link
                href="/login"
                className="text-slate-900 font-semibold hover:underline"
              >
                Fazer login
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom Info */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Cadastre apenas usuários autorizados
        </p>
      </div>
    </div>
  );
}
