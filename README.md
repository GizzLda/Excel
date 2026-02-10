# Calculador de Margens para Telemóveis Usados (Portugal)

 codex/create-web-app-to-analyze-mobile-price-margins-7qrwkk
Aplicação web em **React + TypeScript + Vite** para calcular margens de revenda de telemóveis usados com regra interna de IVA da margem, com UI em Tailwind e componentes estilo shadcn/ui.

Aplicação web em **React + TypeScript + Vite** para calcular margens de revenda de telemóveis usados com regra interna de IVA da margem.
 main

## Funcionalidades

- **Modo 1:** calcular margem a partir de preço de compra e venda.
- **Modo 2:** calcular **preço máximo de compra** dado preço de venda e meta de margem (EUR ou %).
- Tipo de venda:
  - **A crédito** (com toggle para incluir custo de crédito)
  - **Pronto pagamento**
- Exibição destacada de:
  - IVA da margem
  - Custo de crédito (quando aplicável)
  - Margem em EUR e %
- Avisos automáticos para margem negativa e entradas de risco.
- Botão **Copiar resumo**.
- Tabela com 3 cenários de preenchimento rápido.

codex/create-web-app-to-analyze-mobile-price-margins-7qrwkk

## UI e design system

- TailwindCSS para layout e tokens visuais.
- Componentes locais estilo shadcn/ui em `src/components/ui/` (Card, Button, Input, Select, Switch e Segmented Control).
- Layout responsivo em 2 colunas no desktop e 1 coluna em mobile.


main
## Fórmulas implementadas

1. **IVA da margem**

```txt
IVA_margem = (PreçoVenda - PreçoCompra) / 0,23
```

2. **Venda a crédito**

```txt
CustoCredito = 0,065 * PreçoVenda
Margem = PreçoVenda - CustoCredito - IVA_margem - PreçoCompra
Margem% = Margem / PreçoCompra
```

3. **Pronto pagamento**

```txt
ReceitaLiquidaVenda = 0,95 * PreçoVenda
Margem = ReceitaLiquidaVenda - IVA_margem - PreçoCompra
Margem% = Margem / PreçoCompra
```

## Solver (Modo 2)

O solver calcula o preço máximo de compra com **bisseção**:

- intervalo: `[0, PreçoVenda]`
- tolerância: `0,01`
- máximo de iterações: `200`
- detecta casos impossíveis e retorna mensagem clara.

## Ajustar percentagens

As constantes ficam em `src/calculations.ts`:

- `TAXA_CREDITO = 0.065`
- `AJUSTE_PRONTO = 0.95`
- `IVA_DIVISOR = 0.23`

## Testes

Foram incluídos testes unitários para:

- cálculo em crédito
- cálculo em pronto pagamento
- solver para objetivo em EUR
- solver para objetivo em %
- caso impossível

## Instalação e execução

```bash
npm install
npm run dev
```

Para testes:

```bash
npm run test
```
