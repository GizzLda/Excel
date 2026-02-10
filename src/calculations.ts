// src/calculations.ts

export type TipoVenda = 'credito' | 'pronto';
export type ObjetivoMargem = 'eur' | 'percent';

export interface ResultadoMargem {
  margem: number;
  margemPercent: number | null;
  ivaMargem: number;
  custoCredito: number;
  receitaLiquidaVenda: number;
  warnings: string[];
}

export interface SolverResultado {
  sucesso: boolean;
  precoCompraMax: number | null;
  iteracoes: number;
  mensagem: string;
}

interface SolverParams {
  precoVenda: number;
  tipoVenda: TipoVenda;
  incluirCustoCredito: boolean;
  objetivoTipo: ObjetivoMargem;
  objetivoValor: number; // EUR ou fração (ex: 0.2 para 20%)
  tolerancia?: number;
  maxIteracoes?: number;
}

/* =========================
   Helpers
========================= */

export const round2 = (n: number): number =>
  Math.round((n + Number.EPSILON) * 100) / 100;

export const formatCurrency = (n: number | null): string => {
  if (n === null || !Number.isFinite(n)) return '--';
  return n.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });
};

export const formatPercent = (n: number | null): string => {
  if (n === null || !Number.isFinite(n)) return '--';
  return `${n.toFixed(2)}%`;
};

/* =========================
   IVA da margem (REGRA NOVA)
   IVA = (margemBruta - margemBruta / 0.23)
========================= */

const calcIvaMargem = (precoVenda: number, precoCompra: number): number => {
  const margemBruta = precoVenda - precoCompra;
  return margemBruta - margemBruta / 0.23;
};

/* =========================
   Margem – Crédito
========================= */

export const calcMargemCredito = (
  precoVenda: number,
  precoCompra: number,
  incluirCustoCredito: boolean
): ResultadoMargem => {
  const warnings: string[] = [];

  const custoCredito = incluirCustoCredito ? precoVenda * 0.065 : 0;
  const ivaMargem = calcIvaMargem(precoVenda, precoCompra);

  const margem =
    precoVenda -
    custoCredito -
    ivaMargem -
    precoCompra;

  const margemPercent =
    precoCompra > 0 ? margem / precoCompra : null;

  if (margem < 0) {
    warnings.push('Atenção: a margem calculada está negativa.');
  }

  return {
    margem,
    margemPercent,
    ivaMargem,
    custoCredito,
    receitaLiquidaVenda: precoVenda - custoCredito,
    warnings,
  };
};

/* =========================
   Margem – Pronto pagamento
========================= */

export const calcMargemPronto = (
  precoVenda: number,
  precoCompra: number
): ResultadoMargem => {
  const warnings: string[] = [];

  const receitaLiquida = precoVenda * 0.95;
  const ivaMargem = calcIvaMargem(precoVenda, precoCompra);

  const margem =
    receitaLiquida -
    ivaMargem -
    precoCompra;

  const margemPercent =
    precoCompra > 0 ? margem / precoCompra : null;

  if (margem < 0) {
    warnings.push('Atenção: a margem calculada está negativa.');
  }

  return {
    margem,
    margemPercent,
    ivaMargem,
    custoCredito: 0,
    receitaLiquidaVenda: receitaLiquida,
    warnings,
  };
};

/* =========================
   Solver – Preço máx. compra
========================= */

export const solverPrecoCompraMax = (
  params: SolverParams
): SolverResultado => {
  const {
    precoVenda,
    tipoVenda,
    incluirCustoCredito,
    objetivoTipo,
    objetivoValor,
    tolerancia = 0.01,
    maxIteracoes = 200,
  } = params;

  let low = 0;
  let high = precoVenda;
  let mid = 0;

  for (let i = 0; i < maxIteracoes; i++) {
    mid = (low + high) / 2;

    const resultado =
      tipoVenda === 'credito'
        ? calcMargemCredito(precoVenda, mid, incluirCustoCredito)
        : calcMargemPronto(precoVenda, mid);

    const margemAtual =
      objetivoTipo === 'percent'
        ? resultado.margemPercent
        : resultado.margem;

    if (margemAtual === null) {
      return {
        sucesso: false,
        precoCompraMax: null,
        iteracoes: i,
        mensagem: 'Margem inválida.',
      };
    }

    const alvo =
      objetivoTipo === 'percent'
        ? objetivoValor
        : objetivoValor;

    const diff = margemAtual - alvo;

    if (Math.abs(diff) <= tolerancia) {
      return {
        sucesso: true,
        precoCompraMax: round2(mid),
        iteracoes: i + 1,
        mensagem: 'Preço máximo encontrado com sucesso.',
      };
    }

    if (diff > 0) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return {
    sucesso: false,
    precoCompraMax: round2(mid),
    iteracoes: maxIteracoes,
    mensagem: 'Não foi possível atingir o objetivo com a tolerância definida.',
  };
};
