# Dashboard animado — Gestão Finance

## Brief e direção

Dashboard web de controle financeiro pessoal, em português e com valores em reais. O pedido é adicionar animações seguindo as cores já definidas. Implementação direta sobre a interface existente, preservando autenticação, operações e cálculos.

Referência principal: identidade em `docs/rebranding.md`, dashboard existente e composição financeira do login em `components/ui/finance-illustration.tsx`. A consulta Refero de estilos e telas foi tentada, mas retornou assinatura inativa. As referências de execução da skill `refero-design` (`motion.md`, `typography.md` e `visual-workflow.md`) fundamentam movimento, hierarquia e validação.

## Reference lock

- Preservar fundo grafite `#101113`, superfícies `#181a1d` e `#202226`, bordas finas e CTA off-white.
- Manter sálvia e rosé como cores financeiras. O fluxo continua usando `#a7d8b8` para receitas e `#e6aaaa` para despesas.
- Manter sans de sistema e numerais tabulares, com saldo como primeiro nível de leitura.
- Usar apenas gráficos e ícones nativos, sem imagens ou dados financeiros adicionais inventados.
- Movimento com propósito: entrada dos painéis, continuidade dos valores ao filtrar, seleção de navegação e feedback de controles.
- Evitar neon, brilhos, loops decorativos, contagem acessível de valores intermediários e truncamento de cifras.

## Decisões

| Decisão | Fonte e papel | Motivo |
| --- | --- | --- |
| Saldo em card maior, anel e distribuição da receita | Hierarquia do dashboard e ilustração financeira existente | Facilitar leitura do que sobrou e da proporção usada |
| Quatro indicadores secundários em duas linhas | Indicadores existentes; craft de tipografia | Dar espaço para valores e notas sem mudar as fórmulas |
| Contador visual com valor final separado para leitor de tela | Pedido de animação; `motion.md` | Mostrar continuidade sem anunciar valores intermediários |
| Entrada sutil por viewport e transição de progresso | `motion.md`, níveis 1–3 | Conectar atualização de dados e estado visual |
| Colunas para fluxo e linha com sinal para saldo | Gráficos existentes e seus seis meses | Preservar comparações; distinguir valores acima/abaixo do zero |
| Tooltips por mouse, foco e toque; tabela acessível | Padrões dos gráficos existentes; acessibilidade de controles | Permitir consultar valores exatos em todos os dispositivos |
| Categorias clicáveis e faixa para limpar filtros | Filtros existentes | Tornar a exploração visível e reversível |
| Navegação com seleção animada e estado por rolagem | Navegação lateral/inferior existente | Manter orientação ao percorrer o dashboard |
| Track neutro sem receita | Semântica das fórmulas existentes | Evitar aparentar economia de 100% quando a taxa é indisponível |
| Movimento reduzido em CSS e JavaScript | `motion.md`, seção 6 | Respeitar a preferência do sistema |

## Implementação

- `dashboard-motion.tsx`: números, painéis, progresso e anel de economia.
- `finance-charts.tsx` e CSS Module: seis meses de receitas/despesas e saldo, tooltips e tabelas acessíveis.
- `dashboard-navigation.tsx` e CSS Module: navegação com seleção animada.
- `app/page.js` e `app/globals.css`: integração, distribuição dos cards e estados responsivos.

## Validação

Validação em 2 de novembro de 2026, com a demonstração fictícia, sem enviar gravações ao banco:

- Desktop e celular conferidos visualmente contra o reference lock. Canvas, tipografia, cores financeiras e CTA preservados.
- Viewports de 320, 390, 768, 1024 e 1440 px sem transbordamento horizontal da página ou dos painéis. A tabela de movimentações mantém rolagem própria.
- Outubro: receitas de R$ 6.000,00, despesas de R$ 3.428,90 e saldo de R$ 2.571,10. Setembro: R$ 5.600,00, R$ 3.775,00 e R$ 1.825,00.
- Clique em Moradia: despesas de R$ 2.000,00. Busca Farmácia: R$ 95,00. Filtro de receitas: R$ 6.000,00 em receitas e zero em despesas. Limpar filtros e mês sem dados conferidos.
- Tooltips por foco, clique e primeiro toque em tela móvel, valores exatos e fechamento por Escape conferidos.
- Navegação móvel e demonstração somente leitura preservadas. Ação de criar meta na demonstração continua pedindo conta, sem salvar.
- Preferência de movimento reduzido verificada em CSS e JavaScript. Nenhum erro JavaScript registrado durante a navegação.
- Revisão independente cobriu semântica financeira, ausência de receita, negativos, tooltips, responsividade e preservação da paleta.
- `npm run build`, `npm run typecheck` e `git diff --check` passaram.
