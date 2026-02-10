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
  precoVenda: number;
  tipoVenda: TipoVenda;
  incluirCustoCredito: boolean;
  objetivoTipo: ObjetivoMargem;
  objetivoValor: number;
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
  if (precoVenda <= 0 || objetivoValor < 0) {
    return {
      sucesso: false,
      precoCompraMax: null,
      margemCalculada: null,
      margemPercentCalculada: null,
      iteracoes: 0,
      mensagem: 'Parâmetros inválidos: preço de venda deve ser > 0 e objetivo >= 0.'
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

  if (!Number.isFinite(lowVal) || !Number.isFinite(highVal) || lowVal < 0 || highVal > 0) {
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
