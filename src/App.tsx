import { useMemo, useState } from 'react';
import {
  calcMargemCredito,
  calcMargemPronto,
  formatCurrency,
  formatPercent,
  round2,
  solverPrecoCompraMax,
  type ObjetivoMargem,
  type TipoVenda
} from './calculations';
import './App.css';

type Mode = 'margem' | 'solver';

interface Scenario {
  nome: string;
  precoVenda: number;
  precoCompra: number;
  tipoVenda: TipoVenda;
  incluirCustoCredito: boolean;
}

const scenarios: Scenario[] = [
  { nome: 'iPhone 13 (Crédito)', precoVenda: 520, precoCompra: 400, tipoVenda: 'credito', incluirCustoCredito: true },
  { nome: 'Samsung S22 (Pronto)', precoVenda: 430, precoCompra: 320, tipoVenda: 'pronto', incluirCustoCredito: false },
  { nome: 'Xiaomi 12 (Crédito sem custo)', precoVenda: 300, precoCompra: 220, tipoVenda: 'credito', incluirCustoCredito: false }
];

const parseNumber = (value: string): number => Number(value.replace(',', '.'));

function App() {
  const [mode, setMode] = useState<Mode>('margem');
  const [precoVendaInput, setPrecoVendaInput] = useState('500');
  const [precoCompraInput, setPrecoCompraInput] = useState('350');
  const [tipoVenda, setTipoVenda] = useState<TipoVenda>('credito');
  const [incluirCustoCredito, setIncluirCustoCredito] = useState(true);
  const [objetivoTipo, setObjetivoTipo] = useState<ObjetivoMargem>('eur');
  const [objetivoValorInput, setObjetivoValorInput] = useState('40');
  const [copyStatus, setCopyStatus] = useState('');

  const precoVenda = parseNumber(precoVendaInput);
  const precoCompra = parseNumber(precoCompraInput);
  const objetivoValor = parseNumber(objetivoValorInput);

  const resultadoModo1 = useMemo(() => {
    if (!Number.isFinite(precoVenda) || !Number.isFinite(precoCompra)) {
      return null;
    }

    return tipoVenda === 'credito'
      ? calcMargemCredito(precoVenda, precoCompra, incluirCustoCredito)
      : calcMargemPronto(precoVenda, precoCompra);
  }, [precoVenda, precoCompra, tipoVenda, incluirCustoCredito]);

  const resultadoSolver = useMemo(() => {
    if (!Number.isFinite(precoVenda) || !Number.isFinite(objetivoValor)) {
      return null;
    }

    return solverPrecoCompraMax({
      precoVenda,
      tipoVenda,
      incluirCustoCredito,
      objetivoTipo,
      objetivoValor: objetivoTipo === 'percent' ? objetivoValor / 100 : objetivoValor,
      tolerancia: 0.01,
      maxIteracoes: 200
    });
  }, [precoVenda, tipoVenda, incluirCustoCredito, objetivoTipo, objetivoValor]);

  const resultadoFinal = mode === 'margem' ? resultadoModo1 : null;
  const solverMargemResultado =
    mode === 'solver' && resultadoSolver?.sucesso && resultadoSolver.precoCompraMax !== null
      ? tipoVenda === 'credito'
        ? calcMargemCredito(precoVenda, resultadoSolver.precoCompraMax, incluirCustoCredito)
        : calcMargemPronto(precoVenda, resultadoSolver.precoCompraMax)
      : null;

  const warnings =
    mode === 'margem'
      ? resultadoFinal?.warnings ?? []
      : solverMargemResultado?.warnings ?? (resultadoSolver && !resultadoSolver.sucesso ? [resultadoSolver.mensagem] : []);

  const summaryText = useMemo(() => {
    const lines = [
      `Modo: ${mode === 'margem' ? 'Calcular Margem' : 'Preço Máximo de Compra'}`,
      `Tipo venda: ${tipoVenda === 'credito' ? 'A crédito' : 'Pronto pagamento'}`,
      `Preço venda: ${formatCurrency(precoVenda)}`
    ];

    if (mode === 'margem') {
      lines.push(`Preço compra: ${formatCurrency(precoCompra)}`);
      if (resultadoFinal) {
        lines.push(`IVA Margem: ${formatCurrency(round2(resultadoFinal.ivaMargem))}`);
        lines.push(`Custo Crédito: ${formatCurrency(round2(resultadoFinal.custoCredito))}`);
        lines.push(`Margem: ${formatCurrency(round2(resultadoFinal.margem))}`);
        lines.push(
          `Margem%: ${resultadoFinal.margemPercent === null ? '--' : formatPercent(round2(resultadoFinal.margemPercent * 100))}`
        );
      }
    } else if (resultadoSolver) {
      lines.push(`Objetivo: ${objetivoTipo === 'eur' ? 'Margem em EUR' : 'Margem %'}`);
      lines.push(`Valor objetivo: ${objetivoTipo === 'eur' ? formatCurrency(objetivoValor) : `${objetivoValor.toFixed(2)}%`}`);
      lines.push(`Preço máximo compra: ${formatCurrency(resultadoSolver.precoCompraMax)}`);
      lines.push(`Mensagem: ${resultadoSolver.mensagem}`);
    }

    return lines.join('\n');
  }, [mode, tipoVenda, precoVenda, precoCompra, resultadoFinal, resultadoSolver, objetivoTipo, objetivoValor]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopyStatus('Resumo copiado com sucesso.');
    } catch {
      setCopyStatus('Não foi possível copiar automaticamente.');
    }
    setTimeout(() => setCopyStatus(''), 2000);
  };

  const applyScenario = (scenario: Scenario) => {
    setMode('margem');
    setPrecoVendaInput(String(scenario.precoVenda));
    setPrecoCompraInput(String(scenario.precoCompra));
    setTipoVenda(scenario.tipoVenda);
    setIncluirCustoCredito(scenario.incluirCustoCredito);
  };

  return (
    <main className="container">
      <h1>Calculador de Margens - Telemóveis Usados (PT)</h1>

      <section className="card controls">
        <div className="row">
          <label>
            Modo
            <select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
              <option value="margem">1) Margem por preço de compra/venda</option>
              <option value="solver">2) Preço máximo de compra por margem alvo</option>
            </select>
          </label>

          <label>
            Tipo de venda
            <select
              value={tipoVenda}
              onChange={(e) => {
                const value = e.target.value as TipoVenda;
                setTipoVenda(value);
                if (value === 'credito') {
                  setIncluirCustoCredito(true);
                }
              }}
            >
              <option value="credito">A crédito</option>
              <option value="pronto">Pronto pagamento</option>
            </select>
          </label>
        </div>

        <div className="row">
          <label>
            Preço de Venda (EUR)
            <input type="number" min="0" step="0.01" value={precoVendaInput} onChange={(e) => setPrecoVendaInput(e.target.value)} />
          </label>

          {mode === 'margem' && (
            <label>
              Preço de Compra (EUR)
              <input type="number" step="0.01" value={precoCompraInput} onChange={(e) => setPrecoCompraInput(e.target.value)} />
            </label>
          )}

          {mode === 'solver' && (
            <>
              <label>
                Objetivo de margem
                <select value={objetivoTipo} onChange={(e) => setObjetivoTipo(e.target.value as ObjetivoMargem)}>
                  <option value="eur">Quero margem em EUR</option>
                  <option value="percent">Quero margem %</option>
                </select>
              </label>

              <label>
                {objetivoTipo === 'eur' ? 'Margem desejada (EUR)' : 'Margem desejada (%)'}
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={objetivoValorInput}
                  onChange={(e) => setObjetivoValorInput(e.target.value)}
                />
              </label>
            </>
          )}
        </div>

        {tipoVenda === 'credito' && (
          <label className="toggle">
            <input
              type="checkbox"
              checked={incluirCustoCredito}
              onChange={(e) => setIncluirCustoCredito(e.target.checked)}
            />
            Incluir custo de crédito
          </label>
        )}
      </section>

      <section className="card outputs">
        <h2>Resultados</h2>

        <div className="grid-results">
          <article>
            <h3>IVA da Margem</h3>
            <strong>
              {formatCurrency(
                round2(mode === 'margem' ? resultadoFinal?.ivaMargem ?? NaN : solverMargemResultado?.ivaMargem ?? NaN)
              )}
            </strong>
          </article>

          {tipoVenda === 'credito' && (
            <article>
              <h3>Custo do Crédito</h3>
              <strong>
                {formatCurrency(
                  round2(mode === 'margem' ? resultadoFinal?.custoCredito ?? NaN : solverMargemResultado?.custoCredito ?? NaN)
                )}
              </strong>
            </article>
          )}

          <article>
            <h3>Margem (EUR)</h3>
            <strong>{formatCurrency(round2(mode === 'margem' ? resultadoFinal?.margem ?? NaN : solverMargemResultado?.margem ?? NaN))}</strong>
          </article>

          <article>
            <h3>Margem (%)</h3>
            <strong>
              {mode === 'margem'
                ? resultadoFinal?.margemPercent === null || !resultadoFinal
                  ? '--'
                  : formatPercent(round2(resultadoFinal.margemPercent * 100))
                : solverMargemResultado?.margemPercent == null
                  ? '--'
                  : formatPercent(round2(solverMargemResultado.margemPercent * 100))}
            </strong>
          </article>

          {mode === 'solver' && (
            <article className="highlight">
              <h3>Preço máximo de compra</h3>
              <strong>{formatCurrency(resultadoSolver?.precoCompraMax ?? null)}</strong>
              <small>
                {resultadoSolver?.mensagem} (iterações: {resultadoSolver?.iteracoes ?? 0})
              </small>
            </article>
          )}
        </div>

        {warnings.length > 0 && (
          <ul className="warnings">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        )}

        <button type="button" onClick={handleCopy} className="copy-btn">
          Copiar resumo
        </button>
        {copyStatus && <p className="copy-status">{copyStatus}</p>}
      </section>

      <section className="card">
        <h2>Cenários rápidos (clique para preencher)</h2>
        <table>
          <thead>
            <tr>
              <th>Cenário</th>
              <th>Venda</th>
              <th>Compra</th>
              <th>Tipo</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map((scenario) => (
              <tr key={scenario.nome}>
                <td>{scenario.nome}</td>
                <td>{formatCurrency(scenario.precoVenda)}</td>
                <td>{formatCurrency(scenario.precoCompra)}</td>
                <td>{scenario.tipoVenda === 'credito' ? 'Crédito' : 'Pronto'}</td>
                <td>
                  <button type="button" onClick={() => applyScenario(scenario)}>
                    Usar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card assumptions">
        <h2>Resumo dos pressupostos</h2>
        <ul>
          <li>IVA da margem = (PreçoVenda - PreçoCompra) / 0,23.</li>
          <li>Crédito: Margem = PreçoVenda - CustoCrédito - IVA - PreçoCompra.</li>
          <li>Pronto pagamento: Receita líquida = 0,95 × PreçoVenda.</li>
          <li>Solver por bisseção no intervalo [0, PreçoVenda], tolerância 0,01 EUR e 200 iterações.</li>
        </ul>
      </section>
    </main>
  );
}

export default App;
