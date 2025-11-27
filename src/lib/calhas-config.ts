/**
 * Configurações de tipos de montagem de calhas (hardcoded para MVP)
 */

export type TipoMontagem =
  | "simples"
  | "dupla_paralela"
  | "dupla_cruzada"
  | "tripla"
  | "painel_fixo_movel"
  | "sistema_quadruplo"
  | "motorizada_ondas"
  | "sistema_misto";

export type PecaCalha = {
  nome: string; // "Fundo", "Frente Esquerda", "Pescoço"
  descricao?: string;
  calcular: (largura: number, desconto: number) => number;
};

export type ConfigMontagem = {
  id: TipoMontagem;
  nome: string;
  descricao: string;
  pecas: PecaCalha[];
};

const clampToZero = (valor: number) => (valor < 0 ? 0 : valor);
const SOBREPOSICAO_CRUZADA = 15;
const PAINEL_FIXO = 30;

// Configurações pré-definidas de tipos de montagem
export const TIPOS_MONTAGEM: ConfigMontagem[] = [
  {
    id: "simples",
    nome: "Calha Simples Individual",
    descricao: "Solução básica com uma calha única e abertura central ou lateral.",
    pecas: [
      {
        nome: "Trilho principal",
        descricao: "Largura total considerando o desconto definido",
        calcular: (largura, desconto) => largura - desconto,
      },
    ],
  },
  {
    id: "dupla_paralela",
    nome: "Calha Dupla Paralela",
    descricao: "Duas vias independentes (blackout + voile) correndo paralelas.",
    pecas: [
      {
        nome: "Trilho blackout",
        descricao: "Via traseira com o desconto aplicado",
        calcular: (largura, desconto) => largura - desconto,
      },
      {
        nome: "Trilho translúcido",
        descricao: "Via frontal para voile/translúcido",
        calcular: (largura, desconto) => clampToZero(largura - desconto - 1),
      },
    ],
  },
  {
    id: "dupla_cruzada",
    nome: "Calhas Cruzadas Duplas",
    descricao: "Duas calhas sobrepostas cruzam no centro (blackout + translúcido).",
    pecas: [
      {
        nome: "Calha de fundo",
        descricao: "Largura total menos o respiro técnico",
        calcular: (largura, desconto) => {
          void desconto;
          return clampToZero(largura - 2);
        },
      },
      {
        nome: "Calha cruzada esquerda",
        descricao: "Metade da largura + 15cm para sobrepor",
        calcular: (largura, desconto) => {
          void desconto;
          return clampToZero(largura / 2 + SOBREPOSICAO_CRUZADA);
        },
      },
      {
        nome: "Calha cruzada direita",
        descricao: "Metade da largura + 15cm para sobrepor",
        calcular: (largura, desconto) => {
          void desconto;
          return clampToZero(largura / 2 + SOBREPOSICAO_CRUZADA);
        },
      },
    ],
  },
  {
    id: "tripla",
    nome: "Sistema Triplo Tradicional",
    descricao: "Duas calhas cruzadas atrás (blackouts) + uma via frontal de voile.",
    pecas: [
      {
        nome: "Blackout cruzado esquerdo",
        descricao: "Metade da largura + sobreposição",
        calcular: (largura, desconto) => {
          void desconto;
          return clampToZero(largura / 2 + SOBREPOSICAO_CRUZADA);
        },
      },
      {
        nome: "Blackout cruzado direito",
        descricao: "Metade da largura + sobreposição",
        calcular: (largura, desconto) => {
          void desconto;
          return clampToZero(largura / 2 + SOBREPOSICAO_CRUZADA);
        },
      },
      {
        nome: "Voile frontal",
        descricao: "Via inteira frontal para o tecido decorativo",
        calcular: (largura, desconto) => largura - desconto,
      },
    ],
  },
  {
    id: "painel_fixo_movel",
    nome: "Painel Fixo + Móvel",
    descricao:
      "Painéis decorativos fixos nas laterais com uma faixa funcional central.",
    pecas: [
      {
        nome: "Painel fixo esquerdo",
        descricao: "Painel decorativo lateral com largura padrão",
        calcular: (largura, desconto) => {
          void largura;
          void desconto;
          return PAINEL_FIXO;
        },
      },
      {
        nome: "Painel móvel central",
        descricao: "Espaço útil descontando painéis fixos e ajustes do gerente",
        calcular: (largura, desconto) =>
          clampToZero(largura - desconto - PAINEL_FIXO * 2),
      },
      {
        nome: "Painel fixo direito",
        descricao: "Painel decorativo lateral com largura padrão",
        calcular: (largura, desconto) => {
          void largura;
          void desconto;
          return PAINEL_FIXO;
        },
      },
    ],
  },
  {
    id: "sistema_quadruplo",
    nome: "Sistema Quádruplo",
    descricao: "Quatro calhas cruzadas (2 blackout + 2 translúcido) para máximo controle.",
    pecas: [
      {
        nome: "Blackout cruzado esquerdo",
        descricao: "Metade da largura + sobreposição",
        calcular: (largura, desconto) => {
          void desconto;
          return clampToZero(largura / 2 + SOBREPOSICAO_CRUZADA);
        },
      },
      {
        nome: "Blackout cruzado direito",
        descricao: "Metade da largura + sobreposição",
        calcular: (largura, desconto) => {
          void desconto;
          return clampToZero(largura / 2 + SOBREPOSICAO_CRUZADA);
        },
      },
      {
        nome: "Translúcido cruzado esquerdo",
        descricao: "Metade da largura + sobreposição extra",
        calcular: (largura, desconto) => {
          void desconto;
          return clampToZero(largura / 2 + SOBREPOSICAO_CRUZADA + 5);
        },
      },
      {
        nome: "Translúcido cruzado direito",
        descricao: "Metade da largura + sobreposição extra",
        calcular: (largura, desconto) => {
          void desconto;
          return clampToZero(largura / 2 + SOBREPOSICAO_CRUZADA + 5);
        },
      },
    ],
  },
  {
    id: "motorizada_ondas",
    nome: "Calha Motorizada Ondas Fixas",
    descricao: "Sistema motorizado com pregas em ondas contínuas.",
    pecas: [
      {
        nome: "Trilho motorizado",
        descricao: "Trilho com automação e ajuste de desconto",
        calcular: (largura, desconto) => largura - desconto,
      },
      {
        nome: "Kit ondas/pregas",
        descricao: "Quantidade proporcional ao vão para manter o desenho",
        calcular: (largura, desconto) => {
          void desconto;
          return clampToZero(largura * 1.1);
        },
      },
    ],
  },
  {
    id: "sistema_misto",
    nome: "Sistema Misto Calha + Estore",
    descricao: "Integra cortina decorativa com estore técnico no mesmo vão.",
    pecas: [
      {
        nome: "Calha decorativa",
        descricao: "Trilho frontal para o cortinado",
        calcular: (largura, desconto) => largura - desconto,
      },
      {
        nome: "Estore integrado",
        descricao: "Estore enrolável alinhado ao vão",
        calcular: (largura, desconto) => {
          void desconto;
          return clampToZero(largura - 1);
        },
      },
    ],
  },
];

/**
 * Busca configuração de montagem por ID
 */
export function getConfigMontagem(tipo: TipoMontagem): ConfigMontagem | undefined {
  return TIPOS_MONTAGEM.find((config) => config.id === tipo);
}

/**
 * Calcula todas as peças para um tipo de montagem específico
 */
export function calcularPecas(
  tipo: TipoMontagem,
  largura: number,
  desconto: number = 0
): { nome: string; largura: number; descricao?: string }[] {
  const config = getConfigMontagem(tipo);
  if (!config) return [];

  return config.pecas.map((peca) => ({
    nome: peca.nome,
    largura: Number(peca.calcular(largura, desconto).toFixed(1)),
    descricao: peca.descricao,
  }));
}

/**
 * Retorna número total de peças para um tipo de montagem
 */
export function getTotalPecas(tipo: TipoMontagem): number {
  const config = getConfigMontagem(tipo);
  return config?.pecas.length || 1;
}
