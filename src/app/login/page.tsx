"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Loader2, Lock, Mail } from "lucide-react";
import { useCurrentUser } from "@/src/app/providers/UserProvider";

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useCurrentUser();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !senha) {
      setError("Informe e-mail e senha.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, senha }),
      });

      if (!res.ok) {
        let message = "Não foi possível entrar.";
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
      }).then((resMe) => resMe.json());

      if (!me?.user) {
        throw new Error("Sessão não criada. Verifique se os cookies estão habilitados.");
      }

      await refresh();

      router.replace("/medicoes");
    } catch (err) {
      console.error("Erro ao fazer login:", err);
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid gap-8 lg:grid-cols-[1.1fr,0.9fr] items-center">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
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
            <p className="text-lg font-medium text-slate-900">
              Faça login para acessar medições, obras e relatórios.
            </p>
            <p className="text-sm leading-relaxed">
              Utilize o e-mail corporativo cadastrado pelo administrador. Caso
              ainda não tenha credenciais, solicite ao time responsável.
            </p>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              <p className="font-semibold text-slate-800 mb-1">
                Dica de segurança
              </p>
              <p>
                Evite usar este sistema em dispositivos públicos. Sempre encerre
                a sessão ao terminar.
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col gap-6"
        >
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Entrar no painel
            </h2>
            <p className="text-sm text-slate-500">
              Acesse com suas credenciais corporativas.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              E-mail
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
              Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua senha"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                autoComplete="current-password"
              />
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
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </button>

          <div className="text-xs text-slate-500 text-center space-y-1">
            <p>
              Ainda não tem conta?{" "}
              <Link href="/register" className="text-slate-900 font-semibold">
                peça acesso
              </Link>
              .
            </p>
            <p>
              Problemas com o acesso?{" "}
              <Link
                href="mailto:suporte@empresa.com"
                className="text-slate-900 font-semibold"
              >
                fale com o suporte
              </Link>
              .
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
