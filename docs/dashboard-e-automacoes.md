# Dashboard e automações — 2 de novembro de 2026

## Entrega

Implementadas as oito propostas do chat “Sugerir melhorias para o dashboard”: extrato paginado/ordenável, comparação equivalente, contas a pagar/receber, previsão explícita, alertas, planejamento de metas, contas/cartões/parcelas e revisão individual do CSV.

Após a base funcional, foram integrados geração de recorrências, renovação de orçamentos, preenchimento por regras pessoais, formatos salvos de CSV, progresso por aportes confirmados, resumos e atualização periódica do painel. CI e Dependabot foram preparados no repositório.

## Direção visual e decisões

A referência principal é o sistema grafite existente em `docs/rebranding.md` e `app/globals.css`. A pesquisa de estilos e telas no Refero retornou `NO_SUBSCRIPTION`; foi usado o caminho de fallback da skill, com `references/craft-details.md` e o produto existente como alvo.

| Decisão | Fonte | Aplicação |
| --- | --- | --- |
| Preservar fundo, superfícies e CTA claro | Rebranding existente | Novos painéis usam os tokens atuais; sem neon nem alteração da marca |
| Previsão e vencimentos próximos ao saldo | Chat indicado pelo usuário | Informações práticas antes dos gráficos |
| Cor acompanhada por texto de estado | Craft de acessibilidade | Pendente, atrasado, pago e recebido têm rótulos explícitos |
| Tabelas com paginação e rolagem própria | Meta de acesso completo; craft de listas | Todas as linhas acessíveis, sem alargar a página em celular |
| Revisão antes de importar | Proposta de CSV | Seleção individual, erros por linha e duplicatas desmarcadas |
| Modais com foco e Escape | Craft de formulários | Foco inicial, contenção do teclado e retorno ao elemento anterior |

## Contabilidade

- `transactions.data` é o vencimento para pendentes; `data_pagamento` define a efetivação quando existe. Registros antigos continuam realizados.
- Receitas, despesas e metas não somam confirmações futuras. A importação e o banco rejeitam novas confirmações no futuro.
- A previsão usa somente compromissos cadastrados e não promete saldo bancário nem extrapola gastos desconhecidos.
- Saldo por conta = saldo inicial + receitas realizadas − despesas realizadas + transferências recebidas − enviadas, a partir da data inicial até hoje.
- Faturas agrupam parcelas pelo vencimento. O pagamento atualiza as próprias parcelas, sem um segundo lançamento de despesa. A data do primeiro vencimento é informada no formulário; dias de fechamento/vencimento são exibidos como referência.
- Aportes são despesas reais vinculadas a uma meta, somadas ao saldo inicial declarado. O app não presume que o saldo do mês foi guardado.

## Banco e rotina

Aplicadas ao projeto `controle-financeiro` as migrações `dashboard_foundation`, `financial_automations` e `account_owner_indexes`.

Todas as tabelas de usuário têm RLS; chaves estrangeiras compostas impedem vínculos com contas, cartões ou metas de outros usuários. Transferências e pagamentos têm validação também nos acessos diretos à API. As funções do navegador são `SECURITY INVOKER`.

`gestao-finance-hourly` está ativo com `5 * * * *`, executando `finance_private.run_scheduled_automations()`. O código calcula as datas em `America/Maceio`. Cada preferência individual começa desligada e é controlada no painel.

A rotina trava a preferência do proprietário durante a execução. Índices e marcadores mensais impedem duplicação e recriação de itens removidos após a geração. Limites existentes são preservados. Uma falha de usuário é registrada na preferência e não impede o processamento dos demais. “Atualizar agora” permite tentar novamente.

Desativar a preferência pausa novas gerações; não cancela contas pendentes já existentes. Recorrências anteriores à ativação não são retroativamente reconhecidas como pagas.

## Verificação

- 15 testes Node cobrem datas/fuso, comparação equivalente, realizados/pendentes, centavos, aportes, paginação, regras, CSV, contas/transferências e faturas.
- `sql/tests/dashboard-invariants.sql` executado com usuários sintéticos e rollback: isolamento RLS, bloqueio de vínculos entre proprietários, rejeição de futuras confirmações/transferências e pagamento de fatura sem duplicação.
- `sql/tests/automation-invariants.sql` executado com rollback: geração pendente, último dia de mês, renovação, preservação de limites, repetição sem duplicação, exclusões preservadas e acesso restrito ao agendamento.
- Execução direta da função do agendador: zero usuários com preferências ativadas e zero falhas. Nenhuma preferência de usuário existente foi ativada em nome dele.
- Auditoria de banco após as migrações: sem alertas de RLS/funções; os dois índices de proprietário apontados pelo verificador de desempenho foram adicionados. Permaneceu a observação preexistente de proteção contra senhas vazadas desabilitada no Auth, fora do escopo desta mudança.
- Verificação visual da demonstração em 390 px: sem transbordamento da página; paginação acessou os 14 registros, ordenação por valor colocou o salário primeiro e filtros do extrato preservaram os dois alertas de orçamento.

## Operação

`npm run check` roda testes, tipos e build com webpack. O workflow de validação usa Node 24 e chaves fictícias para compilar, sem acessar os registros reais. Dependabot propõe atualizações semanais; não aprova nem publica alterações sozinho. A ativação desses dois fluxos depende do envio dos arquivos ao GitHub.

Os arquivos SQL são versionados em `sql/migrations/`, na mesma estrutura já usada pelo projeto. As migrações do servidor não são aplicadas automaticamente por PR; os testes SQL podem ser executados manualmente como postgres e desfazem todas as fixtures ao terminar.
