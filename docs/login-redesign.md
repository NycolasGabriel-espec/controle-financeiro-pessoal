# Gestão Finance — login

## Direção

Login web de controle financeiro pessoal, em português, com apresentação profissional e clean. O pedido atual do usuário é integrar o componente React enviado com o tema do projeto. Os dois anexos são idênticos e contêm `SpaceLogin`; essa referência fornecida pelo usuário substitui a composição anterior como autoridade visual principal.

A implementação adapta o componente à identidade grafite da Gestão Finance. Não foi criado um novo mockup no Figma para esta integração. Na etapa anterior, as ferramentas Figma estavam limitadas pelo plano Starter e a pesquisa Refero estava indisponível por assinatura inativa.

## Reference lock

Fonte principal: pedido atual do usuário e componente `SpaceLogin` dos dois anexos idênticos. A identidade existente em `docs/rebranding.md` define as cores e a linguagem do produto. Apoio de acabamento: referências locais da skill `refero-design`, `color.md` §§0 e 2, `typography.md` §§0–3 e `craft-details.md` §§1–2.

- Preservar o fundo `#101113`, superfícies grafite, texto claro e CTA off-white.
- Preservar a composição central de `SpaceLogin`, com formulário de largura máxima de 400–420 px, estrelas estáticas neutras e horizonte discreto.
- Usar vidro grafite sem os filtros SVG de deslocamento pesados do componente original. Superfícies, transparência e bordas mantêm a legibilidade dos controles.
- Usar uma família sans de sistema com pesos consistentes; título principal de 32, 29 ou 27 px, conforme a largura da tela, e texto de apoio de 13–14 px.
- Substituir o astronauta por `FinanceIllustration`, uma ilustração financeira nativa com valores explicitamente ilustrativos, saldo, receitas, despesas e reserva de emergência. Verde e rosé mantêm papéis financeiros.
- Campos de 52 px com raio de 14 px, labels visíveis, foco por teclado, autocomplete e botão funcional para revelar senha. CTA principal off-white.
- Oferecer cadastro pelo link abaixo do formulário e preservar o acesso à demonstração. Em telas menores, priorizar o formulário e ocultar a ilustração lateral.
- Conectar os callbacks à autenticação real do Supabase, com erros visíveis e estados de carregamento. Remover o timeout que simulava sucesso no exemplo.
- Não inserir “lembrar de mim”, logins sociais ou recuperação de senha sem comportamento implementado. Evitar neon, depoimentos fictícios e animação decorativa contínua.

## Estrutura da integração

Os componentes ficam em `components/ui`, com TypeScript e Tailwind disponíveis para a integração. A utilidade `cn` combina classes; CSS Modules isolam os estilos específicos do login e da ilustração, preservando os formulários do dashboard. Não há dependência de providers ou componentes shadcn para o funcionamento de `SpaceLogin`.

| Decisão | Fonte / regra | Objetivo |
| --- | --- | --- |
| Formulário central, vidro e composição atmosférica | `SpaceLogin` enviado pelo usuário | Preservar a referência solicitada |
| Grafite, bordas finas e CTA claro | Pedido de adaptação ao tema; identidade existente; `color.md` §§0 e 2 | Integrar a referência ao produto |
| Tipografia neutra e espaço consistente | Identidade existente; `typography.md` §§0–3 | Clareza e acabamento profissional |
| Ilustração financeira no lugar do astronauta | Pedido do usuário; propósito do produto | Comunicar finanças com valores explicitamente ilustrativos |
| Estrelas estáticas e ausência de filtros pesados | Adaptação da referência ao produto | Manter o ambiente visual com menor custo de renderização |
| Labels, autocomplete e revelação de senha | `craft-details.md` §§1–2 | Facilitar acesso e navegação por teclado |
| Callbacks reais e mensagens de erro | Fluxos existentes de autenticação | Evitar sucesso simulado e controles sem função |
| CSS restrito à autenticação | Estrutura existente do projeto | Preservar os formulários do dashboard |

## Validação

Validado em 2 de novembro de 2026, após integrar `SpaceLogin`:

- `npm run build`, `npm run typecheck` e `git diff --check` passaram.
- Interface conferida em 320, 390, 768, 1024 e 1440 px, sem transbordamento horizontal. O título permanece visível; a ilustração lateral é ocultada até 1000 px.
- Revelar senha muda o tipo do campo; alternar para cadastro volta a ocultá-la e aplica `autocomplete="new-password"`. O campo mantém label acessível própria, hint associado, obrigatoriedade e mínimo de 8 caracteres.
- Enviar o formulário vazio usa a validação nativa e foca o e-mail. Navegar por Tab alcança a senha e destaca a borda do campo.
- Demonstração somente leitura e retorno ao login conferidos, sem gravar dados.
- Callbacks de carregamento/erro e regras para movimento reduzido revisados no código. Não foram submetidos login ou cadastro reais nem simuladas falhas de rede.
- Prévia visual registrada em desktop e celular, usando a versão compilada.
