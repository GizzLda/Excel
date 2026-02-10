import { describe, expect, it } from 'vitest';
import { calcMargemCredito, calcMargemPronto, solverPrecoCompraMax } from './calculations';

describe('fórmulas base', () => {
  it('calcula margem para crédito com custo', () => {
    const result = calcMargemCredito(500, 350, true);
    expect(result.ivaMargem).toBeCloseTo((500 - 350) / 0.23, 6);
    expect(result.custoCredito).toBeCloseTo(0.065 * 500, 6);
    expect(result.margem).toBeCloseTo(500 - 32.5 - (150 / 0.23) - 350, 6);
  });

  it('calcula margem para pronto pagamento com ajuste de 5%', () => {
    const result = calcMargemPronto(430, 320);
    expect(result.receitaLiquidaVenda).toBeCloseTo(408.5, 6);
    expect(result.margem).toBeCloseTo(408.5 - ((430 - 320) / 0.23) - 320, 6);
  });
});

describe('solver por bisseção', () => {
  it('resolve preço máximo de compra para objetivo em EUR no crédito', () => {
    const result = solverPrecoCompraMax({
      precoVenda: 500,
      tipoVenda: 'credito',
      incluirCustoCredito: true,
      objetivoTipo: 'eur',
      objetivoValor: 40
    });

    expect(result.sucesso).toBe(true);
    expect(result.precoCompraMax).not.toBeNull();
  });

  it('resolve preço máximo de compra para objetivo de margem % no pronto', () => {
    const result = solverPrecoCompraMax({
      precoVenda: 450,
      tipoVenda: 'pronto',
      incluirCustoCredito: false,
      objetivoTipo: 'percent',
      objetivoValor: 0.1
    });

    expect(result.sucesso).toBe(true);
    expect(result.precoCompraMax).not.toBeNull();
  });

  it('retorna falha para caso impossível', () => {
    const result = solverPrecoCompraMax({
      precoVenda: 200,
      tipoVenda: 'credito',
      incluirCustoCredito: true,
      objetivoTipo: 'eur',
      objetivoValor: 10000
    });

    expect(result.sucesso).toBe(false);
    expect(result.mensagem).toContain('inalcançável');
  });
});
