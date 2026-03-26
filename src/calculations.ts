export type TipoVenda = 'credito' | 'pronto';
export type ObjetivoMargem = 'eur' | 'percent';

const IVA_DIVISOR = 0.23;
const TAXA_CREDITO = 0.065;
const AJUSTE_PRONTO = 0.95;

export interface ResultadoMargem {
  ivaMargem: number;
  custoCredito: number;
  receitaLiquidaVenda: number;
  margem: number;
  margemPercent: number | null;
  warnings: string[];
}

export interface SolverParams {
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

export interface ResultadoSolver {
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
  objetivoValor: number;
  objetivoValor: number; // EUR ou fração (ex: 0.2 para 20%)
  tolerancia?: number;
  maxIteracoes?: number;
}

export interface SolverResultado {
  sucesso: boolean;
  precoCompraMax: number | null;
  margemCalculada: number | null;
  margemPercentCalculada: number | null;
  iteracoes: number;
  mensagem: string;
}

export const round2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

export const calcIvaMargem = (precoVenda: number, precoCompra: number): number =>
  (precoVenda - precoCompra) / IVA_DIVISOR;

export const calcCredito = (precoVenda: number): number => TAXA_CREDITO * precoVenda;

export const calcPrecoVendaPorCusto = (precoCusto: number): number | null => {
  if (!Number.isFinite(precoCusto) || precoCusto < 0) {
    return null;
  }

  return (precoCusto + 20.5) / 0.85;
};


const generateWarnings = (precoVenda: number, precoCompra: number, margem: number): string[] => {
  const warnings: string[] = [];

  if (precoCompra >= precoVenda) {
    warnings.push('Preço de compra maior ou igual ao preço de venda: a margem tende a ser negativa.');
  }

  if (precoCompra <= 0) {
    warnings.push('Preço de compra deve ser maior que 0 para calcular margem %.');
  }

  if (margem < 0) {
    warnings.push('Atenção: a margem calculada está negativa.');
  }

  return warnings;
};

/* =========================
   Helpers

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
   IVA da Margem (REGRA FINAL)
   Base IVA = (precoVenda - precoCompra)
   IVA incluído: IVA = margemBruta - (margemBruta / 1.23)
   (custo do crédito NÃO entra no apuramento do IVA)

const calcIvaMargem = (precoVenda: number, precoCompra: number): number => {
  const margemBruta = precoVenda - precoCompra;
  if (!Number.isFinite(margemBruta) || margemBruta <= 0) return 0;
  return margemBruta - margemBruta / 1.23;
};

/* =========================
   Margem — Crédito
   Margem = (PV - PC) - IVA_margem - CustoCredito
   Margem% = Margem / PC

export const calcMargemCredito = (
  precoVenda: number,
  precoCompra: number,
  incluirCustoCredito: boolean
): ResultadoMargem => {
  const ivaMargem = calcIvaMargem(precoVenda, precoCompra);
  const custoCredito = incluirCustoCredito ? calcCredito(precoVenda) : 0;
  const margem = precoVenda - custoCredito - ivaMargem - precoCompra;
  const margemPercent = precoCompra > 0 ? margem / precoCompra : null;

  return {
    ivaMargem,
    custoCredito,
    receitaLiquidaVenda: precoVenda,
    margem,
    margemPercent,
    warnings: generateWarnings(precoVenda, precoCompra, margem)
  };
};

export const calcMargemPronto = (precoVenda: number, precoCompra: number): ResultadoMargem => {
  const ivaMargem = calcIvaMargem(precoVenda, precoCompra);
  const receitaLiquidaVenda = AJUSTE_PRONTO * precoVenda;
  const margem = receitaLiquidaVenda - ivaMargem - precoCompra;
  const margemPercent = precoCompra > 0 ? margem / precoCompra : null;

  return {
    ivaMargem,
    custoCredito: 0,
    receitaLiquidaVenda,
    margem,
    margemPercent,
    warnings: generateWarnings(precoVenda, precoCompra, margem)
  };
};

const calcByTipo = (
  precoVenda: number,
  precoCompra: number,
  tipoVenda: TipoVenda,
  incluirCustoCredito: boolean
): ResultadoMargem => {
  if (tipoVenda === 'credito') {
    return calcMargemCredito(precoVenda, precoCompra, incluirCustoCredito);
  }

  return calcMargemPronto(precoVenda, precoCompra);
};

export const solverPrecoCompraMax = ({
  precoVenda,
  tipoVenda,
  incluirCustoCredito,
  objetivoTipo,
  objetivoValor,
  tolerancia = 0.01,
  maxIteracoes = 200
}: SolverParams): SolverResultado => {
  if (precoVenda <= 0 || !Number.isFinite(objetivoValor)) {
    return {
      sucesso: false,
      precoCompraMax: null,
      margemCalculada: null,
      margemPercentCalculada: null,
      iteracoes: 0,
      mensagem: 'Parâmetros inválidos: preço de venda deve ser > 0 e objetivo numérico.'
    };
  }

  const lower = 0;
  const upper = precoVenda;

  const diffToTarget = (precoCompra: number): number => {
    const r = calcByTipo(precoVenda, precoCompra, tipoVenda, incluirCustoCredito);
    if (objetivoTipo === 'eur') {
      return r.margem - objetivoValor;
    }

    if (precoCompra <= 0 || r.margemPercent === null) {
      return Number.POSITIVE_INFINITY;
    }

    return r.margemPercent - objetivoValor;
  };

  const lowVal = diffToTarget(lower + 1e-9);
  const highVal = diffToTarget(upper);

  if (!Number.isFinite(lowVal) || !Number.isFinite(highVal) || lowVal * highVal > 0) {
    return {
      sucesso: false,
      precoCompraMax: null,
      margemCalculada: null,
      margemPercentCalculada: null,
      iteracoes: 0,
      mensagem: 'Objetivo de margem inalcançável no intervalo [0, PreçoVenda].'
    };
  }

  let left = lower;
  let right = upper;
  let mid = 0;
  let iter = 0;

  while (iter < maxIteracoes) {
    mid = (left + right) / 2;
    const value = diffToTarget(mid);

    if (Math.abs(value) <= tolerancia || Math.abs(right - left) <= tolerancia) {
      const finalResult = calcByTipo(precoVenda, mid, tipoVenda, incluirCustoCredito);
      return {
        sucesso: true,
        precoCompraMax: round2(mid),
        margemCalculada: round2(finalResult.margem),
        margemPercentCalculada:
          finalResult.margemPercent === null ? null : round2(finalResult.margemPercent * 100),
        iteracoes: iter + 1,
        mensagem: 'Preço máximo de compra encontrado com sucesso.'
      };
    }

    if (value > 0) {
      left = mid;
    } else {
      right = mid;
    }

    iter += 1;
  }

  const finalResult = calcByTipo(precoVenda, mid, tipoVenda, incluirCustoCredito);
  return {
    sucesso: true,
    precoCompraMax: round2(mid),
    margemCalculada: round2(finalResult.margem),
    margemPercentCalculada: finalResult.margemPercent === null ? null : round2(finalResult.margemPercent * 100),
    iteracoes: maxIteracoes,
    mensagem: 'Resultado aproximado: limite de iterações atingido.'
  };
};

export const formatCurrency = (value: number | null): string =>
  value === null || Number.isNaN(value)
    ? '--'
    : value.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 });

export const formatPercent = (value: number | null): string =>
  value === null || Number.isNaN(value) ? '--' : `${value.toFixed(2)}%`;

export const constants = {
  IVA_DIVISOR,
  TAXA_CREDITO,
  AJUSTE_PRONTO
};
  const warnings: string[] = [];

  const custoCredito = incluirCustoCredito ? precoVenda * 0.065 : 0;

  const ivaMargem = calcIvaMargem(precoVenda, precoCompra);

  const margem = (precoVenda - precoCompra) - ivaMargem - custoCredito;

  const margemPercent = precoCompra > 0 ? margem / precoCompra : null;

  if (margem < 0) warnings.push('Atenção: a margem calculada está negativa.');

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
   Margem — Pronto pagamento
   Receita líquida = 0.95 * PV
   IVA continua a ser calculado sobre (PV - PC)
   Margem = (0.95*PV) - IVA_margem - PC
   Margem% = Margem / PC

export const calcMargemPronto = (
  precoVenda: number,
  precoCompra: number
): ResultadoMargem => {
  const warnings: string[] = [];

  const receitaLiquidaVenda = precoVenda * 0.95;

  const ivaMargem = calcIvaMargem(precoVenda, precoCompra);

  const margem = receitaLiquidaVenda - ivaMargem - precoCompra;

  const margemPercent = precoCompra > 0 ? margem / precoCompra : null;

  if (margem < 0) warnings.push('Atenção: a margem calculada está negativa.');

  return {
    margem,
    margemPercent,
    ivaMargem,
    custoCredito: 0,
    receitaLiquidaVenda,
    warnings,
  };
};

/* =========================
   Solver — Preço máximo de compra
   Encontra o maior precoCompra tal que:
     - objetivoTipo='eur'     => margem >= objetivoValor
     - objetivoTipo='percent' => margemPercent >= objetivoValor
   (objetivoValor em percent deve ser dado em FRAÇÃO: 0.20 = 20%)

export const solverPrecoCompraMax = (params: SolverParams): ResultadoSolver => {
  const {
    precoVenda,
    tipoVenda,
    incluirCustoCredito,
    objetivoTipo,
    objetivoValor,
    tolerancia = 0.01,
    maxIteracoes = 200,
  } = params;

  if (!Number.isFinite(precoVenda) || precoVenda <= 0) {
    return {
      sucesso: false,
      precoCompraMax: null,
      iteracoes: 0,
      mensagem: 'Preço de venda inválido.',
    };
  }

  let low = 0;
  let high = precoVenda; // não faz sentido comprar acima do PV
  let best: number | null = null;

  const getResultado = (precoCompra: number) => {
    return tipoVenda === 'credito'
      ? calcMargemCredito(precoVenda, precoCompra, incluirCustoCredito)
      : calcMargemPronto(precoVenda, precoCompra);
  };

  const diffObjetivo = (precoCompra: number): number => {
    const r = getResultado(precoCompra);
    if (objetivoTipo === 'eur') return r.margem - objetivoValor;

    if (r.margemPercent === null) return -Infinity;
    return r.margemPercent - objetivoValor;
  };

  for (let i = 0; i < maxIteracoes; i++) {
    const mid = (low + high) / 2;
    const diff = diffObjetivo(mid);

    // Já atingimos objetivo => podemos tentar comprar mais caro
    if (diff >= 0) {
      best = mid;
      low = mid;
    } else {
      high = mid;
    }

    // Para objetivo EUR, tolerância é em EUR; para percent é em FRAÇÃO (ex: 0.001 = 0.1pp)
    if (Math.abs(diff) <= tolerancia) {
      best = mid;
      return {
        sucesso: true,
        precoCompraMax: round2(best),
        iteracoes: i + 1,
        mensagem: 'Preço máximo encontrado com sucesso.',
      };
    }
  }

  if (best === null) {
    return {
      sucesso: false,
      precoCompraMax: null,
      iteracoes: maxIteracoes,
      mensagem: 'Objetivo impossível com os parâmetros atuais.',
    };
  }

  return {
    sucesso: true,
    precoCompraMax: round2(best),
    iteracoes: maxIteracoes,
    mensagem: 'Preço máximo aproximado encontrado.',
  };
};
