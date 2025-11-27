"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PanelRightOpen } from "lucide-react";
import { MedicoesHeader } from "./components/MedicoesHeader";
import { MedicoesForm } from "./components/MedicoesForm";
import { MedicoesSidebar } from "./components/MedicoesSidebar";
import type { Ambiente, Obra, AmbienteStatus } from "./types";
import { ACTIVE_OBRA_KEY } from "@/src/lib/constants";
import { parseJsonOrThrow } from "@/src/lib/http";
import { AppLayout } from "@/src/app/components/AppLayout";
import { useToast } from "@/src/app/components/Toast";

const FORM_DEFAULTS = {
  prefixo: "QT",
  sequencia: 1,
  largura: "",
  altura: "",
  recuo: "",
  instalacao: "teto",
  observacoes: "",
};

const STATUS_FLOW: AmbienteStatus[] = [
  "medicao_pendente",
  "aguardando_validacao",
  "em_producao",
  "producao_calha",
  "producao_cortina",
  "estoque_deposito",
  "em_transito",
  "aguardando_instalacao",
  "instalado",
];

export default function MedicoesPage() {
  const { showToast, ToastContainer } = useToast();
  const [obras, setObras] = useState<Obra[]>([]);
  const [obraId, setObraId] = useState("");
  const [andar, setAndar] = useState("1");
  const [quarto, setQuarto] = useState("101");

  // form states
  const [prefixo, setPrefixo] = useState(FORM_DEFAULTS.prefixo);
  const [sequencia, setSequencia] = useState(FORM_DEFAULTS.sequencia);
  const [largura, setLargura] = useState(FORM_DEFAULTS.largura);
  const [altura, setAltura] = useState(FORM_DEFAULTS.altura);
  const [recuo, setRecuo] = useState(FORM_DEFAULTS.recuo);
  const [instalacao, setInstalacao] = useState(FORM_DEFAULTS.instalacao);
  const [observacoes, setObservacoes] = useState(FORM_DEFAULTS.observacoes);

  // list
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [finalizandoMedicao, setFinalizandoMedicao] = useState(false);

  const codigoPreview = `${prefixo}${quarto}-${sequencia}`;
  const obraSelecionada = useMemo(
    () => obras.find((obra) => obra._id === obraId) ?? null,
    [obras, obraId]
  );

  const ambienteSelecionado = useMemo(
    () => ambientes.find((amb) => amb._id === selectedId) ?? null,
    [ambientes, selectedId]
  );

  type StatusSummary = Record<AmbienteStatus, number>;

  const stats = useMemo<StatusSummary>(() => {
    const createSummaryBase = (): StatusSummary =>
      STATUS_FLOW.reduce((acc, status) => {
        acc[status] = 0;
        return acc;
      }, {} as StatusSummary);

    return ambientes.reduce((acc, amb) => {
      const status = (amb.status ?? "medicao_pendente") as AmbienteStatus;
      acc[status] = (acc[status] ?? 0) + 1;
      return acc;
    }, createSummaryBase());
  }, [ambientes]);

  const handleFinalizarMedicao = useCallback(async () => {
    if (!ambienteSelecionado) return;
    console.log("🚀 Finalizando medição para:", ambienteSelecionado.codigo);
    console.log("📝 Status atual:", ambienteSelecionado.status);

    setFinalizandoMedicao(true);
    try {
      const res = await fetch(`/api/ambientes/${ambienteSelecionado._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "aguardando_validacao" }),
      });
      const atualizado = await parseJsonOrThrow<Ambiente>(res);

      console.log("✅ Medição finalizada!");
      console.log("📝 Novo status:", atualizado.status);
      console.log("📦 Ambiente atualizado:", atualizado);

      setAmbientes((prev) =>
        prev.map((amb) => (amb._id === atualizado._id ? atualizado : amb))
      );
      showToast("success", "Medição enviada para validação do gerente.");
    } catch (error) {
      console.error("❌ Erro ao finalizar medição:", error);
      showToast(
        "error",
        error instanceof Error ? error.message : "Erro ao finalizar medição."
      );
    } finally {
      setFinalizandoMedicao(false);
    }
  }, [ambienteSelecionado, showToast]);

  // carregar obras
  useEffect(() => {
    const fetchObras = async () => {
      try {
        const res = await fetch("/api/obras", { credentials: "include" });
        const data = await parseJsonOrThrow<Obra[]>(res);
        setObras(data);

        if (typeof window !== "undefined") {
          const last = window.localStorage.getItem(ACTIVE_OBRA_KEY);
          if (last && data.some((o) => o._id === last)) {
            setObraId(last);
            return;
          }
        }

        if (data.length > 0) {
          setObraId(data[0]._id);
        }
      } catch (err) {
        console.error("Erro ao carregar obras:", err);
      }
    };
    fetchObras();
  }, []);

  // salvar obra ativa
  useEffect(() => {
    if (obraId && typeof window !== "undefined") {
      window.localStorage.setItem(ACTIVE_OBRA_KEY, obraId);
    }
  }, [obraId]);

  // carregar ambientes
  useEffect(() => {
    if (!obraId) return;
    const controller = new AbortController();

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/ambientes?obraId=${obraId}&quarto=${quarto}`,
          { signal: controller.signal, credentials: "include" }
        );
        const data = await parseJsonOrThrow<Ambiente[]>(res);
        setAmbientes(data);
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
  }, [quarto, obraId]);

  function fillFormFromAmbiente(amb: Ambiente) {
    setSelectedId(amb._id);
    setPrefixo(amb.prefixo);
    setQuarto(amb.quarto);
    setSequencia(amb.sequencia ?? FORM_DEFAULTS.sequencia);
    setLargura(
      amb.medidas?.largura !== undefined ? String(amb.medidas.largura) : FORM_DEFAULTS.largura
    );
    setAltura(
      amb.medidas?.altura !== undefined ? String(amb.medidas.altura) : FORM_DEFAULTS.altura
    );
    setRecuo(
      amb.medidas?.recuo !== undefined ? String(amb.medidas.recuo) : FORM_DEFAULTS.recuo
    );
    setInstalacao(amb.medidas?.instalacao || FORM_DEFAULTS.instalacao);
    setObservacoes(amb.observacoes || FORM_DEFAULTS.observacoes);
  }

  function resetForm() {
    setSelectedId(null);
    setPrefixo(FORM_DEFAULTS.prefixo);
    setSequencia(FORM_DEFAULTS.sequencia);
    setLargura(FORM_DEFAULTS.largura);
    setAltura(FORM_DEFAULTS.altura);
    setRecuo(FORM_DEFAULTS.recuo);
    setInstalacao(FORM_DEFAULTS.instalacao);
    setObservacoes(FORM_DEFAULTS.observacoes);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!obraId) {
      showToast("Selecione uma obra primeiro.", "error");
      return;
    }

    setSaving(true);

    const body = {
      obraId,
      andar: Number(andar),
      quarto,
      prefixo,
      sequencia: Number(sequencia),
      medidas: {
        largura: largura ? Number(largura) : undefined,
        altura: altura ? Number(altura) : undefined,
        recuo: recuo ? Number(recuo) : undefined,
        instalacao,
      },
      observacoes,
    };

    try {
      if (selectedId) {
        const res = await fetch(`/api/ambientes/${selectedId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
        const atualizado = await parseJsonOrThrow<Ambiente>(res);
        setAmbientes((prev) =>
          prev.map((a) => (a._id === atualizado._id ? atualizado : a))
        );
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
        showToast(`Ambiente ${atualizado.codigo} atualizado com sucesso!`, "success");
      } else {
        const res = await fetch("/api/ambientes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
        const novo = await parseJsonOrThrow<Ambiente>(res);
        setAmbientes((prev) => [novo, ...prev]);

        setSequencia((prev) => prev + 1);
        setLargura("");
        setAltura("");
        setRecuo("");
        setObservacoes("");

        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
        showToast(`Medição ${novo.codigo} adicionada com sucesso!`, "success");
      }
    } catch (err) {
      console.error("Erro ao salvar ambiente:", err);
      showToast(err instanceof Error ? err.message : "Erro ao salvar ambiente.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmDelete = window.confirm("Deseja realmente excluir esse ambiente?");
    if (!confirmDelete) return;

    const ambienteParaExcluir = ambientes.find((a) => a._id === id);

    try {
      const res = await fetch(`/api/ambientes/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Erro ao excluir ambiente.");
      }
      setAmbientes((prev) => prev.filter((a) => a._id !== id));
      if (selectedId === id) {
        resetForm();
      }
      showToast(`Ambiente ${ambienteParaExcluir?.codigo || ""} excluído.`, "info");
    } catch (err) {
      console.error("Erro ao excluir ambiente:", err);
      showToast(err instanceof Error ? err.message : "Erro ao excluir ambiente.", "error");
    }
  }

  function handleProximoQuarto() {
    setQuarto(String(Number(quarto) + 1));
    setSequencia(1);
    setSelectedId(null);
  }

  function handleQuartoAnterior() {
    setQuarto(String(Number(quarto) - 1));
    setSequencia(1);
    setSelectedId(null);
  }

  return (
    <AppLayout>
      <ToastContainer />

      <MedicoesHeader
        obras={obras}
        obraId={obraId}
        obraSelecionada={obraSelecionada}
        onChangeObra={(id) => {
          setObraId(id);
          setSelectedId(null);
        }}
        andar={andar}
        onChangeAndar={setAndar}
        quarto={quarto}
        onChangeQuarto={(q) => {
          setQuarto(q);
          setSelectedId(null);
        }}
        onPrevQuarto={handleQuartoAnterior}
        onNextQuarto={handleProximoQuarto}
        codigoPreview={codigoPreview}
        stats={stats}
        totalAmbientes={ambientes.length}
        loadingAmbientes={loading}
      />

      <main
        className={`max-w-6xl mx-auto px-4 py-6 grid gap-6 ${
          sidebarOpen ? "lg:grid-cols-[1fr,360px]" : "lg:grid-cols-1"
        }`}
      >
        <MedicoesForm
          selectedId={selectedId}
          selectedAmbiente={ambienteSelecionado}
          prefixo={prefixo}
          onChangePrefixo={setPrefixo}
          sequencia={sequencia}
          onChangeSequencia={setSequencia}
          largura={largura}
          onChangeLargura={setLargura}
          altura={altura}
          onChangeAltura={setAltura}
          recuo={recuo}
          onChangeRecuo={setRecuo}
          instalacao={instalacao}
          onChangeInstalacao={setInstalacao}
          observacoes={observacoes}
          onChangeObservacoes={setObservacoes}
          onSubmit={handleSubmit}
          onResetEdit={resetForm}
          saving={saving}
          saved={saved}
          onFinalizeMedicao={
            ambienteSelecionado?.status === "medicao_pendente"
              ? handleFinalizarMedicao
              : undefined
          }
          finalizandoMedicao={finalizandoMedicao}
        />

        {sidebarOpen && (
          <MedicoesSidebar
            loading={loading}
            quarto={quarto}
            searchTerm={searchTerm}
            onChangeSearch={setSearchTerm}
            ambientes={ambientes}
            selectedId={selectedId}
            onSelect={fillFormFromAmbiente}
            onDelete={handleDelete}
            onClose={() => setSidebarOpen(false)}
            onFinalizarMedicao={async (id) => {
              const ambiente = ambientes.find((amb) => amb._id === id);
              if (!ambiente) return;

              console.log("🚀 Finalizando medição (sidebar) para:", ambiente.codigo);
              console.log("📝 Status atual:", ambiente.status);

              try {
                const res = await fetch(`/api/ambientes/${id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({ status: "aguardando_validacao" }),
                });
                const atualizado = await parseJsonOrThrow<Ambiente>(res);

                console.log("✅ Medição finalizada (sidebar)!");
                console.log("📝 Novo status:", atualizado.status);

                setAmbientes((prev) =>
                  prev.map((amb) => (amb._id === atualizado._id ? atualizado : amb))
                );
                showToast("Medição enviada para validação do gerente.", "success");
              } catch (error) {
                console.error("❌ Erro ao finalizar medição:", error);
                showToast(
                  error instanceof Error ? error.message : "Erro ao finalizar medição.",
                  "error"
                );
              }
            }}
          />
        )}
      </main>

      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed bottom-6 right-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white text-sm font-semibold shadow-lg shadow-slate-900/20 hover:bg-slate-800"
        >
          <PanelRightOpen className="w-4 h-4" />
          Abrir lista
        </button>
      )}
    </AppLayout>
  );
}
