import { Link } from "react-router-dom";

export function PoliticaDePrivacidade() {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <header style={{ background: "#0f1117", padding: "16px 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link to="/" style={{ fontSize: 20, fontWeight: 700, color: "#facc15", textDecoration: "none" }}>Replymesh</Link>
          <span style={{ fontSize: 13, color: "#9ca3af" }}>Documentos Legais</span>
        </div>
      </header>

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Política de Privacidade</h1>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 32 }}>Última atualização: 11 de junho de 2026</p>

        <div style={{ fontSize: 14, lineHeight: 1.7, color: "#374151" }}>

          <Section title="1. Introdução">
            A Replymesh está comprometida com a proteção da privacidade e dos dados pessoais de seus clientes, usuários
            finais e visitantes, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
          </Section>

          <Section title="2. Quem somos">
            A Replymesh atua como <strong>Controladora de dados</strong> no que diz respeito aos dados dos Clientes
            (lojistas) e como <strong>Operadora</strong> no que diz respeito aos dados dos clientes finais
            (consumidores) tratados pelos lojistas através do sistema.
          </Section>

          <Section title="3. Dados Coletados">
            <strong>3.1 Dados dos Clientes (lojistas):</strong> nome, CPF/CNPJ, endereço, e-mail, telefone, dados de
            pagamento (processados por gateways — não armazenamos cartões), logs de acesso.
            <br /><br />
            <strong>3.2 Dados dos clientes finais:</strong> nome, telefone (WhatsApp), endereço de entrega, histórico
            de pedidos. Tratados em nome do lojista, que é o Controlador desses dados.
            <br /><br />
            <strong>3.3 Dados de Pedidos:</strong> itens, valores, formas de pagamento, data/hora, status, origem do
            pedido (delivery, retirada, mesa, PDV).
            <br /><br />
            <strong>3.4 Dados de WhatsApp:</strong> números de telefone para notificações e histórico de mensagens
            enviadas pelo sistema. Não acessamos conversas privadas.
          </Section>

          <Section title="4. Finalidade do Tratamento">
            <ul style={{ paddingLeft: 20 }}>
              {["Prestação dos serviços contratados","Identificação e autenticação de usuários",
                "Processamento de pedidos e comunicação com clientes finais","Envio de notificações via WhatsApp",
                "Cobrança e gestão financeira","Suporte técnico","Melhoria contínua da plataforma",
                "Cumprimento de obrigações legais"].map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </Section>

          <Section title="5. Base Legal (LGPD)">
            <ul style={{ paddingLeft: 20 }}>
              <li><strong>Execução de contrato</strong> — dados necessários à prestação do serviço (art. 7º, V)</li>
              <li><strong>Legítimo interesse</strong> — segurança e prevenção a fraudes (art. 7º, IX)</li>
              <li><strong>Cumprimento de obrigação legal</strong> — quando exigido por lei (art. 7º, II)</li>
              <li><strong>Consentimento</strong> — comunicações de marketing (art. 7º, I)</li>
            </ul>
          </Section>

          <Section title="6. Cookies">
            Utilizamos cookies essenciais (autenticação, preferências de sessão, segurança). Não utilizamos cookies
            de rastreamento de terceiros para publicidade.
          </Section>

          <Section title="7. Compartilhamento de Dados">
            Compartilhamos dados apenas com: provedores de infraestrutura (com cláusulas de confidencialidade),
            gateways de pagamento (Mercado Pago), WhatsApp/Meta para envio de mensagens, e autoridades competentes
            quando exigido por lei. Não vendemos dados pessoais.
          </Section>

          <Section title="8. Segurança dos Dados">
            Medidas implementadas: criptografia em trânsito (HTTPS/TLS), criptografia em repouso para dados sensíveis,
            controle de acesso por perfil (RBAC), logs de auditoria, backups regulares e monitoramento contínuo.
          </Section>

          <Section title="9. Retenção de Dados">
            <ul style={{ paddingLeft: 20 }}>
              <li>Conta ativa: durante toda a vigência do contrato</li>
              <li>Após cancelamento: 30 dias para exportação, depois removidos</li>
              <li>Dados fiscais: conforme exigência legal (5 anos)</li>
              <li>Logs de acesso: 6 meses</li>
            </ul>
          </Section>

          <Section title="10. Direitos do Titular (LGPD)">
            Você tem direito a: acesso, correção, eliminação, portabilidade, oposição e revogação de consentimento.
            Para exercer seus direitos, envie e-mail para <strong>privacidade@replymesh.com.br</strong>. Respondemos
            em até 15 dias úteis.
          </Section>

          <Section title="11. Encarregado de Dados (DPO)">
            Contato do DPO: <strong>privacidade@replymesh.com.br</strong>
          </Section>

          <Section title="12. Transferência Internacional de Dados">
            Podemos transferir dados para servidores fora do Brasil (AWS, Google Cloud). Garantimos que os destinatários
            adotam proteções equivalentes às da LGPD.
          </Section>

          <Section title="13. Alterações nesta Política">
            Esta Política pode ser atualizada periodicamente. Alterações relevantes serão comunicadas por e-mail com
            antecedência. A versão mais atual estará sempre disponível nesta página.
          </Section>

          <Section title="14. Contato">
            E-mail geral: contato@replymesh.com.br<br />
            Privacidade/DPO: privacidade@replymesh.com.br<br />
            Endereço: Rio de Janeiro - RJ, Brasil.
          </Section>

        </div>
      </main>

      <footer style={{ borderTop: "1px solid #e5e7eb", padding: "24px", textAlign: "center", fontSize: 12, color: "#9ca3af" }}>
        <p>© 2026 Replymesh. Todos os direitos reservados.</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 8 }}>
          <Link to="/termos-de-uso" style={{ color: "#6b7280", textDecoration: "none" }}>Termos de Uso</Link>
          <Link to="/" style={{ color: "#6b7280", textDecoration: "none" }}>Voltar ao início</Link>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 8 }}>{title}</h2>
      <div>{children}</div>
    </div>
  );
}
