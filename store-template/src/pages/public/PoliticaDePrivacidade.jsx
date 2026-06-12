import { Link } from 'react-router-dom'
import { useCompanyBasePath } from '../../contexts/CompanySlugContext'

export default function PoliticaDePrivacidade() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Privacidade</h1>
        <p className="text-sm text-gray-500 mb-8">Última atualização: 11 de junho de 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">1. Introdução</h2>
            <p>A ReplyMesh está comprometida com a proteção da privacidade e dos dados pessoais de seus clientes, usuários finais e visitantes. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos os dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018) e demais normas aplicáveis.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">2. Quem somos</h2>
            <p>A ReplyMesh atua como <strong>Controladora de dados</strong> no que diz respeito aos dados dos Clientes (lojistas) que utilizam a plataforma, e como <strong>Operadora de dados</strong> no que diz respeito aos dados dos clientes finais (consumidores) tratados pelos lojistas através do sistema.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">3. Dados Coletados</h2>

            <h3 className="font-semibold text-gray-800 mt-4 mb-2">3.1 Dados dos Clientes (lojistas)</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nome completo e/ou razão social</li>
              <li>CPF/CNPJ</li>
              <li>Endereço comercial completo</li>
              <li>E-mail e telefone de contato</li>
              <li>Dados de pagamento (processados por gateways seguros — não armazenamos cartões)</li>
              <li>Logs de acesso e utilização do sistema</li>
            </ul>

            <h3 className="font-semibold text-gray-800 mt-4 mb-2">3.2 Dados dos clientes finais (consumidores)</h3>
            <p>Ao realizar pedidos no cardápio online, os consumidores fornecem:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Nome completo</li>
              <li>Telefone (WhatsApp)</li>
              <li>Endereço de entrega</li>
              <li>Histórico de pedidos</li>
              <li>Preferências de produtos</li>
            </ul>
            <p className="mt-2">Esses dados são tratados em nome do lojista (nosso cliente), que é o Controlador desses dados para fins de LGPD.</p>

            <h3 className="font-semibold text-gray-800 mt-4 mb-2">3.3 Dados de Pedidos</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Itens pedidos, valores, formas de pagamento</li>
              <li>Data e hora dos pedidos</li>
              <li>Status e histórico de atualização</li>
              <li>Origem do pedido (delivery, retirada, mesa, PDV)</li>
            </ul>

            <h3 className="font-semibold text-gray-800 mt-4 mb-2">3.4 Dados de WhatsApp</h3>
            <p>Para a integração com WhatsApp, armazenamos:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Números de telefone para envio de notificações</li>
              <li>Histórico de mensagens enviadas pelo sistema</li>
              <li>Status de entrega das mensagens</li>
            </ul>
            <p className="mt-2">Não acessamos, lemos ou armazenamos o conteúdo de conversas privadas do WhatsApp do lojista.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">4. Finalidade do Tratamento</h2>
            <p>Tratamos os dados pessoais para as seguintes finalidades:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Prestação dos serviços contratados (operação do sistema)</li>
              <li>Identificação e autenticação de usuários</li>
              <li>Processamento de pedidos e comunicação com clientes finais</li>
              <li>Envio de notificações automáticas via WhatsApp</li>
              <li>Cobrança e gestão financeira</li>
              <li>Suporte técnico e atendimento ao cliente</li>
              <li>Melhoria contínua da plataforma</li>
              <li>Cumprimento de obrigações legais e regulatórias</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">5. Base Legal para o Tratamento (LGPD)</h2>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Execução de contrato</strong> — para os dados necessários à prestação do serviço contratado (art. 7º, V)</li>
              <li><strong>Legítimo interesse</strong> — para melhoria do serviço, segurança e prevenção a fraudes (art. 7º, IX)</li>
              <li><strong>Cumprimento de obrigação legal</strong> — quando exigido por lei ou autoridade competente (art. 7º, II)</li>
              <li><strong>Consentimento</strong> — para comunicações de marketing (art. 7º, I)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">6. Cookies</h2>
            <p>Utilizamos cookies essenciais para o funcionamento do sistema (autenticação, preferências de sessão). Não utilizamos cookies de rastreamento de terceiros para publicidade.</p>
            <p className="mt-2">Cookies utilizados:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Sessão/Autenticação</strong> — necessários para manter o login ativo</li>
              <li><strong>Preferências</strong> — idioma, tema, configurações do painel</li>
              <li><strong>Segurança</strong> — proteção contra CSRF e outros ataques</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">7. Compartilhamento de Dados</h2>
            <p>A ReplyMesh pode compartilhar dados com terceiros nas seguintes situações:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Provedores de infraestrutura</strong> — servidores de hospedagem (com cláusulas de confidencialidade)</li>
              <li><strong>Gateways de pagamento</strong> — Mercado Pago e similares, para processamento de transações</li>
              <li><strong>WhatsApp/Meta</strong> — para envio de mensagens automáticas</li>
              <li><strong>Autoridades competentes</strong> — quando exigido por lei ou decisão judicial</li>
            </ul>
            <p className="mt-2">Não vendemos, alugamos ou cedemos dados pessoais a terceiros para fins de marketing.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">8. Segurança dos Dados</h2>
            <p>Implementamos medidas técnicas e organizacionais para proteger os dados, incluindo:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Criptografia em trânsito (HTTPS/TLS)</li>
              <li>Criptografia em repouso para dados sensíveis</li>
              <li>Controle de acesso por perfil (RBAC)</li>
              <li>Logs de auditoria de acesso</li>
              <li>Backups regulares com retenção definida</li>
              <li>Monitoramento de segurança contínuo</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">9. Retenção de Dados</h2>
            <p>Mantemos os dados pelo tempo necessário à prestação dos serviços:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Dados de conta ativa: durante toda a vigência do contrato</li>
              <li>Dados após cancelamento: 30 dias para exportação, depois removidos</li>
              <li>Dados fiscais e contábeis: conforme exigência legal (5 anos)</li>
              <li>Logs de acesso: 6 meses</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">10. Direitos do Titular (LGPD)</h2>
            <p>Nos termos da LGPD, você tem os seguintes direitos:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Acesso</strong> — solicitar confirmação e acesso aos seus dados pessoais</li>
              <li><strong>Correção</strong> — solicitar correção de dados incorretos ou incompletos</li>
              <li><strong>Eliminação</strong> — solicitar exclusão de dados desnecessários ou tratados em desconformidade</li>
              <li><strong>Portabilidade</strong> — solicitar seus dados em formato estruturado</li>
              <li><strong>Oposição</strong> — opor-se a tratamentos baseados em legítimo interesse</li>
              <li><strong>Revogação de consentimento</strong> — revogar consentimentos dados anteriormente</li>
            </ul>
            <p className="mt-2">Para exercer seus direitos, entre em contato pelo e-mail: <strong>privacidade@replymesh.com.br</strong>. Responderemos em até 15 dias úteis.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">11. Encarregado de Dados (DPO)</h2>
            <p>O Encarregado de Proteção de Dados (DPO) da ReplyMesh pode ser contactado pelo e-mail: <strong>privacidade@replymesh.com.br</strong>.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">12. Transferência Internacional de Dados</h2>
            <p>Podemos transferir dados para servidores localizados fora do Brasil quando utilizamos serviços de infraestrutura como AWS, Google Cloud ou similares. Nestes casos, garantimos que os destinatários adotem proteções equivalentes às previstas na LGPD.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">13. Menores de Idade</h2>
            <p>Nossa plataforma é destinada a empresas e profissionais maiores de 18 anos. Não coletamos intencionalmente dados de menores de idade. Se identificarmos tal situação, os dados serão removidos imediatamente.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">14. Alterações nesta Política</h2>
            <p>Esta Política pode ser atualizada periodicamente. Alterações relevantes serão comunicadas por e-mail. A versão mais atual estará sempre disponível nesta página com a data de última atualização.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">15. Contato</h2>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>E-mail geral: contato@replymesh.com.br</li>
              <li>E-mail privacidade/DPO: privacidade@replymesh.com.br</li>
              <li>Endereço: Rio de Janeiro - RJ, Brasil</li>
            </ul>
          </section>

        </div>
      </main>

      <footer className="border-t border-gray-200 py-6 px-6 text-center text-xs text-gray-400">
        <p>© 2026 ReplyMesh. Todos os direitos reservados.</p>
        <div className="flex justify-center gap-4 mt-2">
          <Link to={`${basePath}/termos-de-uso`} className="hover:text-gray-600">Termos de Uso</Link>
          <Link to={basePath || '/'} className="hover:text-gray-600">Voltar ao início</Link>
        </div>
      </footer>
    </div>
  )
}
