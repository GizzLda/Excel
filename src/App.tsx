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
 codex/create-web-app-to-analyze-mobile-price-margins-7qrwkk
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { SegmentedControl } from './components/ui/segmented-control';
import { Select } from './components/ui/select';
import { Switch } from './components/ui/switch';
import { Toast } from './components/ui/toast';

import './App.css';
 main

type Mode = 'margem' | 'solver';

interface Scenario {
  nome: string;
  precoVenda: number;
  precoCompra: number;
  tipoVenda: TipoVenda;
  incluirCustoCredito: boolean;
}

const scenarios: Scenario[] = [
 codex/create-web-app-to-analyze-mobile-price-margins-7qrwkk
  { nome: 'iPhone 13', precoVenda: 520, precoCompra: 400, tipoVenda: 'credito', incluirCustoCredito: true },
  { nome: 'Samsung S22', precoVenda: 430, precoCompra: 320, tipoVenda: 'pronto', incluirCustoCredito: false },
  { nome: 'Xiaomi 12', precoVenda: 300, precoCompra: 220, tipoVenda: 'credito', incluirCustoCredito: false }

  { nome: 'iPhone 13 (Crédito)', precoVenda: 520, precoCompra: 400, tipoVenda: 'credito', incluirCustoCredito: true },
  { nome: 'Samsung S22 (Pronto)', precoVenda: 430, precoCompra: 320, tipoVenda: 'pronto', incluirCustoCredito: false },
  { nome: 'Xiaomi 12 (Crédito sem custo)', precoVenda: 300, precoCompra: 220, tipoVenda: 'credito', incluirCustoCredito: false }
 main
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
 codex/create-web-app-to-analyze-mobile-price-margins-7qrwkk
  const [toastVisible, setToastVisible] = useState(false);
  const [calcTrigger, setCalcTrigger] = useState(0);

  const [copyStatus, setCopyStatus] = useState('');
 main

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
 codex/create-web-app-to-analyze-mobile-price-margins-7qrwkk
  }, [precoVenda, precoCompra, tipoVenda, incluirCustoCredito, calcTrigger]);

  }, [precoVenda, precoCompra, tipoVenda, incluirCustoCredito]);
 main

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
 codex/create-web-app-to-analyze-mobile-price-margins-7qrwkk
  }, [precoVenda, tipoVenda, incluirCustoCredito, objetivoTipo, objetivoValor, calcTrigger]);

  const resultadoFinal = mode === 'margem' ? resultadoModo1 : null;
  const precoCompraEfetivo = mode === 'solver' ? resultadoSolver?.precoCompraMax ?? null : precoCompra;

  }, [precoVenda, tipoVenda, incluirCustoCredito, objetivoTipo, objetivoValor]);

  const resultadoFinal = mode === 'margem' ? resultadoModo1 : null;
 main
  const solverMargemResultado =
    mode === 'solver' && resultadoSolver?.sucesso && resultadoSolver.precoCompraMax !== null
      ? tipoVenda === 'credito'
        ? calcMargemCredito(precoVenda, resultadoSolver.precoCompraMax, incluirCustoCredito)
        : calcMargemPronto(precoVenda, resultadoSolver.precoCompraMax)
      : null;

 codex/create-web-app-to-analyze-mobile-price-margins-7qrwkk
  const resultadoVisivel = mode === 'margem' ? resultadoFinal : solverMargemResultado;


 main
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
 codex/create-web-app-to-analyze-mobile-price-margins-7qrwkk
    } else {
      lines.push(`Objetivo: ${objetivoTipo === 'eur' ? 'Margem em EUR' : 'Margem em %'}`);
      lines.push(`Valor objetivo: ${objetivoTipo === 'eur' ? formatCurrency(objetivoValor) : `${objetivoValor.toFixed(2)}%`}`);
      lines.push(`Preço máximo de compra: ${formatCurrency(resultadoSolver?.precoCompraMax ?? null)}`);
    }

    if (resultadoVisivel) {
      lines.push(`IVA Margem: ${formatCurrency(round2(resultadoVisivel.ivaMargem))}`);
      lines.push(`Custo Crédito: ${formatCurrency(round2(resultadoVisivel.custoCredito))}`);
      lines.push(`Margem: ${formatCurrency(round2(resultadoVisivel.margem))}`);
      lines.push(
        `Margem %: ${resultadoVisivel.margemPercent === null ? '--' : formatPercent(round2(resultadoVisivel.margemPercent * 100))}`
      );
    }

    return lines.join('\n');
  }, [mode, tipoVenda, precoVenda, precoCompra, objetivoTipo, objetivoValor, resultadoSolver, resultadoVisivel]);

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
 main

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
 codex/create-web-app-to-analyze-mobile-price-margins-7qrwkk
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 1800);
    } catch {
      setToastVisible(false);
    }
  };

  const handleReset = () => {
    setMode('margem');
    setPrecoVendaInput('500');
    setPrecoCompraInput('350');
    setTipoVenda('credito');
    setIncluirCustoCredito(true);
    setObjetivoTipo('eur');
    setObjetivoValorInput('40');
    setCalcTrigger((x) => x + 1);

      setCopyStatus('Resumo copiado com sucesso.');
    } catch {
      setCopyStatus('Não foi possível copiar automaticamente.');
    }
    setTimeout(() => setCopyStatus(''), 2000);
 main
  };

  const applyScenario = (scenario: Scenario) => {
    setMode('margem');
    setPrecoVendaInput(String(scenario.precoVenda));
    setPrecoCompraInput(String(scenario.precoCompra));
    setTipoVenda(scenario.tipoVenda);
    setIncluirCustoCredito(scenario.incluirCustoCredito);
 codex/create-web-app-to-analyze-mobile-price-margins-7qrwkk
    setCalcTrigger((x) => x + 1);
  };

  const receitaBruta = Number.isFinite(precoVenda) ? precoVenda : 0;
  const receitaLiquida =
    tipoVenda === 'pronto'
      ? resultadoVisivel?.receitaLiquidaVenda ?? 0
      : receitaBruta - (resultadoVisivel?.custoCredito ?? 0);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Calculador de Margens · Telemóveis Usados</h1>
          <p className="text-sm text-slate-600">Ferramenta interna para análise de margem com IVA na margem e solver de preço máximo de compra.</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
          <Card>
            <CardHeader>
              <CardTitle>Parâmetros</CardTitle>
              <CardDescription>Defina os inputs e calcule no modo pretendido.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-slate-500">Modo</p>
                <SegmentedControl
                  value={mode}
                  onValueChange={setMode}
                  options={[
                    { value: 'margem', label: 'Modo 1 · Margem' },
                    { value: 'solver', label: 'Modo 2 · Preço máx. compra' }
                  ]}
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-slate-500">Tipo de venda</p>
                <SegmentedControl
                  value={tipoVenda}
                  onValueChange={(value) => {
                    setTipoVenda(value);
                    if (value === 'credito') {
                      setIncluirCustoCredito(true);
                    }
                  }}
                  options={[
                    { value: 'credito', label: 'A crédito' },
                    { value: 'pronto', label: 'Pronto pagamento' }
                  ]}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium">
                  Preço de Venda (EUR)
                  <Input type="number" min="0" step="0.01" value={precoVendaInput} onChange={(e) => setPrecoVendaInput(e.target.value)} />
                </label>

                {mode === 'margem' ? (
                  <label className="space-y-2 text-sm font-medium">
                    Preço de Compra (EUR)
                    <Input type="number" step="0.01" value={precoCompraInput} onChange={(e) => setPrecoCompraInput(e.target.value)} />
                  </label>
                ) : (
                  <label className="space-y-2 text-sm font-medium">
                    Objetivo de margem
                    <Select value={objetivoTipo} onChange={(e) => setObjetivoTipo(e.target.value as ObjetivoMargem)}>
                      <option value="eur">Quero margem em EUR</option>
                      <option value="percent">Quero margem em %</option>
                    </Select>
                  </label>
                )}
              </div>

              {mode === 'solver' && (
                <label className="space-y-2 text-sm font-medium">
                  {objetivoTipo === 'eur' ? 'Margem desejada (EUR)' : 'Margem desejada (%)'}
                  <Input type="number" min="0" step="0.01" value={objetivoValorInput} onChange={(e) => setObjetivoValorInput(e.target.value)} />
                </label>
              )}

              {tipoVenda === 'credito' && (
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <label htmlFor="switch-credito" className="text-sm font-medium">
                    Incluir custo de crédito
                  </label>
                  <Switch id="switch-credito" checked={incluirCustoCredito} onCheckedChange={setIncluirCustoCredito} />
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {scenarios.map((scenario) => (
                  <Button key={scenario.nome} variant="secondary" onClick={() => applyScenario(scenario)}>
                    {scenario.nome}
                  </Button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setCalcTrigger((x) => x + 1)}>Calcular / Atualizar</Button>
                <Button variant="outline" onClick={handleReset}>
                  Limpar
                </Button>
                <Button variant="outline" onClick={handleCopy}>
                  Copiar resumo
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {mode === 'solver' && (
              <Card className="border-indigo-200 bg-indigo-50">
                <CardHeader>
                  <CardDescription>Resultado principal</CardDescription>
                  <CardTitle>Preço máximo de compra</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-indigo-700">{formatCurrency(resultadoSolver?.precoCompraMax ?? null)}</p>
                  <p className="mt-1 text-sm text-indigo-700/80">{resultadoSolver?.mensagem ?? 'Sem cálculo'}</p>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardDescription>Margem</CardDescription>
                  <CardTitle>{formatCurrency(round2(resultadoVisivel?.margem ?? Number.NaN))}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardDescription>Margem %</CardDescription>
                  <CardTitle>
                    {resultadoVisivel?.margemPercent == null ? '--' : formatPercent(round2(resultadoVisivel.margemPercent * 100))}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardDescription>IVA da Margem</CardDescription>
                  <CardTitle>{formatCurrency(round2(resultadoVisivel?.ivaMargem ?? Number.NaN))}</CardTitle>
                </CardHeader>
              </Card>
              {tipoVenda === 'credito' && (
                <Card>
                  <CardHeader>
                    <CardDescription>Custo do Crédito</CardDescription>
                    <CardTitle>{formatCurrency(round2(resultadoVisivel?.custoCredito ?? Number.NaN))}</CardTitle>
                  </CardHeader>
                </Card>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Breakdown</CardTitle>
                <CardDescription>Resumo detalhado dos componentes da margem.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span>+ Receita bruta venda</span><span>{formatCurrency(receitaBruta)}</span></div>
                {tipoVenda === 'pronto' && <div className="flex justify-between"><span>- Ajuste pronto (5%)</span><span>{formatCurrency(round2(precoVenda * 0.05))}</span></div>}
                {tipoVenda === 'credito' && incluirCustoCredito && (
                  <div className="flex justify-between"><span>- Custo crédito (6,5%)</span><span>{formatCurrency(round2(resultadoVisivel?.custoCredito ?? 0))}</span></div>
                )}
                <div className="flex justify-between"><span>- IVA da margem</span><span>{formatCurrency(round2(resultadoVisivel?.ivaMargem ?? 0))}</span></div>
                <div className="flex justify-between"><span>- Preço compra</span><span>{formatCurrency(precoCompraEfetivo)}</span></div>
                <div className="border-t border-slate-200 pt-2 text-base font-semibold flex justify-between"><span>= Margem final</span><span>{formatCurrency(round2(resultadoVisivel?.margem ?? Number.NaN))}</span></div>
                <p className="text-xs text-slate-500">Receita líquida após ajustes: {formatCurrency(round2(receitaLiquida))}</p>
              </CardContent>
            </Card>

            {warnings.length > 0 && (
              <Card className="border-amber-300 bg-amber-50">
                <CardHeader>
                  <CardTitle className="text-amber-900">Avisos</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc space-y-1 pl-4 text-sm text-amber-900">
                    {warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Toast visible={toastVisible} message="Copiado." />

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
 main
    </main>
  );
}

export default App;
