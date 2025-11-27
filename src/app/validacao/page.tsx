"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/src/app/components/AppLayout";
import { useCurrentUser } from "@/src/app/providers/UserProvider";
import { useToast } from "@/src/app/components/Toast";
import { parseJsonOrThrow } from "@/src/lib/http";
import type { Ambiente, Obra } from "@/src/app/medicoes/types";
import type { Product } from "@/src/types/product";
import type { MountingOptionDto } from "@/src/types/mounting";
import { TipoMontagem, getConfigMontagem } from "@/src/lib/calhas-config";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  Save,
  Send,
  ClipboardCheck,
  Loader2,
} from "lucide-react";
import { CatalogProductField } from "@/src/app/medicoes/components/CatalogProductField";
import { TipoMontagemCard } from "@/src/app/medicoes/components/TipoMontagemCard";
import { WorkflowTimeline } from "@/src/app/components/WorkflowTimeline";

const CALHA_OBS_PREFIX = "[Calha]";
const PRODUTO_OBS_PREFIX = "[Produto]";

const mergeObservacaoLinha = (texto: string, marker: string, novaLinha: string) => {
  const linhas = texto
    .split("\n")
    .map((line) => line.trimEnd())
    .filter(
      (line) =>
        line.trim().length > 0 && !line.trimStart().startsWith(marker)
    );

  return [...linhas, novaLinha].join("\n");
};

const buildObservacaoComTipo = (textoBase: string, tipo: TipoMontagem) => {
  const config = getConfigMontagem(tipo);
  if (!config) return textoBase;

  const nota = `${CALHA_OBS_PREFIX} ${config.nome} — ${config.descricao}`;
  return mergeObservacaoLinha(textoBase, CALHA_OBS_PREFIX, nota);
};

const mergeObservacaoComProduto = (textoBase: string, label: string, produto: Product) => {
  if (!produto?.nome) return textoBase;
  const marker = `${PRODUTO_OBS_PREFIX} ${label}:`;
  const descricao = produto.descricao ? ` — ${produto.descricao}` : "";
  const linha = `${marker} ${produto.nome}${descricao}`;
  return mergeObservacaoLinha(textoBase, marker, linha);
};

export default function ValidacaoPage() {
  const { user } = useCurrentUser();
  const { showToast, ToastContainer } = useToast();

  const [obras, setObras] = useState<Obra[]>([]);
  const [obraId, setObraId] = useState("");
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Product catalogs
  const [catalogoProdutos, setCatalogoProdutos] = useState<Product[]>([]);
  const [catalogoLoading, setCatalogoLoading] = useState(true);
  const [catalogoErro, setCatalogoErro] = useState<string | null>(null);

  // Mounting options
  const [montagensCatalogo, setMontagensCatalogo] = useState<MountingOptionDto[]>([]);

  // Form states for selected ambiente
  const [calha, setCalha] = useState("");
  const [tipoMontagem, setTipoMontagem] = useState<TipoMontagem>("simples");
  const [calhaDesconto, setCalhaDesconto] = useState("0");
  const [tecidoPrincipal, setTecidoPrincipal] = useState("");
  const [tecidoPrincipalDesc, setTecidoPrincipalDesc] = useState("0");
  const [tecidoSecundario, setTecidoSecundario] = useState("");
  const [tecidoSecundarioDesc, setTecidoSecundarioDesc] = useState("0");
  const [observacoes, setObservacoes] = useState("");

  // Redirect if not gerente
  useEffect(() => {
    if (user && user.role !== "gerente") {
      window.location.href = "/dashboard";
    }
  }, [user]);

  // Load obras
  useEffect(() => {
    const fetchObras = async () => {
      try {
        const res = await fetch("/api/obras", { credentials: "include" });
        const data = await parseJsonOrThrow<Obra[]>(res);
        setObras(data);
        if (data.length > 0) {
          setObraId(data[0]._id);
        }
      } catch (err) {
        console.error("Erro ao carregar obras:", err);
      }
    };
    fetchObras();
  }, []);

  // Load ambientes aguardando validação
  useEffect(() => {
    if (!obraId) return;
    const controller = new AbortController();

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/ambientes?obraId=${obraId}`, {
          signal: controller.signal,
          credentials: "include",
        });
        const data = await parseJsonOrThrow<Ambiente[]>(res);

        console.log("📦 Todos os ambientes:", data);
        console.log("📦 Quantidade total:", data.length);

        // Filter only ambientes aguardando validação
        const aguardandoValidacao = data.filter(
          (amb) => amb.status === "aguardando_validacao"
        );

        console.log("✅ Aguardando validação:", aguardandoValidacao);
        console.log("✅ Quantidade aguardando:", aguardandoValidacao.length);

        setAmbientes(aguardandoValidacao);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        console.error("Erro ao carregar ambientes:", err);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => controller.abort();
  }, [obraId]);

  // Load product catalog
  useEffect(() => {
    let active = true;
    const fetchCatalogo = async () => {
      setCatalogoLoading(true);
      setCatalogoErro(null);
      try {
        const res = await fetch("/api/produtos", { credentials: "include" });
        const data = await parseJsonOrThrow<Product[]>(res);
        if (active) {
          setCatalogoProdutos(data);
        }
      } catch (err) {
        if (active) {
          console.error("Erro ao carregar catálogo de produtos:", err);
          setCatalogoErro(
            err instanceof Error ? err.message : "Erro ao carregar catálogo."
          );
        }
      } finally {
        if (active) setCatalogoLoading(false);
      }
    };
    fetchCatalogo();

    return () => {
      active = false;
    };
  }, []);

  // Load mounting options
  useEffect(() => {
    let active = true;
    const fetchMontagens = async () => {
      try {
        const res = await fetch("/api/montagens", { credentials: "include" });
        const data = await parseJsonOrThrow<MountingOptionDto[]>(res);
        if (active) {
          setMontagensCatalogo(data);
        }
      } catch (err) {
        if (active) {
          console.error("Erro ao carregar tipos de montagem:", err);
        }
      }
    };
    fetchMontagens();

    return () => {
      active = false;
    };
  }, []);

  const catalogCalhas = useMemo(
    () => catalogoProdutos.filter((item) => item.categoria === "calha"),
    [catalogoProdutos]
  );

  const catalogCortinados = useMemo(
    () => catalogoProdutos.filter((item) => item.categoria === "cortinado"),
    [catalogoProdutos]
  );

  const montagensDisponiveis = useMemo(() => {
    return montagensCatalogo.map((item) => ({
      id: item._id,
      nome: item.nome,
      descricao: item.descricao,
      tipoBase: item.tipoBase,
    }));
  }, [montagensCatalogo]);

  const ambienteSelecionado = useMemo(
    () => ambientes.find((amb) => amb._id === selectedId) ?? null,
    [ambientes, selectedId]
  );

  // Load form when selecting ambiente
  useEffect(() => {
    if (!ambienteSelecionado) return;

    setCalha(ambienteSelecionado.variaveis?.calha || "");
    setTipoMontagem(ambienteSelecionado.variaveis?.tipoMontagem || "simples");
    setCalhaDesconto(
      String(ambienteSelecionado.variaveis?.regras?.calhaDesconto || 0)
    );
    setTecidoPrincipal(ambienteSelecionado.variaveis?.tecidoPrincipal || "");
    setTecidoPrincipalDesc(
      String(ambienteSelecionado.variaveis?.regras?.voileAlturaDesconto || 0)
    );
    setTecidoSecundario(ambienteSelecionado.variaveis?.tecidoSecundario || "");
    setTecidoSecundarioDesc(
      String(ambienteSelecionado.variaveis?.regras?.blackoutAlturaDesconto || 0)
    );
    setObservacoes(ambienteSelecionado.observacoes || "");
  }, [ambienteSelecionado]);

  const applyTipoMontagem = useCallback((novo: TipoMontagem) => {
    setTipoMontagem(novo);
    setObservacoes((prev) => buildObservacaoComTipo(prev, novo));
  }, []);

  const handleSelectCalhaProduto = useCallback((produto: Product) => {
    setCalha(produto.nome);
    setObservacoes((prev) => mergeObservacaoComProduto(prev, "Calha", produto));
  }, []);

  const handleSelectTecidoPrincipalProduto = useCallback((produto: Product) => {
    setTecidoPrincipal(produto.nome);
    setObservacoes((prev) =>
      mergeObservacaoComProduto(prev, "Tecido principal", produto)
    );
  }, []);

  const handleSelectTecidoSecundarioProduto = useCallback((produto: Product) => {
    setTecidoSecundario(produto.nome);
    setObservacoes((prev) =>
      mergeObservacaoComProduto(prev, "Tecido secundário", produto)
    );
  }, []);

  const handleSalvar = async () => {
    if (!selectedId) return;

    setSaving(true);
    try {
      const body = {
        variaveis: {
          calha,
          tipoMontagem,
          tecidoPrincipal,
          tecidoSecundario,
          regras: {
            calhaDesconto: calhaDesconto !== "" ? Number(calhaDesconto) : undefined,
            voileAlturaDesconto:
              tecidoPrincipalDesc !== "" ? Number(tecidoPrincipalDesc) : undefined,
            blackoutAlturaDesconto:
              tecidoSecundarioDesc !== "" ? Number(tecidoSecundarioDesc) : undefined,
          },
        },
        observacoes,
      };

      const res = await fetch(`/api/ambientes/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const atualizado = await parseJsonOrThrow<Ambiente>(res);
      setAmbientes((prev) =>
        prev.map((amb) => (amb._id === atualizado._id ? atualizado : amb))
      );

      showToast("Configurações salvas com sucesso!", "success");
    } catch (err) {
      console.error("Erro ao salvar:", err);
      showToast(
        err instanceof Error ? err.message : "Erro ao salvar.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAprovar = async () => {
    if (!selectedId) return;

    const confirm = window.confirm(
      "Deseja aprovar este ambiente e liberar para produção?"
    );
    if (!confirm) return;

    setSaving(true);
    try {
      const body = {
        variaveis: {
          calha,
          tipoMontagem,
          tecidoPrincipal,
          tecidoSecundario,
          regras: {
            calhaDesconto: calhaDesconto !== "" ? Number(calhaDesconto) : undefined,
            voileAlturaDesconto:
              tecidoPrincipalDesc !== "" ? Number(tecidoPrincipalDesc) : undefined,
            blackoutAlturaDesconto:
              tecidoSecundarioDesc !== "" ? Number(tecidoSecundarioDesc) : undefined,
          },
        },
        observacoes,
        status: "em_producao",
      };

      const res = await fetch(`/api/ambientes/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const atualizado = await parseJsonOrThrow<Ambiente>(res);

      // Remove from list
      setAmbientes((prev) => prev.filter((amb) => amb._id !== selectedId));
      setSelectedId(null);

      showToast(
        `Ambiente ${atualizado.codigo} aprovado e liberado para produção!`,
        "success"
      );
    } catch (err) {
      console.error("Erro ao aprovar:", err);
      showToast(
        err instanceof Error ? err.message : "Erro ao aprovar.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  if (!user || user.role !== "gerente") {
    return null;
  }

  return (
    <AppLayout>
      <ToastContainer />

      {/* Header */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                  Validação de Medições
                </p>
                <div className="flex items-center gap-3">
                  <select
                    value={obraId}
                    onChange={(e) => {
                      setObraId(e.target.value);
                      setSelectedId(null);
                    }}
                    className="text-base font-semibold text-slate-900 bg-transparent outline-none border-b border-slate-200 pb-0.5"
                  >
                    <option value="">Selecione uma obra</option>
                    {obras.map((obra) => (
                      <option key={obra._id} value={obra._id}>
                        {obra.nome}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-slate-500">
                    {ambientes.length} aguardando
                  </span>
                </div>
              </div>
            </div>

            {loading && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 text-slate-500 text-xs font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Carregando...
              </span>
            )}
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
          {/* Lista de ambientes */}
          <aside className="bg-white rounded-2xl border border-slate-200 p-4 h-fit lg:sticky lg:top-24">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">
              Ambientes aguardando
            </h2>

            {loading ? (
              <div className="text-sm text-slate-500 py-8 text-center">
                <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin text-slate-400" />
                Carregando...
              </div>
            ) : ambientes.length === 0 ? (
              <div className="text-sm text-slate-500 py-8 text-center">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                <p className="font-medium text-slate-700">Tudo validado!</p>
                <p className="text-xs mt-1">Nenhum ambiente aguardando validação</p>
              </div>
            ) : (
              <div className="space-y-2">
                {ambientes.map((amb) => (
                  <button
                    key={amb._id}
                    onClick={() => setSelectedId(amb._id)}
                    className={`w-full text-left p-3 rounded-xl border transition ${
                      selectedId === amb._id
                        ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600/20"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {amb.codigo}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {amb.medidas?.largura ?? "—"}cm × {amb.medidas?.altura ?? "—"}cm
                        </p>
                        {amb.medidas?.instalacao && (
                          <p className="text-[0.7rem] text-slate-400 mt-1 capitalize">
                            {amb.medidas.instalacao}
                          </p>
                        )}
                      </div>
                      <Clock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </aside>

          {/* Formulário de validação */}
          <div>
            {!selectedId ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                <p className="text-slate-600 font-medium">
                  Selecione um ambiente para validar
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Configure produtos e aprove para produção
                </p>
              </div>
            ) : ambienteSelecionado ? (
              <div className="space-y-5">
                {/* Info do ambiente */}
                <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {ambienteSelecionado.codigo}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Medição realizada • Aguardando configuração
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-800 text-xs font-semibold">
                      <Clock className="w-3 h-3" />
                      Pendente
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <p className="text-[0.65rem] uppercase tracking-wide text-slate-500 font-semibold">
                        Largura
                      </p>
                      <p className="text-lg font-bold text-slate-900 mt-1">
                        {ambienteSelecionado.medidas?.largura ?? "—"} cm
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <p className="text-[0.65rem] uppercase tracking-wide text-slate-500 font-semibold">
                        Altura
                      </p>
                      <p className="text-lg font-bold text-slate-900 mt-1">
                        {ambienteSelecionado.medidas?.altura ?? "—"} cm
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <p className="text-[0.65rem] uppercase tracking-wide text-slate-500 font-semibold">
                        Recuo
                      </p>
                      <p className="text-lg font-bold text-slate-900 mt-1">
                        {ambienteSelecionado.medidas?.recuo ?? "—"} cm
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <p className="text-[0.65rem] uppercase tracking-wide text-slate-500 font-semibold">
                        Instalação
                      </p>
                      <p className="text-lg font-bold text-slate-900 mt-1 capitalize">
                        {ambienteSelecionado.medidas?.instalacao ?? "—"}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Tipo de Montagem */}
                <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-slate-600" />
                    <h2 className="text-sm font-semibold text-slate-900">
                      Tipo de Montagem
                    </h2>
                  </div>

                  {montagensDisponiveis.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                      Nenhum tipo de montagem cadastrado.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {montagensDisponiveis.map((option) => (
                        <TipoMontagemCard
                          key={option.id ?? option.tipoBase}
                          option={option}
                          isSelected={tipoMontagem === option.tipoBase}
                          onSelect={() => applyTipoMontagem(option.tipoBase)}
                        />
                      ))}
                    </div>
                  )}
                </section>

                {/* Variáveis de Produção */}
                <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-slate-600" />
                    <h2 className="text-sm font-semibold text-slate-900">
                      Variáveis de produção
                    </h2>
                  </div>

                  <div className="grid gap-6 md:grid-cols-3">
                    <CatalogProductField
                      fieldId="calha"
                      label="Calha"
                      value={calha}
                      onChange={setCalha}
                      placeholder="Ex: Forest preta"
                      catalog={catalogCalhas}
                      onSelectProduct={handleSelectCalhaProduto}
                      catalogLoading={catalogoLoading}
                      catalogLoadError={catalogoErro}
                      emptyMessage="Nenhuma calha cadastrada."
                      descontoLabel="Desconto (cm)"
                      descontoValue={calhaDesconto}
                      onChangeDesconto={setCalhaDesconto}
                    />

                    <CatalogProductField
                      fieldId="tecido-principal"
                      label="Tecido principal"
                      value={tecidoPrincipal}
                      onChange={setTecidoPrincipal}
                      placeholder="Ex: Voile branco"
                      catalog={catalogCortinados}
                      onSelectProduct={handleSelectTecidoPrincipalProduto}
                      catalogLoading={catalogoLoading}
                      catalogLoadError={catalogoErro}
                      emptyMessage="Nenhum tecido cadastrado."
                      descontoLabel="Desconto altura (cm)"
                      descontoValue={tecidoPrincipalDesc}
                      onChangeDesconto={setTecidoPrincipalDesc}
                    />

                    <CatalogProductField
                      fieldId="tecido-secundario"
                      label="Tecido secundário"
                      value={tecidoSecundario}
                      onChange={setTecidoSecundario}
                      placeholder="Ex: Blackout cinza"
                      catalog={catalogCortinados}
                      onSelectProduct={handleSelectTecidoSecundarioProduto}
                      catalogLoading={catalogoLoading}
                      catalogLoadError={catalogoErro}
                      emptyMessage="Nenhum tecido cadastrado."
                      descontoLabel="Desconto altura (cm)"
                      descontoValue={tecidoSecundarioDesc}
                      onChangeDesconto={setTecidoSecundarioDesc}
                    />
                  </div>
                </section>

                {/* Observações */}
                <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <label className="text-xs font-medium text-slate-700 mb-2 block">
                    Observações
                  </label>
                  <textarea
                    rows={4}
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 resize-none text-slate-900 placeholder-slate-400 transition"
                    placeholder="Observações adicionais..."
                  />
                </section>

                {/* Actions */}
                <div className="sticky bottom-4 flex gap-3">
                  <button
                    onClick={handleSalvar}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-700 text-white font-semibold text-sm hover:bg-slate-800 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Salvar Configurações
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleAprovar}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-500 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Aprovar e Liberar
                      </>
                    )}
                  </button>
                </div>

                {/* Workflow Timeline */}
                <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mt-6">
                  <WorkflowTimeline
                    workflow={ambienteSelecionado.workflow}
                    currentStatus={ambienteSelecionado.status}
                    logs={ambienteSelecionado.logs}
                  />
                </section>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
