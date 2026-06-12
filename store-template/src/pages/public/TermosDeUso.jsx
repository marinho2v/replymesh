import { Link } from 'react-router-dom'
import { useCompanyBasePath } from '../../contexts/CompanySlugContext'

export default function TermosDeUso() {
  const basePath = useCompanyBasePath()

  return (
    <div className="min-h-screen bg-white text-gray-800">
      <header className="bg-gray-900 text-white py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to={basePath || '/'} className="text-xl font-bold text-yellow-400 hover:opacity-80">ReplyMesh</Link>
          <span className="text-sm text-gray-400">Documentos Legais</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Termos de Uso</h1>
        <p className="text-sm text-gray-500 mb-8">Última atualização: 11 de junho de 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">1. Aceitação dos Termos</h2>
            <p>Ao acessar e utilizar a plataforma ReplyMesh (&ldquo;Plataforma&rdquo;, &ldquo;Sistema&rdquo;), você (&ldquo;Cliente&rdquo;, &ldquo;Usuário&rdquo;, &ldquo;Contratante&rdquo;) concorda integralmente com estes Termos de Uso. Caso não concorde, interrompa imediatamente o uso do sistema.</p>
            <p className="mt-2">A ReplyMesh é uma solução SaaS (Software como Serviço) desenvolvida e operada pela empresa responsável pela plataforma (&ldquo;ReplyMesh&rdquo;, &ldquo;nós&rdquo;, &ldquo;nosso&rdquo;).</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">2. Descrição do Serviço</h2>
            <p>A ReplyMesh é uma plataforma SaaS destinada a negócios de alimentação (restaurantes, lanchonetes, pizzarias, hamburgueiras, docerias, entre outros) que oferece:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Cardápio digital online</li>
              <li>Gestão de pedidos de delivery e retirada</li>
              <li>Sistema de Ponto de Venda (PDV/Balcão)</li>
              <li>Gestão de mesas e comandas</li>
              <li>Controle de estoque</li>
              <li>Gestão de motoboys e entregas</li>
              <li>Notificações automáticas via WhatsApp</li>
              <li>Marketing WhatsApp e recuperação de vendas</li>
              <li>Relatórios financeiros e de desempenho</li>
              <li>Integrações com Mercado Pago e outros meios de pagamento</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">3. Cadastro e Conta</h2>
            <p>Para utilizar a plataforma, o Cliente deve criar uma conta com dados verdadeiros e atualizados. O Cliente é responsável pela confidencialidade das credenciais de acesso e por todas as atividades realizadas com sua conta.</p>
            <p className="mt-2">É proibido compartilhar credenciais de acesso com terceiros não autorizados. A ReplyMesh não se responsabiliza por acessos não autorizados decorrentes de negligência do Cliente no gerenciamento de senhas.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">4. Uso do Sistema — Delivery e PDV</h2>
            <p>O Cliente é exclusivamente responsável pelo conteúdo cadastrado no sistema, incluindo: produtos, preços, descrições, fotos e informações de entrega. A ReplyMesh não verifica a veracidade ou conformidade legal dos produtos comercializados.</p>
            <p className="mt-2">O Cliente deve garantir que sua operação de delivery e PDV está em conformidade com a legislação vigente, incluindo normas sanitárias, tributárias e trabalhistas.</p>
            <p className="mt-2">O sistema PDV é uma ferramenta de controle interno. A emissão de documentos fiscais (NF-e, NFC-e, SAT) é responsabilidade do Cliente e deve ser realizada através dos sistemas fiscais adequados.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">5. WhatsApp e Comunicações</h2>
            <p>A integração com WhatsApp utiliza a API do WhatsApp Business. O Cliente é responsável por:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Obter consentimento dos clientes para receber mensagens automáticas</li>
              <li>Respeitar as políticas de uso do WhatsApp Business</li>
              <li>Não utilizar o sistema para envio de spam ou conteúdo impróprio</li>
              <li>Manter o número do WhatsApp ativo e conectado</li>
            </ul>
            <p className="mt-2">O uso abusivo do WhatsApp pode resultar no bloqueio do número pelo próprio WhatsApp. A ReplyMesh não se responsabiliza por bloqueios decorrentes de uso inadequado pelo Cliente.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">6. Integrações</h2>
            <p>A ReplyMesh oferece integração com serviços de terceiros, incluindo mas não limitado ao Mercado Pago. O Cliente deve:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Criar sua própria conta nos serviços integrados</li>
              <li>Aceitar os termos de uso dos serviços integrados</li>
              <li>Ser responsável pelas transações e cobranças realizadas</li>
            </ul>
            <p className="mt-2">A ReplyMesh não se responsabiliza por indisponibilidades, erros ou mudanças nos serviços de terceiros.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">7. Planos e Pagamentos</h2>
            <p>O uso da plataforma está condicionado à contratação de um plano ativo. Os valores e condições dos planos estão disponíveis na página de Planos e podem ser alterados mediante aviso prévio de 30 dias.</p>
            <p className="mt-2">O não pagamento da mensalidade pode resultar na suspensão temporária ou cancelamento da conta. Dados ficam disponíveis por 30 dias após o cancelamento para exportação.</p>
            <p className="mt-2">Não há reembolso proporcional por cancelamento antecipado de planos mensais. Para planos anuais, consulte as condições específicas.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">8. Cancelamento</h2>
            <p>O Cliente pode cancelar sua conta a qualquer momento através do painel administrativo ou entrando em contato com o suporte. O cancelamento será efetivo ao final do período de cobrança vigente.</p>
            <p className="mt-2">A ReplyMesh pode cancelar ou suspender uma conta sem aviso prévio em casos de: violação destes Termos, atividades fraudulentas, uso que comprometa a infraestrutura da plataforma ou determinação legal.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">9. Disponibilidade do Sistema</h2>
            <p>A ReplyMesh se compromete a manter o sistema disponível com SLA de 99,5% de uptime mensal. Manutenções programadas serão comunicadas com antecedência mínima de 24 horas.</p>
            <p className="mt-2">Indisponibilidades decorrentes de falhas em serviços de terceiros (provedores de internet, AWS, WhatsApp, Mercado Pago) não são de responsabilidade da ReplyMesh.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">10. Suporte</h2>
            <p>O suporte é oferecido via chat no sistema e WhatsApp nos horários definidos no plano contratado. A ReplyMesh se compromete a responder solicitações de suporte crítico em até 4 horas úteis.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">11. Propriedade Intelectual</h2>
            <p>Todo o código, design, funcionalidades e conteúdo da plataforma ReplyMesh são propriedade exclusiva da ReplyMesh. É proibida a reprodução, cópia, engenharia reversa ou distribuição sem autorização expressa.</p>
            <p className="mt-2">Os dados cadastrados pelo Cliente (produtos, pedidos, clientes) são de propriedade do Cliente. A ReplyMesh não vende nem cede esses dados a terceiros.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">12. Limitação de Responsabilidade</h2>
            <p>A ReplyMesh não se responsabiliza por: perdas financeiras decorrentes de falhas no sistema, decisões de negócio baseadas nos relatórios, problemas de integração com serviços de terceiros ou uso inadequado da plataforma pelo Cliente.</p>
            <p className="mt-2">Em nenhuma hipótese a responsabilidade da ReplyMesh excederá o valor pago pelo Cliente nos últimos 3 meses de serviço.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">13. Alterações nos Termos</h2>
            <p>A ReplyMesh pode atualizar estes Termos a qualquer momento. Alterações relevantes serão comunicadas por e-mail e/ou aviso no sistema com antecedência mínima de 15 dias. O uso continuado após as alterações implica na aceitação dos novos termos.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">14. Foro e Legislação</h2>
            <p>Estes Termos são regidos pelas leis da República Federativa do Brasil. As partes elegem o foro da comarca de Rio de Janeiro - RJ para dirimir quaisquer controvérsias, renunciando a qualquer outro por mais privilegiado que seja.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">15. Contato</h2>
            <p>Para dúvidas sobre estes Termos, entre em contato:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>E-mail: contato@replymesh.com.br</li>
              <li>Chat: disponível no painel administrativo</li>
              <li>WhatsApp: disponível para clientes com plano ativo</li>
            </ul>
          </section>

        </div>
      </main>

      <footer className="border-t border-gray-200 py-6 px-6 text-center text-xs text-gray-400">
        <p>© 2026 ReplyMesh. Todos os direitos reservados.</p>
        <div className="flex justify-center gap-4 mt-2">
          <Link to={`${basePath}/politica-de-privacidade`} className="hover:text-gray-600">Política de Privacidade</Link>
          <Link to={basePath || '/'} className="hover:text-gray-600">Voltar ao início</Link>
        </div>
      </footer>
    </div>
  )
}
