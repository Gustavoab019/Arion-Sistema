export type NotificationType =
  | "medicao_finalizada"
  | "producao"
  | "instalacao"
  | "info";

export type AppNotification = {
  _id: string;
  titulo: string;
  mensagem: string;
  tipo: NotificationType;
  statusDestino?: string;
  ambienteId?: string;
  ambienteCodigo?: string;
  obraId?: string;
  obraNome?: string;
  actionUrl?: string;
  createdAt: string;
  readAt?: string | null;
};
