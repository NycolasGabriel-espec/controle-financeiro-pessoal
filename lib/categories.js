export const expenseCategories = [
  'Alimentação',
  'Supermercado',
  'Restaurantes e delivery',
  'Moradia',
  'Transporte',
  'Saúde',
  'Lazer',
  'Educação',
  'Assinaturas',
  'Compras e vestuário',
  'Cuidados pessoais',
  'Impostos e taxas',
  'Pets',
  'Presentes e doações',
  'Seguros',
  'Cartão de crédito',
  'Outros',
];

export const incomeCategories = [
  'Salário',
  'Freelance',
  'Vendas',
  'Rendimentos',
  'Aluguéis recebidos',
  'Benefícios',
  'Bônus e comissões',
  '13º salário e férias',
  'Participação nos lucros',
  'Presentes e doações recebidas',
  'Distribuição de lucros',
  'Royalties e direitos autorais',
  'Outros',
];

const expenseRules = [
  [/cartao de credito|\bfatura\b(?!.*\b(?:energia|luz|agua|gas|internet|telefone)\b)/, 'Cartão de crédito'],
  [/\b(?:pet|pets|petshop|racao|veterinario|veterinaria|tosa)\b/, 'Pets'],
  [/\b(?:iptu|ipva|imposto|impostos|tributo|tributos|taxa|taxas|cartorio)\b/, 'Impostos e taxas'],
  [/plano de saude|seguro saude|farmacia|medico|consulta|hospital|dentista|academia/, 'Saúde'],
  [/\bseguro(?:s)?\b|\bseguradora\b/, 'Seguros'],
  [/presente|doacao|contribuicao beneficente/, 'Presentes e doações'],
  [/barbeiro|barbearia|salao|cabeleireiro|manicure|pedicure|cosmetico|perfume/, 'Cuidados pessoais'],
  [/roupa|calcado|sapato|tenis|vestuario|acessorio/, 'Compras e vestuário'],
  [/restaurante|delivery|ifood|padaria|\bcafe\b|lanche|lanchonete|pizzaria/, 'Restaurantes e delivery'],
  [/supermercado|\bmercado\b|mercearia|hortifruti|acougue|feira/, 'Supermercado'],
  [/\bcomida\b|\balimentacao\b/, 'Alimentação'],
  [/aluguel|condominio|energia|conta de luz|conta de agua|gas de cozinha|internet residencial/, 'Moradia'],
  [/\buber\b|taxi|onibus|metro|combustivel|gasolina|estacionamento/, 'Transporte'],
  [/netflix|streaming|assinatura|spotify|icloud/, 'Assinaturas'],
  [/cinema|\bshow\b|teatro|viagem|lazer|parque/, 'Lazer'],
  [/curso|escola|faculdade|livro/, 'Educação'],
];

const incomeRules = [
  [/\bpresente(?:s)?\b|\bdoac(?:ao|oes)\b|ajuda familiar/, 'Presentes e doações recebidas'],
  [/\b13[º°o](?!\w)|\b13\s+salario\b|decimo terceiro|ferias/, '13º salário e férias'],
  [/\bplr\b|participacao (?:nos|de) lucros/, 'Participação nos lucros'],
  [/distribuicao (?:de|dos) lucros|lucros (?:distribuidos|recebidos)|retirada de lucros/, 'Distribuição de lucros'],
  [/royalt(?:y|ies)|direitos? autora(?:l|is)|licenciamento/, 'Royalties e direitos autorais'],
  [/\bbonus\b|comiss(?:ao|oes)|gratificac(?:ao|oes)/, 'Bônus e comissões'],
  [/aposentadoria|pensao|auxilio|seguro desemprego|\bbeneficio(?:s)?\b/, 'Benefícios'],
  [/aluguel|alugueis|locacao/, 'Aluguéis recebidos'],
  [/rendimento|dividendo|\bjuros\b|\bjcp\b|provento/, 'Rendimentos'],
  [/\bvenda(?:s)?\b|\bvendid[oa]\b|desapego/, 'Vendas'],
  [/salario|pagamento mensal/, 'Salário'],
  [/freelanc|cliente|projeto|consultoria/, 'Freelance'],
];

export function suggestCategory(description, type = 'despesa') {
  const text = description.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
  const rules = type === 'receita' ? incomeRules : expenseRules;
  return rules.find(([pattern]) => pattern.test(text))?.[1] || '';
}
