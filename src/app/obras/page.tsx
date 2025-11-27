"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppLayout } from "../components/AppLayout";
import { ObraSidebar } from "./components/ObraSidebar";
import { ObraDetails } from "./components/ObraDetails";
import { ObraFormModal } from "./components/ObraFormModal";
import { AmbienteResumo, Obra, ObraStatus, UsuarioAtivo } from "./types";
import { ACTIVE_OBRA_KEY } from "@/src/lib/constants";
import { parseJsonOrThrow } from "@/src/lib/http";
import { useCurrentUser } from "@/src/app/providers/UserProvider";

const statusOptions: { label: string; value: ObraStatus; color: "emerald" | "amber" | "slate" }[] = [
  { label: "Ativo", value: "ativo", color: "emerald" },
  { label: "Pausado", value: "pausado", color: "amber" },
  { label: "Finalizado", value: "finalizado", color: "slate" },
];

const statusFilterOptions = [
  { label: "Todas", value: "todos" as const },
  ...statusOptions.map(({ label, value }) => ({ label, value })),
];

const emptyForm = {
  nome: "",
  cliente: "",
  endereco: "",
  andarInicial: "1",
  andarFinal: "1",
  status: "ativo" as ObraStatus,
  observacoes: "",
};

export default function ObrasPage() {
  const { user } = useCurrentUser();
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<"todos" | ObraStatus>("todos");

  const [selectedObraId, setSelectedObraId] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingObra, setEditingObra] = useState<Obra | null>(null);

  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [usuarios, setUsuarios] = useState<UsuarioAtivo[]>([]);
  const [usuariosLoading, setUsuariosLoading] = useState(false);
  const [usuariosError, setUsuariosError] = useState<string | null>(null);
  const [responsavelIds, setResponsavelIds] = useState<string[]>([]);
  const [salvandoEquipe, setSalvandoEquipe] = useState(false);

  const [ambientesResumo, setAmbientesResumo] = useState<AmbienteResumo[]>([]);
  const [ambientesLoading, setAmbientesLoading] = useState(false);

  const canManage = user?.role === "gerente";

  const filteredObras = useMemo(() => {
    const normalized = busca.trim().toLowerCase();
    return obras.filter((obra) => {
      const matchNome = obra.nome.toLowerCase().includes(normalized);
      const matchCliente = obra.cliente?.toLowerCase().includes(normalized);
      const passaBusca = normalized.length === 0 || matchNome || matchCliente;
      const passaStatus =
        statusFiltro === "todos" || (obra.status ?? "ativo") === statusFiltro;
      return passaBusca && passaStatus;
    });
  }, [obras, busca, statusFiltro]);

  const selectedObra = useMemo(
    () => obras.find((obra) => obra._id === selectedObraId) ?? null,
    [obras, selectedObraId]
  );

  const ambienteStats = useMemo(() => {
    return ambientesResumo.reduce(
      (acc, ambiente) => {
        if (ambiente.status === "completo") acc.done += 1;
        else if (ambiente.status === "revisar") acc.review += 1;
        else acc.pending += 1;
        return acc;
      },
      { pending: 0, review: 0, done: 0 }
    );
  }, [ambientesResumo]);

  const ambientesRecentes = useMemo(() => {
    const ordenados = [...ambientesResumo].sort((a, b) => {
      if (!a.updatedAt || !b.updatedAt) return 0;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    return ordenados.slice(0, 5);
  }, [ambientesResumo]);

  const equipeOriginal = useMemo(
    () => selectedObra?.responsaveis?.map((resp) => resp.userId) ?? [],
    [selectedObra]
  );

  const equipeAlterada = useMemo(() => {
    if (equipeOriginal.length !== responsavelIds.length) return true;
    const originalSet = new Set(equipeOriginal);
    return responsavelIds.some((id) => !originalSet.has(id));
  }, [equipeOriginal, responsavelIds]);

  const getStatusColor = (status?: ObraStatus) => {
    const statusObj = statusOptions.find((s) => s.value === (status || "ativo"));
    return statusObj?.color || "slate";
  };

  const fetchObras = useCallback(async () => {
    setLoading(true);
    try {
      setErrorMessage(null);
      const res = await fetch("/api/obras", { credentials: "include" });
      const data = await parseJsonOrThrow<Obra[]>(res);
      setObras(data);
    } catch (error) {
      console.error("Erro ao carregar obras:", error);
      setObras([]);
      setErrorMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsuarios = useCallback(async () => {
    setUsuariosLoading(true);
    try {
      const res = await fetch("/api/users?ativo=true", { credentials: "include" });
      const data = await parseJsonOrThrow<UsuarioAtivo[]>(res);
      setUsuarios(data);
      setUsuariosError(null);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      setUsuariosError((error as Error).message);
    } finally {
      setUsuariosLoading(false);
    }
  }, []);

  const fetchAmbientes = useCallback(async (obraId: string) => {
    setAmbientesLoading(true);
    try {
      const res = await fetch(`/api/ambientes?obraId=${obraId}`, {
        credentials: "include",
      });
      const data = await parseJsonOrThrow<AmbienteResumo[]>(res);
      setAmbientesResumo(data);
    } catch (error) {
      console.error("Erro ao carregar ambientes:", error);
      setAmbientesResumo([]);
    } finally {
      setAmbientesLoading(false);
    }
  }, []);

  const resetForm = () => {
    setFormData(emptyForm);
    setResponsavelIds([]);
  };

  const handleCreateObra = async () => {
    if (!canManage) return;
    if (!formData.nome.trim()) {
      alert("O nome da obra é obrigatório");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/obras", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          andarInicial: parseInt(formData.andarInicial) || 1,
          andarFinal: parseInt(formData.andarFinal) || 1,
          responsavelIds,
        }),
      });

      const nova = await parseJsonOrThrow<Obra>(res);
      setObras((prev) => [nova, ...prev]);
      setSaved(true);
      setTimeout(() => {
        setShowCreateModal(false);
        setSaved(false);
        resetForm();
      }, 1000);
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateObra = async () => {
    if (!canManage) return;
    if (!editingObra || !formData.nome.trim()) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/obras/${editingObra._id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          andarInicial: parseInt(formData.andarInicial) || 1,
          andarFinal: parseInt(formData.andarFinal) || 1,
        }),
      });

      const updated = await parseJsonOrThrow<Obra>(res);
      setObras((prev) => prev.map((obra) => (obra._id === updated._id ? updated : obra)));
      setSaved(true);
      setTimeout(() => {
        setShowEditModal(false);
        setSaved(false);
        setEditingObra(null);
        resetForm();
      }, 1000);
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteObra = async (obraId: string) => {
    if (!confirm("Tem certeza que deseja remover esta obra?")) return;

    try {
      const res = await fetch(`/api/obras/${obraId}`, {
        method: "DELETE",
        credentials: "include",
      });
      await parseJsonOrThrow(res);
      setObras((prev) => prev.filter((obra) => obra._id !== obraId));
      if (selectedObraId === obraId) setSelectedObraId(null);
    } catch (error) {
      alert((error as Error).message);
    }
  };

  const handleSalvarEquipe = async () => {
    if (!canManage || !selectedObraId || !equipeAlterada) return;

    setSalvandoEquipe(true);
    try {
      const res = await fetch(`/api/obras/${selectedObraId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responsavelIds }),
      });

      const updated = await parseJsonOrThrow<Obra>(res);
      setObras((prev) => prev.map((obra) => (obra._id === updated._id ? updated : obra)));
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setSalvandoEquipe(false);
    }
  };

  const handleSetObraAtiva = (obraId: string) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACTIVE_OBRA_KEY, obraId);
      window.location.href = "/medicoes";
    }
  };

  const openEditModal = (obra: Obra) => {
    setEditingObra(obra);
    setFormData({
      nome: obra.nome,
      cliente: obra.cliente || "",
      endereco: obra.endereco || "",
      andarInicial: String(obra.andarInicial || 1),
      andarFinal: String(obra.andarFinal || 1),
      status: obra.status || "ativo",
      observacoes: obra.observacoes || "",
    });
    setShowEditModal(true);
  };

  const handleToggleResponsavel = (id: string) => {
    setResponsavelIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    fetchObras();

    if (canManage) {
      fetchUsuarios();
    } else {
      setUsuarios([]);
      setUsuariosError(null);
      setUsuariosLoading(false);
    }

    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(ACTIVE_OBRA_KEY);
      if (stored) {
        setSelectedObraId(stored);
      }
    }
  }, [fetchObras, fetchUsuarios, canManage]);

  useEffect(() => {
    if (filteredObras.length === 0) {
      setSelectedObraId(null);
      return;
    }

    if (!selectedObraId || !filteredObras.some((obra) => obra._id === selectedObraId)) {
      setSelectedObraId(filteredObras[0]._id);
    }
  }, [filteredObras, selectedObraId]);

  useEffect(() => {
    if (selectedObra) {
      setResponsavelIds(selectedObra.responsaveis?.map((r) => r.userId) ?? []);
      fetchAmbientes(selectedObra._id);
    }
  }, [selectedObra, fetchAmbientes]);

  return (
    <AppLayout onNewObra={() => setShowCreateModal(true)}>
      <div className="flex flex-col lg:flex-row">
        <ObraSidebar
          busca={busca}
          onBuscaChange={setBusca}
          statusFiltro={statusFiltro}
          onStatusFiltroChange={(value) => setStatusFiltro(value)}
          statusOptions={statusFilterOptions}
          obras={filteredObras}
          loading={loading}
          errorMessage={errorMessage}
          selectedObraId={selectedObraId}
          onSelectObra={setSelectedObraId}
          getStatusColor={getStatusColor}
          statusLabels={statusOptions}
        />

        <ObraDetails
          obra={selectedObra}
          statusOptions={statusOptions}
          getStatusColor={getStatusColor}
          onEdit={openEditModal}
          onDelete={handleDeleteObra}
          usuarios={usuarios}
          usuariosLoading={usuariosLoading}
          usuariosError={usuariosError}
          responsavelIds={responsavelIds}
          onToggleResponsavel={canManage ? handleToggleResponsavel : undefined}
          onSalvarEquipe={canManage ? handleSalvarEquipe : undefined}
          salvandoEquipe={canManage ? salvandoEquipe : undefined}
          equipeAlterada={canManage ? equipeAlterada : undefined}
          ambienteStats={ambienteStats}
          ambientesRecentes={ambientesRecentes}
          ambientesLoading={ambientesLoading}
          onIrParaMedicoes={handleSetObraAtiva}
          canManage={canManage}
        />
      </div>

      {canManage && (
        <>
          <ObraFormModal
            open={showCreateModal}
            title="Nova Obra"
            formData={formData}
            onChange={(field, value) => setFormData((prev) => ({ ...prev, [field]: value }))}
            statusOptions={statusOptions}
            onClose={() => {
              setShowCreateModal(false);
              resetForm();
            }}
            onSubmit={handleCreateObra}
            saving={saving}
            saved={saved}
            primaryLabel="Criar Obra"
            usuarios={usuarios}
            responsavelIds={responsavelIds}
            onToggleResponsavel={handleToggleResponsavel}
          />

          <ObraFormModal
            open={Boolean(showEditModal && editingObra)}
            title="Editar Obra"
            formData={formData}
            onChange={(field, value) => setFormData((prev) => ({ ...prev, [field]: value }))}
            statusOptions={statusOptions}
            onClose={() => {
              setShowEditModal(false);
              setEditingObra(null);
              resetForm();
            }}
            onSubmit={handleUpdateObra}
            saving={saving}
            saved={saved}
            primaryLabel="Salvar Alterações"
          />
        </>
      )}
    </AppLayout>
  );
}
