// src/lib/statusValidation.ts

export type AmbienteStatus =
  | "medicao_pendente"
  | "aguardando_validacao"
  | "em_producao"
  | "producao_calha"
  | "producao_cortina"
  | "estoque_deposito"
  | "em_transito"
  | "aguardando_instalacao"
  | "instalado";

// Define allowed transitions for each status
const STATUS_TRANSITIONS: Record<AmbienteStatus, AmbienteStatus[]> = {
  medicao_pendente: ["aguardando_validacao"],
  aguardando_validacao: ["medicao_pendente", "em_producao", "producao_calha"],
  em_producao: ["producao_calha", "producao_cortina"],
  producao_calha: ["producao_cortina", "estoque_deposito"],
  producao_cortina: ["estoque_deposito"],
  estoque_deposito: ["em_transito"],
  em_transito: ["aguardando_instalacao"],
  aguardando_instalacao: ["instalado", "em_transito"], // Can go back to transito if needed
  instalado: [], // Terminal state - no transitions allowed
};

// Special transitions allowed only for gerente role
const GERENTE_TRANSITIONS: Record<AmbienteStatus, AmbienteStatus[]> = {
  medicao_pendente: ["medicao_pendente", "aguardando_validacao", "em_producao", "producao_calha"],
  aguardando_validacao: ["medicao_pendente", "aguardando_validacao", "em_producao", "producao_calha"],
  em_producao: ["aguardando_validacao", "producao_calha", "producao_cortina"],
  producao_calha: ["em_producao", "producao_cortina", "estoque_deposito"],
  producao_cortina: ["producao_calha", "estoque_deposito"],
  estoque_deposito: ["producao_cortina", "em_transito"],
  em_transito: ["estoque_deposito", "aguardando_instalacao"],
  aguardando_instalacao: ["em_transito", "instalado"],
  instalado: ["aguardando_instalacao"], // Gerente can reopen if needed
};

export type ValidationResult = {
  valid: boolean;
  message?: string;
};

/**
 * Validates if a status transition is allowed
 * @param currentStatus Current status of the ambiente
 * @param newStatus New status to transition to
 * @param userRole Role of the user making the change
 * @returns Validation result with message if invalid
 */
export function validateStatusTransition(
  currentStatus: AmbienteStatus | undefined,
  newStatus: AmbienteStatus,
  userRole: string
): ValidationResult {
  // If no status change, always valid
  const current = currentStatus ?? "medicao_pendente";
  if (current === newStatus) {
    return { valid: true };
  }

  // Gerente has more flexibility
  const allowedTransitions = userRole === "gerente"
    ? GERENTE_TRANSITIONS[current]
    : STATUS_TRANSITIONS[current];

  if (!allowedTransitions.includes(newStatus)) {
    const statusLabels: Record<AmbienteStatus, string> = {
      medicao_pendente: "Medição Pendente",
      aguardando_validacao: "Aguardando Validação",
      em_producao: "Em Produção",
      producao_calha: "Produção Calha",
      producao_cortina: "Produção Cortina",
      estoque_deposito: "Estoque/Depósito",
      em_transito: "Em Trânsito",
      aguardando_instalacao: "Aguardando Instalação",
      instalado: "Instalado",
    };

    return {
      valid: false,
      message: `Transição inválida: não é possível mudar de "${statusLabels[current]}" para "${statusLabels[newStatus]}". ${
        userRole === "gerente"
          ? "Entre em contato com o suporte se precisar fazer esta alteração."
          : "Apenas gerentes podem fazer alterações fora do fluxo padrão."
      }`,
    };
  }

  return { valid: true };
}

/**
 * Gets the list of allowed next statuses for a given current status
 * @param currentStatus Current status
 * @param userRole User role
 * @returns Array of allowed next statuses
 */
export function getAllowedNextStatuses(
  currentStatus: AmbienteStatus | undefined,
  userRole: string
): AmbienteStatus[] {
  const current = currentStatus ?? "medicao_pendente";
  return userRole === "gerente"
    ? GERENTE_TRANSITIONS[current]
    : STATUS_TRANSITIONS[current];
}

/**
 * Gets a human-readable label for a status
 * @param status The status
 * @returns Human-readable label
 */
export function getStatusLabel(status: AmbienteStatus): string {
  const labels: Record<AmbienteStatus, string> = {
    medicao_pendente: "Medição Pendente",
    aguardando_validacao: "Aguardando Validação",
    em_producao: "Em Produção",
    producao_calha: "Produção Calha",
    producao_cortina: "Produção Cortina",
    estoque_deposito: "Estoque/Depósito",
    em_transito: "Em Trânsito",
    aguardando_instalacao: "Aguardando Instalação",
    instalado: "Instalado",
  };
  return labels[status];
}
