import { LandingLayout } from "../components/layout/LandingLayout.jsx";

export function PoliticaDePrivacidade() {
  return (
    <LandingLayout>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "56px 24px 80px" }}>
        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", color: "#f5b50a", textTransform: "uppercase", marginBottom: 12 }}>Documento Legal</p>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: "#111827", marginBottom: 8, lineHeight: 1.2 }}>Política de Privacidade</h1>
        <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 48, paddingBottom: 32, borderBottom: "1px solid #e5e7eb" }}>Última atualização: 11 de junho de 2026</p>

        <div style={{ fontSize: 15, lineHeight: 1.8, color: "#374151" }}>

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
            <p><strong>3.1 Dados dos Clientes (lojistas):</strong> nome, CPF/CNPJ, endereço, e-mail, telefone, dados de
            pagamento (processados por gateways — não armazenamos cartões), logs de acesso.</p>
            <p style={{ marginTop: 10 }}><strong>3.2 Dados dos clientes finais:</strong> nome, telefone (WhatsApp), endereço de entrega, histórico
            de pedidos. Tratados em nome do lojista, que é o Controlador desses dados.</p>
            <p style={{ marginTop: 10 }}><strong>3.3 Dados de Pedidos:</strong> itens, valores, formas de pagamento, data/hora, status, origem do
            pedido (delivery, retirada, mesa, PDV).</p>
            <p style={{ marginTop: 10 }}><strong>3.4 Dados de WhatsApp:</strong> números de telefone para notificações e histórico de mensagens
            enviadas pelo sistema. Não acessamos conversas privadas.</p>
          </Section>

          <Section title="4. Finalidade do Tratamento">
            <ul style={{ paddingLeft: 20 }}>
              {["Prestação dos serviços contratados","Identificação e autenticação de usuários",
                "Processamento de pedidos e comunicação com clientes finais","Envio de notificações via WhatsApp",
                "Cobrança e gestão financeira","Suporte técnico","Melhoria contínua da plataforma",
                "Cumprimento de obrigações legais"].map((item, i) => <li key={i} style={{ marginBottom: 4 }}>{item}</li>)}
            </ul>
          </Section>

          <Section title="5. Base Legal (LGPD)">
            <ul style={{ paddingLeft: 20 }}>
              <li style={{ marginBottom: 6 }}><strong>Execução de contrato</strong> — dados necessários à prestação do serviço (art. 7º, V)</li>
              <li style={{ marginBottom: 6 }}><strong>Legítimo interesse</strong> — segurança e prevenção a fraudes (art. 7º, IX)</li>
              <li style={{ marginBottom: 6 }}><strong>Cumprimento de obrigação legal</strong> — quando exigido por lei (art. 7º, II)</li>
              <li style={{ marginBottom: 6 }}><strong>Consentimento</strong> — comunicações de marketing (art. 7º, I)</li>
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
              <li style={{ marginBottom: 4 }}>Conta ativa: durante toda a vigência do contrato</li>
              <li style={{ marginBottom: 4 }}>Após cancelamento: 30 dias para exportação, depois removidos</li>
              <li style={{ marginBottom: 4 }}>Dados fiscais: conforme exigência legal (5 anos)</li>
              <li style={{ marginBottom: 4 }}>Logs de acesso: 6 meses</li>
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
            E-mail geral: <strong>contato@replymesh.com.br</strong><br />
            Privacidade/DPO: <strong>privacidade@replymesh.com.br</strong><br />
            Endereço: Rio de Janeiro - RJ, Brasil.
          </Section>

        </div>
      </div>
    </LandingLayout>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: "#111827", marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid #f3f4f6" }}>{title}</h2>
      <div>{children}</div>
    </div>
  );
}
