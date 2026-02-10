import { useMemo, useState } from 'react';
import {
  calcMargemCredito,
  calcMargemPronto,
  formatCurrency,
  formatPercent,
  round2,
  solverPrecoCompraMax,
  type ObjetivoMargem,
  type TipoVenda,
} from './calculations';

import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { SegmentedControl } from './components/ui/segmented-control';
import { Select } from './components/ui/select';
import { Switch } from './components/ui/switch';
import { Toast } from './components/ui/toast';

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
  { nome: 'Xiaomi 12 (Crédito sem custo)', precoVenda: 300, precoCompra: 220, tipoVenda: 'credito', incluirCustoCredito: false },
];

const parseNumber = (value: string): number => {
  const normalized = value.replace(',', '.');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : Number.NaN;
};

function App() {
  const [mode, setMode] = useState<Mode>('margem');

  const [precoVendaInput, setPrecoVendaInput] = useState('500');
  const [precoCompraInput, setPrecoCompraInput] = useState('350');

  const [tipoVenda, setTipoVenda] = useState<TipoVenda>('credito');
  const [incluirCustoCredito, setIncluirCustoCredito] = useState(true);

  const [objetivoTipo, setObjetivoTipo] = useState<ObjetivoMargem>('eur');
  const [objetivoValorInput, setObjetivoValorInput] = useState('40');

  const [toastVisible, setToastVisible] = useState(false);
  const [calcTrigger, setCalcTrigger] = useState(0);

  const precoVenda = parseNumber(precoVendaInput);
  const precoCompra = parseNumber(precoCompraInput);
  const objetivoValor = parseNumber(objetivoValorInput);

  const resultadoModo1 = useMemo(() => {
    if (!Number.isFinite(precoVenda) || !Number.isFinite(precoCompra)) return null;

    return tipoVenda === 'credito'
      ? calcMargemCredito(precoVenda, precoCompra, incluirCustoCredito)
      : calcMargemPronto(precoVenda, precoCompra);
  }, [precoVenda, precoCompra, tipoVenda, incluirCustoCredito, calcTrigger]);

  const resultadoSolver = useMemo(() => {
    if (!Number.isFinite(precoVenda) || !Number.isFinite(objetivoValor)) return null;

    return solverPrecoCompraMax({
      precoVenda,
      tipoVenda,
      incluirCustoCredito,
      objetivoTipo,
      objetivoValor: objetivoTipo === 'percent' ? objetivoValor / 100 : objetivoValor,
      tolerancia: 0.01,
      maxIteracoes: 200,
    });
  }, [precoVenda, tipoVenda, incluirCustoCredito, objetivoTipo, objetivoValor, calcTrigger]);

  const solverMargemResultado =
    mode === 'solver' && resultadoSolver?.sucesso && resultadoSolver.precoCompraMax !== null
      ? tipoVenda === 'credito'
        ? calcMargemCredito(precoVenda, resultadoSolver.precoCompraMax, incluirCustoCredito)
        : calcMargemPronto(precoVenda, resultadoSolver.precoCompraMax)
      : null;

  const resultadoVisivel = mode === 'margem' ? resultadoModo1 : solverMargemResultado;

  const precoCompraEfetivo =
    mode === 'solver' ? (resultadoSolver?.precoCompraMax ?? null) : Number.isFinite(precoCompra) ? precoCompra : null;

  const warnings =
    mode === 'margem'
      ? resultadoModo1?.warnings ?? []
      : solverMargemResultado?.warnings ?? (resultadoSolver && !resultadoSolver.sucesso ? [resultadoSolver.mensagem] : []);

  const summaryText = useMemo(() => {
    const lines: string[] = [
      `Modo: ${mode === 'margem' ? 'Calcular Margem' : 'Preço Máximo de Compra'}`,
      `Tipo venda: ${tipoVenda === 'credito' ? 'A crédito' : 'Pronto pagamento'}`,
      `Preço venda: ${formatCurrency(precoVenda)}`,
    ];

    if (mode === 'margem') {
      lines.push(`Preço compra: ${formatCurrency(precoCompra)}`);
    } else {
      lines.push(`Objetivo: ${objetivoTipo === 'eur' ? 'Margem em EUR' : 'Margem em %'}`);
      lines.push(
        `Valor objetivo: ${objetivoTipo === 'eur' ? formatCurrency(objetivoValor) : `${objetivoValor.toFixed(2)}%`}`,
      );
      lines.push(`Preço máximo de compra: ${formatCurrency(resultadoSolver?.precoCompraMax ?? null)}`);
      if (resultadoSolver && !resultadoSolver.sucesso) lines.push(`Mensagem: ${resultadoSolver.mensagem}`);
    }

    if (resultadoVisivel) {
      lines.push(`IVA Margem: ${formatCurrency(round2(resultadoVisivel.ivaMargem))}`);
      lines.push(`Custo Crédito: ${formatCurrency(round2(resultadoVisivel.custoCredito))}`);
      lines.push(`Margem: ${formatCurrency(round2(resultadoVisivel.margem))}`);
      lines.push(
        `Margem %: ${
          resultadoVisivel.margemPercent === null ? '--' : formatPercent(round2(resultadoVisivel.margemPercent * 100))
        }`,
      );
    }

    return lines.join('\n');
  }, [mode, tipoVenda, precoVenda, precoCompra, objetivoTipo, objetivoValor, resultadoSolver, resultadoVisivel]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
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
  };

  const applyScenario = (scenario: Scenario) => {
    setMode('margem');
    setPrecoVendaInput(String(scenario.precoVenda));
    setPrecoCompraInput(String(scenario.precoCompra));
    setTipoVenda(scenario.tipoVenda);
    setIncluirCustoCredito(scenario.incluirCustoCredito);
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
          <p className="text-sm text-slate-600">
            Ferramenta interna para análise de margem com IVA na margem e solver de preço máximo de compra.
          </p>
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
                    { value: 'solver', label: 'Modo 2 · Preço máx. compra' },
                  ]}
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-slate-500">Tipo de venda</p>
                <SegmentedControl
                  value={tipoVenda}
                  onValueChange={(value) => {
                    setTipoVenda(value);
                    if (value === 'credito') setIncluirCustoCredito(true);
                  }}
                  options={[
                    { value: 'credito', label: 'A crédito' },
                    { value: 'pronto', label: 'Pronto pagamento' },
                  ]}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium">
                  Preço de Venda (EUR)
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={precoVendaInput}
                    onChange={(e) => setPrecoVendaInput(e.target.value)}
                  />
                </label>

                {mode === 'margem' ? (
                  <label className="space-y-2 text-sm font-medium">
                    Preço de Compra (EUR)
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={precoCompraInput}
                      onChange={(e) => setPrecoCompraInput(e.target.value)}
                    />
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
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={objetivoValorInput}
                    onChange={(e) => setObjetivoValorInput(e.target.value)}
                  />
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
                  <p className="text-3xl font-bold text-indigo-700">
                    {formatCurrency(resultadoSolver?.precoCompraMax ?? null)}
                  </p>
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
                    {resultadoVisivel?.margemPercent == null
                      ? '--'
                      : formatPercent(round2(resultadoVisivel.margemPercent * 100))}
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
                <div className="flex justify-between">
                  <span>+ Receita bruta venda</span>
                  <span>{formatCurrency(receitaBruta)}</span>
                </div>

                {tipoVenda === 'pronto' && (
                  <div className="flex justify-between">
                    <span>- Ajuste pronto (5%)</span>
                    <span>{formatCurrency(round2(precoVenda * 0.05))}</span>
                  </div>
                )}

                {tipoVenda === 'credito' && incluirCustoCredito && (
                  <div className="flex justify-between">
                    <span>- Custo crédito (6,5%)</span>
                    <span>{formatCurrency(round2(resultadoVisivel?.custoCredito ?? 0))}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>- IVA da margem</span>
                  <span>{formatCurrency(round2(resultadoVisivel?.ivaMargem ?? 0))}</span>
                </div>

                <div className="flex justify-between">
                  <span>- Preço compra</span>
                  <span>{formatCurrency(precoCompraEfetivo)}</span>
                </div>

                <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold">
                  <span>= Margem final</span>
                  <span>{formatCurrency(round2(resultadoVisivel?.margem ?? Number.NaN))}</span>
                </div>

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
    </main>
  );
}

export default App;
