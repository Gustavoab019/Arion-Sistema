import type { IAmbiente } from "./models/Ambiente";
import type { IObra } from "./models/Obra";
import Notification from "./models/Notification";
import User, { type UserRole } from "./models/User";
import type { NotificationType } from "@/src/types/notification";
import mongoose from "mongoose";

type StatusNotificationConfig = {
  roles: UserRole[];
  tipo: NotificationType;
  titulo: string;
  mensagem: (amb: IAmbiente) => string;
  actionUrl: string;
};

const STATUS_NOTIFICATION_CONFIG: Record<string, StatusNotificationConfig> = {
  aguardando_validacao: {
    roles: ["gerente"],
    tipo: "medicao_finalizada",
    titulo: "Medição pronta para revisão",
    mensagem: (amb) =>
      `${amb.codigo} em ${amb.obra ?? "obra"} foi finalizado e aguarda validação.`,
    actionUrl: "/medicoes",
  },
  producao_calha: {
    roles: ["producao"],
    tipo: "producao",
    titulo: "Calha liberada para produção",
    mensagem: (amb) =>
      `${amb.codigo} (${amb.obra ?? "obra"}) precisa iniciar produção de calhas.`,
    actionUrl: "/calhas",
  },
  producao_cortina: {
    roles: ["producao"],
    tipo: "producao",
    titulo: "Cortina aguardando costura",
    mensagem: (amb) =>
      `${amb.codigo} (${amb.obra ?? "obra"}) está pronto para produção de cortinas.`,
    actionUrl: "/cortinas",
  },
  aguardando_instalacao: {
    roles: ["instalador"],
    tipo: "instalacao",
    titulo: "Ambiente aguardando instalação",
    mensagem: (amb) =>
      `${amb.codigo} (${amb.obra ?? "obra"}) está liberado para agendamento de instalação.`,
    actionUrl: "/instalacao",
  },
};

export async function dispatchNotificationsForStatus(
  ambiente: IAmbiente | null,
  status?: string
) {
  if (!ambiente || !status) return;
  const config = STATUS_NOTIFICATION_CONFIG[status];
  if (!config) return;

  const destinatarios = await User.find({
    role: { $in: config.roles },
    ativo: true,
  }).select("_id role");

  if (!destinatarios.length) return;

  const docs = destinatarios.map((user) => ({
    titulo: config.titulo,
    mensagem: config.mensagem(ambiente),
    tipo: config.tipo,
    statusDestino: status,
    ambienteId: ambiente._id,
    ambienteCodigo: ambiente.codigo,
    obraId: ambiente.obraId,
    obraNome: ambiente.obra,
    actionUrl: config.actionUrl,
    recipientId: user._id,
  }));

  await Notification.insertMany(docs, { ordered: false });
}

/**
 * Envia notificações para usuários adicionados a uma obra
 */
export async function notifyObraResponsaveis(
  obra: IObra,
  novosResponsavelIds: mongoose.Types.ObjectId[]
) {
  if (!novosResponsavelIds.length) return;

  const docs = novosResponsavelIds.map((userId) => ({
    titulo: "Você foi adicionado a uma obra",
    mensagem: `Você foi adicionado à obra "${obra.nome}". Verifique os trabalhos disponíveis.`,
    tipo: "info" as NotificationType,
    obraId: obra._id,
    obraNome: obra.nome,
    actionUrl: "/medicoes",
    recipientId: userId,
  }));

  await Notification.insertMany(docs, { ordered: false }).catch((err) => {
    console.error("Erro ao criar notificações de obra:", err);
  });
}
