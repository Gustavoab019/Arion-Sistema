"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Loader2,
  ShieldCheck,
  BadgeCheck,
  Lock,
  Mail,
  User2,
} from "lucide-react";

const roles = [
  { value: "gerente", label: "Gerente" },
  { value: "instalador", label: "Instalador" },
  { value: "producao", label: "Produção" },
];

export default function RegisterPage() {
  const router = useRouter();
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

      if (typeof window !== "undefined") {
        window.location.href = "/medicoes";
      } else {
        router.replace("/medicoes");
      }
    } catch (err) {
      console.error("Erro ao registrar:", err);
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid gap-8 lg:grid-cols-[1.1fr,0.9fr] items-center">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-400">
                Sistema interno
              </p>
              <h1 className="text-xl font-semibold text-slate-900">
                Cortinados &amp; Cia
              </h1>
            </div>
          </div>

          <div className="space-y-4 text-slate-600">
            <p className="text-lg font-medium text-slate-900 leading-relaxed">
              Cadastre um usuário para liberar acesso às medições e obras.
            </p>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-slate-400" />
              <div>
                <p className="font-semibold text-slate-800 mb-1">
                  Perfis disponíveis
                </p>
                <p>
                  Gerentes têm visão total, instaladores focam no campo e
                  produção acompanha status internos.
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500 flex items-start gap-3">
              <BadgeCheck className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="font-semibold text-slate-800 mb-1">
                  Aprovação interna
                </p>
                <p>
                  Só cadastre usuários autorizados. O sistema envia cookie de
                  sessão automaticamente após o registro.
                </p>
              </div>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col gap-6"
        >
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Criar nova conta
            </h2>
            <p className="text-sm text-slate-500">
              Os campos marcados com * são obrigatórios.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Nome completo *
            </label>
            <div className="relative">
              <User2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Maria da Silva"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              E-mail corporativo *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@empresa.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Perfil de acesso
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            >
              {roles.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Senha *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Confirmar senha *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={confirmacao}
                  onChange={(e) => setConfirmacao(e.target.value)}
                  placeholder="Repita a senha"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  autoComplete="new-password"
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white py-3 text-sm font-semibold transition hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Registrando...
              </>
            ) : (
              "Registrar"
            )}
          </button>

          <p className="text-xs text-slate-500 text-center">
            Já tem conta?{" "}
            <Link href="/login" className="text-slate-900 font-semibold">
              faça login
            </Link>
            .
          </p>
        </form>
      </div>
    </div>
  );
}
