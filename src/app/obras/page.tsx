"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Plus,
  Loader2,
  CheckCircle2,
  ArrowRightCircle,
} from "lucide-react";

type Obra = {
  _id: string;
  nome: string;
  cliente?: string;
  endereco?: string;
  andarInicial?: number;
  andarFinal?: number;
  status?: "ativo" | "finalizado" | "pausado";
  observacoes?: string;
  createdAt?: string;
};

const ACTIVE_OBRA_KEY = "sistema-cortinados:obra-ativa";

export default function ObrasPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // obra ativa (para ligar com /medicoes)
  const [obraAtivaId, setObraAtivaId] = useState<string | null>(null);

  // form state
  const [nome, setNome] = useState("");
  const [cliente, setCliente] = useState("");
  const [endereco, setEndereco] = useState("");
  const [andarInicial, setAndarInicial] = useState("1");
  const [andarFinal, setAndarFinal] = useState("1");
  const [status, setStatus] = useState<"ativo" | "finalizado" | "pausado">(
    "ativo"
  );
  const [observacoes, setObservacoes] = useState("");

  // carregar obras + obra ativa do localStorage
  useEffect(() => {
    const fetchObras = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/obras");
        const data = await res.json();
        setObras(data);
      } catch (error) {
        console.error("Erro ao carregar obras:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchObras();

    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(ACTIVE_OBRA_KEY);
      if (stored) {
        setObraAtivaId(stored);
      }
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/obras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          cliente: cliente || undefined,
          endereco: endereco || undefined,
          andarInicial: Number(andarInicial),
          andarFinal: Number(andarFinal),
          status,
          observacoes: observacoes || undefined,
        }),
      });

      const nova: Obra = await res.json();
      setObras((prev) => [nova, ...prev]);

      // nova obra vira ativa automaticamente
      setObraAtivaId(nova._id);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(ACTIVE_OBRA_KEY, nova._id);
      }

      // limpar
      setNome("");
      setCliente("");
      setEndereco("");
      setAndarInicial("1");
      setAndarFinal("1");
      setObservacoes("");

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Erro ao criar obra:", error);
    } finally {
      setSaving(false);
    }
  }

  function handleUsarNaMedicao(obraId: string) {
    setObraAtivaId(obraId);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACTIVE_OBRA_KEY, obraId);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* topo */}
      <header className="sticky top-0 z-30 bg-white/70 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[0.65rem] uppercase tracking-wide text-slate-400">
                Sistema interno
              </p>
              <h1 className="text-sm font-semibold text-slate-900">Obras</h1>
            </div>
          </div>

          {/* atalho pra medições */}
          <a
            href="/medicoes"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white px-3 py-1.5 text-xs font-medium hover:bg-slate-800 transition"
          >
            Ir para medições
            <ArrowRightCircle className="w-4 h-4" />
          </a>
        </div>
      </header>

      {/* conteúdo */}
      <main className="max-w-6xl mx-auto px-4 py-6 grid gap-6 lg:grid-cols-[360px,1fr]">
        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4"
        >
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Nova obra</h2>
            <p className="text-xs text-slate-400">
              cadastre aqui e use depois na medição
            </p>
          </div>

          {/* nome */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-600">Nome da obra *</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-200"
              placeholder="Ex: Hotel Marina Palace"
            />
          </div>

          {/* cliente */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-600">Cliente</label>
            <input
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-200"
              placeholder="Ex: Construtora XPTO"
            />
          </div>

          {/* endereço */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-600">Endereço</label>
            <input
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-200"
              placeholder="Rua, número, cidade..."
            />
          </div>

          {/* andares */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-600">Andar inicial</label>
              <input
                type="number"
                min={0}
                value={andarInicial}
                onChange={(e) => setAndarInicial(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-600">Andar final</label>
              <input
                type="number"
                min={andarInicial ? Number(andarInicial) : 0}
                value={andarFinal}
                onChange={(e) => setAndarFinal(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>

          {/* status */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-600">Status da obra</label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(
                  e.target.value as "ativo" | "finalizado" | "pausado"
                )
              }
              className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="ativo">Ativo</option>
              <option value="pausado">Pausado</option>
              <option value="finalizado">Finalizado</option>
            </select>
          </div>

          {/* obs */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-600">Observações</label>
            <textarea
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-200 resize-none"
              placeholder="Instruções, contato, prazos..."
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition ${
              saving
                ? "bg-slate-200 text-slate-500"
                : saved
                ? "bg-emerald-500 text-white"
                : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : saved ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Obra criada
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Criar obra
              </>
            )}
          </button>
        </form>

        {/* LISTA */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Obras cadastradas
              </h2>
              <p className="text-xs text-slate-400">
                {obras.length} obra{obras.length !== 1 ? "s" : ""}
              </p>
            </div>
            {loading && (
              <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
            )}
          </div>

          {obras.length === 0 && !loading ? (
            <p className="text-xs text-slate-400">
              Nenhuma obra ainda. Cadastre ao lado.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 max-h-[560px] overflow-y-auto pr-1">
              {obras.map((obra) => {
                const isActive = obraAtivaId === obra._id;
                return (
                  <div
                    key={obra._id}
                    className={`rounded-xl border px-4 py-3 flex flex-col gap-2 ${
                      isActive
                        ? "border-slate-900 bg-slate-50"
                        : "border-slate-200/60 bg-slate-50/80"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 line-clamp-1">
                          {obra.nome}
                        </p>
                        {obra.cliente && (
                          <p className="text-[0.65rem] text-slate-500 line-clamp-1">
                            {obra.cliente}
                          </p>
                        )}
                      </div>
                      <span
                        className={`text-[0.55rem] px-2 py-0.5 rounded-full capitalize ${
                          obra.status === "ativo"
                            ? "bg-emerald-100 text-emerald-700"
                            : obra.status === "finalizado"
                            ? "bg-slate-200 text-slate-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {obra.status || "ativo"}
                      </span>
                    </div>

                    {obra.endereco && (
                      <p className="text-[0.6rem] text-slate-500 line-clamp-2">
                        {obra.endereco}
                      </p>
                    )}

                    <p className="text-[0.6rem] text-slate-400">
                      Andares: {obra.andarInicial ?? 1} até{" "}
                      {obra.andarFinal ?? obra.andarInicial ?? 1}
                    </p>

                    {obra.observacoes && (
                      <p className="text-[0.6rem] text-slate-400 line-clamp-2">
                        {obra.observacoes}
                      </p>
                    )}

                    <button
                      onClick={() => handleUsarNaMedicao(obra._id)}
                      className={`mt-1 inline-flex items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-[0.6rem] font-medium transition ${
                        isActive
                          ? "bg-slate-900 text-white"
                          : "bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {isActive ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          Ativa agora
                        </>
                      ) : (
                        <>
                          <ArrowRightCircle className="w-3 h-3" />
                          Usar na medição
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}