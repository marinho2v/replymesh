import { LandingLayout } from "../components/layout/LandingLayout.jsx";

export function TermosDeUso() {
  return (
    <LandingLayout>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "56px 24px 80px" }}>
        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", color: "#f5b50a", textTransform: "uppercase", marginBottom: 12 }}>Documento Legal</p>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: "#111827", marginBottom: 8, lineHeight: 1.2 }}>Termos de Uso</h1>
        <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 48, paddingBottom: 32, borderBottom: "1px solid #e5e7eb" }}>Última atualização: 11 de junho de 2026</p>

        <div style={{ fontSize: 15, lineHeight: 1.8, color: "#374151" }}>
          <Section title="1. Aceitação dos Termos">
            Ao acessar e utilizar a plataforma Replymesh ("Plataforma", "Sistema"), você ("Cliente", "Usuário", "Contratante")
            concorda integralmente com estes Termos de Uso. Caso não concorde, interrompa imediatamente o uso do sistema.
            A Replymesh é uma solução SaaS (Software como Serviço) desenvolvida e operada pela empresa responsável pela plataforma.
          </Section>

          <Section title="2. Descrição do Serviço">
            A Replymesh é uma plataforma SaaS destinada a negócios de alimentação que oferece:
            <ul style={{ paddingLeft: 20, marginTop: 10 }}>
              {["Cardápio digital online","Gestão de pedidos de delivery e retirada","Sistema de Ponto de Venda (PDV/Balcão)",
                "Gestão de mesas e comandas","Controle de estoque","Gestão de motoboys e entregas",
                "Notificações automáticas via WhatsApp","Marketing WhatsApp e recuperação de vendas",
                "Relatórios financeiros e de desempenho","Integrações com Mercado Pago e outros meios de pagamento"]
                .map((item, i) => <li key={i} style={{ marginBottom: 4 }}>{item}</li>)}
            </ul>
          </Section>

          <Section title="3. Cadastro e Conta">
            Para utilizar a plataforma, o Cliente deve criar uma conta com dados verdadeiros e atualizados. O Cliente é
            responsável pela confidencialidade das credenciais de acesso e por todas as atividades realizadas com sua conta.
            É proibido compartilhar credenciais com terceiros não autorizados.
          </Section>

          <Section title="4. Uso do Sistema — Delivery e PDV">
            O Cliente é exclusivamente responsável pelo conteúdo cadastrado no sistema, incluindo produtos, preços,
            descrições e informações de entrega. O sistema PDV é uma ferramenta de controle interno. A emissão de
            documentos fiscais (NF-e, NFC-e, SAT) é responsabilidade do Cliente.
          </Section>

          <Section title="5. WhatsApp e Comunicações">
            A integração com WhatsApp utiliza a API do WhatsApp Business. O Cliente é responsável por obter consentimento
            dos clientes para receber mensagens, respeitar as políticas do WhatsApp Business e não utilizar o sistema para
            envio de spam. Bloqueios por uso inadequado são de responsabilidade exclusiva do Cliente.
          </Section>

          <Section title="6. Integrações">
            A Replymesh oferece integração com serviços de terceiros, incluindo o Mercado Pago. O Cliente deve criar sua
            própria conta nesses serviços e aceitar seus termos. A Replymesh não se responsabiliza por indisponibilidades
            ou mudanças nos serviços integrados.
          </Section>

          <Section title="7. Planos e Pagamentos">
            O uso da plataforma está condicionado à contratação de um plano ativo. Valores podem ser alterados com aviso
            prévio de 30 dias. O não pagamento pode resultar em suspensão. Não há reembolso proporcional por cancelamento
            antecipado de planos mensais.
          </Section>

          <Section title="8. Cancelamento">
            O Cliente pode cancelar a qualquer momento. O cancelamento é efetivo ao final do período vigente. Dados ficam
            disponíveis por 30 dias após o cancelamento para exportação.
          </Section>

          <Section title="9. Disponibilidade do Sistema">
            A Replymesh se compromete a manter o sistema disponível com SLA de 99,5% de uptime mensal. Manutenções
            programadas serão comunicadas com antecedência mínima de 24 horas.
          </Section>

          <Section title="10. Suporte">
            Suporte disponível via chat no sistema e WhatsApp, nos horários definidos no plano contratado. Resposta a
            solicitações críticas em até 4 horas úteis.
          </Section>

          <Section title="11. Propriedade Intelectual">
            Todo o código, design e funcionalidades da plataforma são propriedade exclusiva da Replymesh. Os dados
            cadastrados pelo Cliente são de propriedade do Cliente.
          </Section>

          <Section title="12. Limitação de Responsabilidade">
            Em nenhuma hipótese a responsabilidade da Replymesh excederá o valor pago pelo Cliente nos últimos 3 meses
            de serviço.
          </Section>

          <Section title="13. Foro e Legislação">
            Estes Termos são regidos pelas leis da República Federativa do Brasil. As partes elegem o foro da comarca
            de Rio de Janeiro - RJ, renunciando a qualquer outro por mais privilegiado que seja.
          </Section>

          <Section title="14. Contato">
            E-mail: <strong>contato@replymesh.com.br</strong> — Rio de Janeiro, RJ, Brasil.
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
