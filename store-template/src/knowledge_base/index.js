// Base de conhecimento ReplyMesh — usada pelo Help Center e pelo RAG da Karina
// Cada entrada tem: title, keywords[], sections[], faq[]

export const KB = {
  introducao: {
    title: 'Introdução ao ReplyMesh',
    keywords: ['replymesh', 'sistema', 'o que é', 'como funciona', 'começar', 'início', 'introdução'],
    description: 'O ReplyMesh é uma plataforma SaaS completa para gestão de negócios de alimentação. Gerencie pedidos, delivery, PDV, mesas, estoque, motoboys, WhatsApp e muito mais em um único painel.',
    sections: [
      {
        title: 'O que é o ReplyMesh?',
        content: 'O ReplyMesh é um sistema de gestão completo para deliverys, restaurantes, hamburgueiras, pizzarias, docerias e qualquer negócio de alimentação. Com ele você gerencia pedidos online, mesa presencial, PDV balcão, motoboys, estoque, financeiro e comunicação com clientes via WhatsApp — tudo em um único lugar.',
      },
      {
        title: 'Como acessar o sistema',
        content: 'Acesse o painel administrativo pelo link da sua loja (ex: demohamburgueria.replymesh.cloud). Faça login com seu e-mail e senha. Após o login, você será redirecionado automaticamente para a área principal do seu perfil.',
      },
      {
        title: 'Perfis de usuário',
        content: 'O sistema possui os seguintes perfis:\n• Admin — acesso total a todas as funcionalidades\n• Caixa (Cashier) — acessa PDV, pedidos, mesas, caixa e relatórios\n• Atendente (Attendant) — acessa pedidos, mesas e clientes\n• Garçom (Waiter) — acessa mesas e comandas\n• Cozinha (Kitchen) — visualiza pedidos na tela KDS\n• Motoboy — acessa área de entregas',
      },
    ],
    faq: [
      { q: 'O sistema funciona no celular?', a: 'Sim. O painel administrativo é responsivo e funciona bem em celulares e tablets modernos.' },
      { q: 'Preciso instalar alguma coisa?', a: 'Não. O ReplyMesh funciona direto no navegador. Basta acessar o link da sua loja.' },
      { q: 'Quantos usuários posso cadastrar?', a: 'Depende do seu plano. No plano START você pode criar atendentes, garçons e caixa. No PRO o limite é maior. Consulte Configurações > Usuários.' },
    ],
  },

  primeiros_passos: {
    title: 'Primeiros Passos',
    keywords: ['primeiros passos', 'configurar', 'setup', 'começar', 'cadastrar', 'primeiro pedido'],
    description: 'Guia rápido para configurar sua loja e receber os primeiros pedidos.',
    sections: [
      {
        title: 'Checklist inicial',
        steps: [
          'Acesse Configurações e preencha os dados da loja (nome, endereço, telefone)',
          'Cadastre as categorias do seu cardápio em Cardápio > Categorias',
          'Cadastre os produtos com fotos, descrição e preços',
          'Configure as áreas de entrega e taxas de delivery',
          'Conecte o WhatsApp em Comunicação > WhatsApp',
          'Crie os usuários da equipe em Administração > Usuários',
          'Abra o caixa em Financeiro > Caixa antes de iniciar as vendas',
        ],
      },
      {
        title: 'Receber o primeiro pedido',
        content: 'Assim que o caixa estiver aberto e os produtos cadastrados, sua loja estará pronta para receber pedidos. O link público do seu cardápio online é: sualoja.replymesh.cloud. Compartilhe com seus clientes pelo WhatsApp, Instagram e Google.',
      },
    ],
    faq: [
      { q: 'Como adicionar logo da loja?', a: 'Acesse Configurações > Aparência e faça upload da logo.' },
      { q: 'Meu cardápio está online automaticamente?', a: 'Sim, assim que você cadastrar os produtos eles ficam visíveis no cardápio público.' },
    ],
  },

  dashboard: {
    title: 'Dashboard',
    keywords: ['dashboard', 'painel', 'resumo', 'visão geral', 'indicadores', 'vendas hoje', 'gráfico'],
    description: 'O Dashboard é a tela inicial do painel admin. Exibe um resumo em tempo real das vendas, pedidos e indicadores do dia.',
    sections: [
      {
        title: 'O que o Dashboard mostra?',
        content: 'O Dashboard apresenta:\n• Total de pedidos do dia\n• Faturamento do dia\n• Pedidos por status (pendente, confirmado, entregue, cancelado)\n• Produtos mais vendidos\n• Gráfico de vendas por período\n• Clientes recentes',
      },
      {
        title: 'Como interpretar os indicadores',
        content: 'Os cards no topo mostram os valores do dia atual. Use os filtros de data para comparar períodos. O gráfico de vendas ajuda a identificar os horários de pico e os dias mais movimentados.',
      },
    ],
    faq: [
      { q: 'Os dados do dashboard são em tempo real?', a: 'Sim. O dashboard atualiza automaticamente conforme os pedidos chegam.' },
      { q: 'Como ver o faturamento de outro dia?', a: 'Use o seletor de data no topo do dashboard para filtrar o período desejado.' },
    ],
  },

  pedidos: {
    title: 'Pedidos',
    keywords: ['pedidos', 'order', 'entregar', 'confirmar', 'cancelar', 'status', 'delivery', 'retirada', 'pedido pendente', 'aceitar pedido'],
    description: 'Central de gerenciamento de todos os pedidos recebidos. Inclui delivery, retirada e mesa.',
    sections: [
      {
        title: 'Tipos de pedido',
        content: '• Delivery — pedido com entrega no endereço do cliente\n• Retirada — cliente retira no local\n• Mesa — pedido feito na mesa do restaurante\n• PDV/Balcão — venda direta no caixa',
      },
      {
        title: 'Fluxo de um pedido delivery',
        steps: [
          'Cliente faz pedido pelo cardápio online',
          'Pedido aparece em Pedidos com status "Pendente"',
          'Confirme o pedido — status muda para "Confirmado"',
          'Cozinha prepara — status "Em preparo"',
          'Atribua um motoboy para a entrega',
          'Marque como "Saiu para entrega"',
          'Pedido entregue — marque como "Entregue"',
        ],
      },
      {
        title: 'Como cancelar um pedido',
        content: 'Abra o pedido desejado, clique em "Cancelar pedido" e informe o motivo. O cliente pode receber notificação automática via WhatsApp se esta opção estiver configurada.',
      },
      {
        title: 'Filtros de pedidos',
        content: 'Use os filtros por data, status, tipo de pedido e método de pagamento para encontrar pedidos específicos.',
      },
    ],
    faq: [
      { q: 'Posso editar um pedido após confirmação?', a: 'Sim, desde que o pedido ainda não tenha sido entregue. Abra o pedido e clique em Editar.' },
      { q: 'O cliente recebe notificação quando o pedido é confirmado?', a: 'Sim, se o WhatsApp estiver conectado. Configure os templates em Comunicação > WhatsApp > Templates.' },
      { q: 'Como imprimir o pedido?', a: 'Abra o pedido e clique em Imprimir. O sistema abre uma janela de impressão do navegador.' },
    ],
  },

  mesas: {
    title: 'Gestão de Mesas',
    keywords: ['mesa', 'mesas', 'comanda', 'garçom', 'qr code', 'table', 'abrir mesa', 'fechar mesa', 'sessão', 'qr'],
    description: 'Sistema completo para gestão de mesas, comandas e atendimento presencial.',
    sections: [
      {
        title: 'Como funciona a Gestão de Mesas',
        content: 'Cada mesa tem um QR Code único. O cliente escaneia o QR, acessa o cardápio digital da mesa e faz o pedido. O pedido aparece no painel do garçom e é enviado para a cozinha (KDS). Ao final, o caixa fecha a comanda e recebe o pagamento.',
      },
      {
        title: 'Configurar mesas',
        steps: [
          'Acesse Mesas no menu lateral',
          'Clique em "Nova Mesa" e defina o número/nome',
          'O sistema gera automaticamente um QR Code para cada mesa',
          'Imprima ou exiba o QR Code na mesa física',
        ],
      },
      {
        title: 'Abrir e fechar comanda',
        content: 'Ao escanear o QR Code, uma sessão de mesa é aberta automaticamente. O garçom pode também abrir manualmente no painel. Para fechar: acesse a mesa, revise os itens, aplique desconto se necessário e finalize o pagamento.',
      },
      {
        title: 'Funções do garçom',
        content: 'O garçom tem acesso à tela de Mesas, pode visualizar e gerenciar comandas, enviar itens para a cozinha e atualizar status dos pedidos. O garçom NÃO tem acesso ao PDV, relatórios ou configurações.',
      },
    ],
    faq: [
      { q: 'Posso ter várias mesas ao mesmo tempo abertas?', a: 'Sim. Cada mesa tem sua própria sessão e comanda independente.' },
      { q: 'O que acontece se a internet cair?', a: 'Pedidos já feitos ficam salvos. Novos pedidos ficam pendentes até a reconexão.' },
      { q: 'O cliente precisa criar conta para pedir pela mesa?', a: 'Não. O cliente escaneia o QR e pede diretamente, sem necessidade de cadastro.' },
    ],
  },

  estoque: {
    title: 'Controle de Estoque',
    keywords: ['estoque', 'inventory', 'produto', 'quantidade', 'mínimo', 'entrada', 'saída', 'movimentação', 'baixa'],
    description: 'Controle de entradas e saídas de estoque com alertas de nível mínimo.',
    sections: [
      {
        title: 'Cadastrar itens de estoque',
        steps: [
          'Acesse Estoque > Itens de Estoque',
          'Clique em "Novo Item"',
          'Informe nome, unidade de medida, quantidade atual e estoque mínimo',
          'Salve o item',
        ],
      },
      {
        title: 'Registrar movimentações',
        content: 'Em Estoque > Movimentações você pode registrar entradas (compras) e saídas (consumo). Informe o item, quantidade e motivo. O sistema atualiza o saldo automaticamente.',
      },
      {
        title: 'Alertas de estoque mínimo',
        content: 'Quando um item atinge o nível mínimo definido, ele aparece em destaque na lista de estoque. Configure notificações para receber alertas automáticos.',
      },
    ],
    faq: [
      { q: 'O estoque baixa automaticamente quando vendo?', a: 'Depende da configuração. Produtos vinculados ao estoque podem ter baixa automática. Configure em Produtos > Editar produto > Estoque.' },
      { q: 'Posso exportar o relatório de estoque?', a: 'Sim. Use o botão Exportar CSV na tela de Estoque.' },
    ],
  },

  caixa: {
    title: 'Caixa (Cash Register)',
    keywords: ['caixa', 'cash', 'abrir caixa', 'fechar caixa', 'sangria', 'suprimento', 'troco', 'saldo', 'conferência'],
    description: 'Gestão completa do caixa: abertura, movimentações, sangria, suprimento e fechamento.',
    sections: [
      {
        title: 'Abrir o caixa',
        steps: [
          'Acesse Financeiro > Caixa',
          'Clique em "Abrir Caixa"',
          'Informe o saldo inicial (valor em espécie no caixa)',
          'Confirme a abertura',
        ],
      },
      {
        title: 'Registrar movimentações',
        content: '• Suprimento — adicionar dinheiro ao caixa (ex: trocos)\n• Sangria — retirar dinheiro do caixa (ex: pagamento de fornecedor)\nAmbas as operações ficam registradas no histórico.',
      },
      {
        title: 'Fechar o caixa',
        steps: [
          'Acesse Financeiro > Caixa',
          'Clique em "Fechar Caixa"',
          'Informe o saldo físico contado',
          'O sistema calcula a diferença (sobra ou falta)',
          'Confirme o fechamento',
        ],
      },
      {
        title: 'Relatório de caixa',
        content: 'Após fechar o caixa, o sistema gera um relatório com: saldo inicial, entradas por forma de pagamento, sangrias, suprimentos, saldo esperado e saldo informado.',
      },
    ],
    faq: [
      { q: 'Preciso abrir o caixa para usar o PDV?', a: 'Sim. O PDV bloqueia vendas se o caixa estiver fechado.' },
      { q: 'Posso ter mais de um caixa aberto ao mesmo tempo?', a: 'Depende do seu plano. Verifique em Configurações > Plano.' },
      { q: 'O que é sangria?', a: 'Sangria é a retirada de dinheiro do caixa durante o expediente. Ex: pagar um fornecedor em dinheiro ou reduzir o troco acumulado.' },
    ],
  },

  pdv: {
    title: 'PDV / Balcão',
    keywords: ['pdv', 'balcão', 'venda', 'caixa abrir', 'vender', 'dinheiro', 'pix', 'cartão', 'troco', 'desconto', 'imprimir comprovante', 'pos', 'venda rápida'],
    description: 'Sistema de ponto de venda para vendas rápidas no balcão. Ideal para lanchonetes, cafés e atendimento presencial.',
    sections: [
      {
        title: 'Pré-requisito: caixa aberto',
        content: 'Antes de usar o PDV, é obrigatório ter um caixa aberto. Acesse Financeiro > Caixa > Abrir Caixa.',
      },
      {
        title: 'Como fazer uma venda no PDV',
        steps: [
          'Acesse PDV / Balcão no menu lateral',
          'Busque o produto pelo nome ou categoria',
          'Clique no produto para adicionar ao carrinho',
          'Ajuste a quantidade se necessário',
          'Aplique desconto se quiser (botão Desconto)',
          'Clique em "Finalizar Venda"',
          'Escolha a forma de pagamento: Dinheiro, PIX ou Cartão',
          'No dinheiro: informe o valor recebido para calcular o troco',
          'Confirme a venda',
        ],
      },
      {
        title: 'Imprimir comprovante',
        content: 'Após confirmar a venda, o sistema abre automaticamente a modal de comprovante. Clique em "Imprimir" para imprimir o recibo. O comprovante inclui: número da venda, itens, total, forma de pagamento, troco e data/hora.',
      },
      {
        title: 'Quem pode usar o PDV?',
        content: 'Apenas usuários com perfil Admin ou Caixa (cashier) têm acesso ao PDV. Atendentes (garçons, funcionários) não têm acesso ao PDV por segurança.',
      },
      {
        title: 'Diferença PDV x Delivery',
        content: 'PDV é para vendas presenciais no balcão — pagamento imediato, sem frete, sem endereço. Delivery é para pedidos com entrega no endereço do cliente.',
      },
    ],
    faq: [
      { q: 'Posso aplicar desconto no PDV?', a: 'Sim. Antes de finalizar a venda, clique no botão Desconto e informe o valor ou percentual.' },
      { q: 'O PDV integra com o estoque?', a: 'Sim, se o produto tiver estoque vinculado, a venda no PDV baixa o estoque automaticamente.' },
      { q: 'Como cancelar uma venda no PDV?', a: 'Vendas já finalizadas no PDV devem ser canceladas em Pedidos, encontrando o pedido com origem PDV.' },
      { q: 'O PDV envia notificação no WhatsApp?', a: 'Não. Vendas no PDV são presenciais e não disparam notificações automáticas de WhatsApp.' },
    ],
  },

  motoboy: {
    title: 'Motoboys',
    keywords: ['motoboy', 'entregador', 'entrega', 'delivery', 'atribuir', 'rota', 'financeiro motoboy'],
    description: 'Cadastro e gestão de motoboys. Atribuição de entregas, acompanhamento e financeiro.',
    sections: [
      {
        title: 'Cadastrar motoboy',
        steps: [
          'Acesse Entrega > Motoboys',
          'Clique em "Novo Motoboy"',
          'Preencha nome, telefone e dados do veículo',
          'Salve o cadastro',
        ],
      },
      {
        title: 'Atribuir entrega a um motoboy',
        content: 'Em Pedidos, abra o pedido com status "Confirmado" ou "Em preparo". Na seção Entrega, selecione o motoboy disponível e clique em Atribuir. O motoboy recebe notificação no app.',
      },
      {
        title: 'App do Motoboy',
        content: 'O motoboy acessa o app pelo link: sualoja.replymesh.cloud/motoboy. Ele faz login com o próprio e-mail e senha. No app ele vê as entregas atribuídas, pode confirmar coleta e entrega.',
      },
      {
        title: 'Financeiro do motoboy',
        content: 'O sistema registra todas as corridas e valores por motoboy. Acesse Entrega > Motoboys > [nome] > Financeiro para ver o histórico e calcular pagamentos.',
      },
    ],
    faq: [
      { q: 'O motoboy precisa instalar o app?', a: 'Não. O app do motoboy é web — basta acessar o link pelo celular.' },
      { q: 'Posso ter vários motoboys ao mesmo tempo?', a: 'Sim, sem limite de motoboys cadastrados.' },
    ],
  },

  whatsapp: {
    title: 'WhatsApp',
    keywords: ['whatsapp', 'conectar', 'desconectar', 'qr code', 'mensagem automática', 'notificação', 'evolution', 'instância'],
    description: 'Integração com WhatsApp via Evolution API. Envio automático de notificações de pedidos.',
    sections: [
      {
        title: 'Conectar o WhatsApp',
        steps: [
          'Acesse Comunicação > WhatsApp',
          'Clique em "Conectar WhatsApp"',
          'Um QR Code será exibido na tela',
          'Abra o WhatsApp no celular > Dispositivos Conectados > Conectar dispositivo',
          'Aponte a câmera para o QR Code',
          'Aguarde a confirmação de conexão',
        ],
      },
      {
        title: 'Notificações automáticas',
        content: 'Após conectar, o sistema envia automaticamente:\n• Confirmação de pedido recebido\n• Pedido em preparo\n• Pedido saiu para entrega\n• Pedido entregue\n\nConfigure quais notificações enviar em WhatsApp > Configurações.',
      },
      {
        title: 'Desconectar o WhatsApp',
        content: 'Em Comunicação > WhatsApp, clique em "Desconectar". A sessão é encerrada. Para reconectar, siga o processo de conexão novamente com um novo QR Code.',
      },
      {
        title: 'WhatsApp desconectou sozinho',
        content: 'Isso acontece quando o celular fica sem internet ou o WhatsApp é desconectado manualmente no celular. Solução: reconecte pelo painel usando um novo QR Code.',
      },
    ],
    faq: [
      { q: 'Posso usar o mesmo número do WhatsApp para outros fins?', a: 'Tecnicamente sim, mas não é recomendado. Mantenha um número dedicado para o sistema.' },
      { q: 'O sistema usa WhatsApp Business?', a: 'Sim, é compatível com WhatsApp Business e WhatsApp comum.' },
      { q: 'O envio automático tem custo extra?', a: 'Não. O envio de notificações automáticas está incluso no plano.' },
      { q: 'Por que o QR Code expirou?', a: 'O QR Code tem validade de 60 segundos. Recarregue a página para gerar um novo.' },
    ],
  },

  marketing: {
    title: 'Marketing WhatsApp',
    keywords: ['marketing', 'campanha', 'disparo', 'broadcast', 'mensagem em massa', 'clientes', 'marketing whatsapp'],
    description: 'Envio de mensagens em massa para clientes via WhatsApp. Campanhas de marketing direto.',
    sections: [
      {
        title: 'Criar uma campanha',
        steps: [
          'Acesse Comunicação > Marketing WhatsApp',
          'Clique em "Nova Campanha"',
          'Defina o nome da campanha',
          'Selecione o público-alvo (todos os clientes, últimos compradores, etc.)',
          'Escreva a mensagem',
          'Adicione imagem opcional',
          'Defina a data/hora de envio ou envie imediatamente',
          'Confirme e inicie o disparo',
        ],
      },
      {
        title: 'Boas práticas',
        content: '• Envie no máximo 1-2 campanhas por semana\n• Personalize com o nome do cliente quando possível\n• Evite mensagens muito longas — seja objetivo\n• Inclua um call-to-action claro (ex: "Peça agora: sualoja.replymesh.cloud")\n• Respeite o horário comercial',
      },
    ],
    faq: [
      { q: 'Quantas mensagens posso disparar por dia?', a: 'Respeite os limites do WhatsApp. O excesso pode bloquear o número. Recomendamos no máximo 200/dia para números novos.' },
      { q: 'Posso ver quem recebeu?', a: 'Sim. A campanha mostra status de envio, entregue e lido.' },
    ],
  },

  recuperador: {
    title: 'Recuperador de Vendas',
    keywords: ['recuperador', 'recuperar', 'carrinho abandonado', 'abandono', 'sales recovery', 'reengajamento'],
    description: 'Sistema de recuperação de carrinhos abandonados via WhatsApp. Aumenta a conversão de pedidos não finalizados.',
    sections: [
      {
        title: 'Como funciona',
        content: 'Quando um cliente adiciona produtos ao carrinho mas não finaliza o pedido, o sistema detecta o abandono e envia automaticamente uma mensagem via WhatsApp após o tempo configurado (ex: 30 minutos).',
      },
      {
        title: 'Configurar o recuperador',
        steps: [
          'Acesse Comunicação > Recuperador de Vendas',
          'Ative o recurso',
          'Configure o tempo de espera antes do envio (ex: 30 minutos)',
          'Personalize a mensagem de recuperação',
          'Salve as configurações',
        ],
      },
    ],
    faq: [
      { q: 'O recuperador funciona sem o WhatsApp conectado?', a: 'Não. O WhatsApp precisa estar conectado para o envio das mensagens.' },
      { q: 'Este recurso está disponível em todos os planos?', a: 'O Recuperador de Vendas é um recurso premium. Verifique em Configurações > Plano.' },
    ],
  },

  cupons: {
    title: 'Cupons de Desconto',
    keywords: ['cupom', 'desconto', 'código', 'promoção', 'coupon'],
    description: 'Crie e gerencie cupons de desconto para seus clientes.',
    sections: [
      {
        title: 'Criar um cupom',
        steps: [
          'Acesse Clientes & Promoções > Cupons',
          'Clique em "Novo Cupom"',
          'Defina o código (ex: PROMO10)',
          'Escolha o tipo: percentual ou valor fixo',
          'Informe o valor do desconto',
          'Configure validade e limite de uso',
          'Salve o cupom',
        ],
      },
      {
        title: 'Tipos de desconto',
        content: '• Percentual — ex: 10% de desconto no pedido\n• Valor fixo — ex: R$ 5,00 de desconto\n• Frete grátis — isenta o frete do pedido',
      },
    ],
    faq: [
      { q: 'O cliente pode usar o cupom mais de uma vez?', a: 'Depende do limite configurado. Você pode limitar 1 uso por cliente.' },
      { q: 'O cupom funciona no PDV?', a: 'Não. Cupons são para pedidos online (delivery/retirada). O PDV tem o campo desconto direto na venda.' },
    ],
  },

  roleta: {
    title: 'Roleta de Prêmios',
    keywords: ['roleta', 'wheel', 'prêmio', 'fidelidade', 'girar', 'sorteio'],
    description: 'Roleta gamificada para fidelização de clientes. Clientes ganham giros ao fazer pedidos.',
    sections: [
      {
        title: 'Como funciona a roleta',
        content: 'Clientes que atingem a pontuação mínima configurada (ex: 3 pedidos ou R$ 100 gastos) desbloqueiam um giro na roleta. Os prêmios são cupons, descontos ou brindes que você configura.',
      },
      {
        title: 'Configurar a roleta',
        steps: [
          'Acesse Clientes & Promoções > Roleta',
          'Defina as fatias da roleta e prêmios',
          'Configure a regra para ganhar giros (ex: a cada R$ 50 em pedidos)',
          'Ative a roleta',
        ],
      },
    ],
    faq: [
      { q: 'A roleta está disponível em todos os planos?', a: 'A Roleta é um recurso premium. Verifique seu plano em Configurações.' },
      { q: 'Os prêmios são gerados como cupons?', a: 'Sim. Ao ganhar um prêmio, o sistema gera automaticamente um cupom para o cliente.' },
    ],
  },

  relatorios: {
    title: 'Relatórios',
    keywords: ['relatório', 'report', 'faturamento', 'vendas', 'análise', 'exportar', 'período', 'gráfico', 'desempenho'],
    description: 'Relatórios completos de vendas, produtos, entregas e performance do negócio.',
    sections: [
      {
        title: 'Tipos de relatório',
        content: '• Vendas por período — faturamento diário, semanal, mensal\n• Vendas por produto — quais produtos vendem mais\n• Vendas por forma de pagamento — dinheiro, PIX, cartão\n• Vendas por canal — delivery, retirada, mesa, PDV\n• Relatório de caixa — movimentações e fechamentos',
      },
      {
        title: 'Filtrar relatórios',
        steps: [
          'Acesse Financeiro > Relatórios',
          'Selecione o período: hoje, semana, mês, personalizado',
          'Aplique filtros adicionais se necessário',
          'Visualize os gráficos e tabelas',
          'Exporte em CSV se precisar',
        ],
      },
    ],
    faq: [
      { q: 'Posso exportar os relatórios?', a: 'Sim. Clique em Exportar CSV no canto da tabela.' },
      { q: 'Os relatórios incluem vendas canceladas?', a: 'Por padrão não. Use o filtro de status para incluir cancelados na análise.' },
    ],
  },

  configuracoes: {
    title: 'Configurações',
    keywords: ['configurações', 'settings', 'loja', 'endereço', 'horário', 'taxa', 'pagamento', 'aparência', 'domínio'],
    description: 'Configurações gerais da loja: dados, horários de funcionamento, métodos de pagamento e aparência.',
    sections: [
      {
        title: 'Dados da loja',
        content: 'Acesse Administração > Configurações para editar: nome da loja, CNPJ, endereço, telefone, descrição e logo.',
      },
      {
        title: 'Horários de funcionamento',
        content: 'Configure os dias e horários em que a loja aceita pedidos. Fora do horário, o cardápio fica no modo "Fora do horário" mas ainda visível.',
      },
      {
        title: 'Métodos de pagamento',
        content: 'Habilite os métodos aceitos: Dinheiro, PIX, Cartão de Crédito, Cartão de Débito, Vale Refeição. Para PIX automático, configure a integração com Mercado Pago.',
      },
      {
        title: 'Taxa de entrega',
        content: 'Configure em Entrega > Áreas de Entrega. Você pode ter taxas diferentes por zona/bairro.',
      },
    ],
    faq: [
      { q: 'Como mudar a cor do cardápio?', a: 'Acesse Configurações > Aparência e escolha o template e as cores da sua loja.' },
      { q: 'Posso usar um domínio próprio?', a: 'Sim. Configure em Configurações > Domínio ou entre em contato com o suporte.' },
    ],
  },

  usuarios: {
    title: 'Usuários e Permissões',
    keywords: ['usuário', 'user', 'funcionário', 'permissão', 'senha', 'caixa', 'garçom', 'atendente', 'cozinha', 'cadastrar usuário'],
    description: 'Gerenciamento de usuários da loja e seus níveis de acesso.',
    sections: [
      {
        title: 'Perfis disponíveis',
        content: '• Admin — acesso total\n• Caixa (cashier) — PDV, pedidos, mesas, caixa, relatórios\n• Atendente (employee) — pedidos, mesas, clientes, motoboys\n• Garçom (waiter) — mesas e comandas\n• Cozinha (kitchen) — tela KDS\n• Motoboy — app de entregas',
      },
      {
        title: 'Cadastrar novo usuário',
        steps: [
          'Acesse Administração > Usuários',
          'Clique em "Novo Usuário"',
          'Informe nome, e-mail e perfil (role)',
          'O usuário receberá um e-mail com a senha ou você pode definir',
          'Salve o cadastro',
        ],
      },
    ],
    faq: [
      { q: 'Como resetar a senha de um usuário?', a: 'Acesse Usuários, edite o usuário e defina uma nova senha.' },
      { q: 'Um usuário pode ter mais de um perfil?', a: 'Não. Cada usuário tem um único perfil por loja.' },
    ],
  },
}

// Todos os tópicos em ordem para o menu da Central de Ajuda
export const KB_TOPICS = [
  'introducao',
  'primeiros_passos',
  'dashboard',
  'pedidos',
  'mesas',
  'estoque',
  'caixa',
  'pdv',
  'motoboy',
  'whatsapp',
  'marketing',
  'recuperador',
  'cupons',
  'roleta',
  'relatorios',
  'configuracoes',
  'usuarios',
]

// Busca simples por palavras-chave — usada pelo RAG da Karina
export function searchKnowledge(query) {
  if (!query || query.trim().length < 2) return null

  const q = query.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

  let bestMatch = null
  let bestScore = 0

  for (const key of KB_TOPICS) {
    const entry = KB[key]
    let score = 0

    // Exact keyword match
    for (const kw of entry.keywords) {
      const normalizedKw = kw.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      if (q.includes(normalizedKw)) score += 10
      else if (normalizedKw.split(' ').some(w => q.includes(w) && w.length > 3)) score += 3
    }

    // Title match
    const normalizedTitle = entry.title.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    if (q.includes(normalizedTitle.toLowerCase())) score += 5

    if (score > bestScore) {
      bestScore = score
      bestMatch = key
    }
  }

  if (bestScore === 0) return null
  return KB[bestMatch]
}

// Formata contexto de conhecimento para enviar ao backend da IA
export function buildKarinaContext(query) {
  const entry = searchKnowledge(query)
  if (!entry) return null

  const parts = [`Contexto sobre "${entry.title}" no ReplyMesh:`, entry.description]

  for (const section of (entry.sections || [])) {
    parts.push(`\n${section.title}:`)
    if (section.content) parts.push(section.content)
    if (section.steps) {
      section.steps.forEach((step, i) => parts.push(`${i + 1}. ${step}`))
    }
  }

  if (entry.faq && entry.faq.length) {
    parts.push('\nPerguntas frequentes:')
    entry.faq.forEach(({ q, a }) => parts.push(`P: ${q}\nR: ${a}`))
  }

  return parts.join('\n')
}
