class FounderSignupService
  Result = Struct.new(:success?, :payload, :errors, keyword_init: true)
  CODE_TTL = 15.minutes
  RESEND_DELAY = 60.seconds
  MAX_ATTEMPTS = 5

  class << self
    def start(params, request:)
      setting = FounderProgramSetting.current
      return failure(closed_message) unless setting.open?
      return failure("Solicitações demais. Aguarde alguns minutos.") if rate_limited?(params, request.remote_ip)
      return failure("E-mail já cadastrado.") if User.exists?(email: params[:email].to_s.strip.downcase)
      phone = params[:phone].to_s.gsub(/\D/, "")
      return failure("WhatsApp já cadastrado.") if User.exists?(phone:) || Company.exists?(responsible_phone: phone)

      slug = CompanyDomainService.normalize_slug(params[:slug])
      return failure("Subdomínio reservado ou indisponível.") if CompanyDomainService.reserved_slug?(slug) || Company.exists?(slug:)
      return failure("Confirme os termos de uso e a política do programa.") unless truthy?(params[:accepted_terms])
      return failure("Não foi possível concluir o cadastro.") if params[:website].present?
      return failure("As senhas não coincidem.") unless params[:password] == params[:password_confirmation]

      code = format("%06d", SecureRandom.random_number(1_000_000))
      attempt = FounderSignupAttempt.new(
        responsible_name: params[:responsible_name],
        email: params[:email],
        phone: params[:phone],
        password: params[:password],
        password_confirmation: params[:password_confirmation],
        company_name: params[:company_name],
        business_type: params[:business_type],
        city: params[:city],
        state: params[:state].to_s.upcase,
        slug: slug,
        code_digest: BCrypt::Password.create(code),
        expires_at: CODE_TTL.from_now,
        last_sent_at: Time.current,
        ip_address: request.remote_ip,
        user_agent: request.user_agent
      )
      return failure(attempt.errors.full_messages) unless attempt.save

      FounderSignupMailer.confirmation_code(attempt.id, code).deliver_now
      Result.new(success?: true, payload: { signup_id: attempt.id, email: masked_email(attempt.email), expires_in: CODE_TTL.to_i }, errors: [])
    rescue StandardError => e
      Rails.logger.error("[FounderSignup] start failed: #{e.class}")
      failure("Não foi possível enviar o código agora. Tente novamente.")
    end

    def verify(id:, code:)
      attempt = FounderSignupAttempt.find_by(id:)
      return failure("Cadastro não encontrado.") unless attempt&.status == "pending"
      return expire!(attempt) if attempt.expired?
      return block!(attempt) if attempt.attempts_count >= MAX_ATTEMPTS

      unless attempt.code_matches?(code)
        attempt.increment!(:attempts_count)
        return block!(attempt) if attempt.attempts_count >= MAX_ATTEMPTS
        return failure("Código inválido.", remaining_attempts: MAX_ATTEMPTS - attempt.attempts_count)
      end

      payload = nil
      FounderProgramSetting.transaction do
        setting = FounderProgramSetting.lock.first || FounderProgramSetting.current
        raise ActiveRecord::Rollback unless setting.open?
        ensure_founder_plan!

        result = CompanyOnboardingService.call(
          {
            name: attempt.company_name,
            slug: attempt.slug,
            responsible_name: attempt.responsible_name,
            responsible_email: attempt.email,
            responsible_phone: attempt.phone,
            admin_password_digest: attempt.password_digest,
            status: "active",
            plan_status: "active",
            plan_slug: "founder_free",
            monthly_price_cents: 0,
            whatsapp_mode: "manual",
            origin: "founder_program",
            commercial_status: "founder_free",
            founder_registered_at: Time.current,
            internal_note: "Cadastro público — Programa Fundadores | #{attempt.business_type} | #{attempt.city}/#{attempt.state}"
          },
          {
            module_keys: setting.default_modules.presence || FounderProgramSetting::DEFAULT_MODULES,
            create_whatsapp_instance: false
          }
        )
        raise ActiveRecord::Rollback unless result.success?

        attempt.update!(status: "confirmed", confirmed_at: Time.current)
        company = Company.find(result.payload.dig(:company, :id))
        payload = result.payload.merge(
          panel_url: public_panel_url(company.slug),
          store_url: public_store_url(company.slug)
        )
      end
      payload ? Result.new(success?: true, payload:, errors: []) : failure(closed_message)
    rescue ActiveRecord::RecordNotUnique, ActiveRecord::RecordInvalid => e
      failure(e.message)
    end

    def resend(id)
      attempt = FounderSignupAttempt.find_by(id:)
      return failure("Cadastro não encontrado.") unless attempt&.status == "pending"
      wait = RESEND_DELAY - (Time.current - attempt.last_sent_at)
      return failure("Aguarde #{wait.ceil} segundos para reenviar.") if wait.positive?

      code = format("%06d", SecureRandom.random_number(1_000_000))
      attempt.update!(
        code_digest: BCrypt::Password.create(code),
        expires_at: CODE_TTL.from_now,
        last_sent_at: Time.current,
        attempts_count: 0
      )
      FounderSignupMailer.confirmation_code(attempt.id, code).deliver_now
      Result.new(success?: true, payload: { expires_in: CODE_TTL.to_i }, errors: [])
    rescue StandardError => e
      Rails.logger.error("[FounderSignup] resend failed: #{e.class}")
      failure("Não foi possível reenviar o código.")
    end

    private

    def rate_limited?(params, ip)
      since = 1.hour.ago
      FounderSignupAttempt.where("created_at >= ?", since).where(
        "ip_address = :ip OR email = :email OR phone = :phone",
        ip:, email: params[:email].to_s.strip.downcase, phone: params[:phone].to_s.gsub(/\D/, "")
      ).count >= 5
    end

    def truthy?(value) = ActiveModel::Type::Boolean.new.cast(value)
    def ensure_founder_plan!
      Plan.find_or_create_by!(slug: "founder_free") do |plan|
        plan.name = "Programa Fundadores"
        plan.description = "Plano gratuito para empresas fundadoras Replymesh."
        plan.price_cents = 0
        plan.billing_cycle = "monthly"
        plan.status = "active"
        plan.features_json = []
      end
    end
    def closed_message = "As vagas do Programa Fundadores foram preenchidas ou as inscrições estão pausadas. Entre em contato para entrar na lista de espera."
    def masked_email(email) = email.sub(/\A(.{2}).*(@.*)\z/, '\1***\2')
    def public_panel_url(slug) = Rails.env.production? ? "https://#{slug}.replymesh.cloud/admin" : "http://localhost:5174/admin"
    def public_store_url(slug) = Rails.env.production? ? "https://#{slug}.replymesh.cloud" : "http://localhost:5174/?company=#{slug}"

    def expire!(attempt)
      attempt.update!(status: "expired")
      failure("Código expirado. Inicie um novo cadastro.")
    end

    def block!(attempt)
      attempt.update!(status: "blocked")
      failure("Limite de tentativas atingido. Inicie um novo cadastro.")
    end

    def failure(errors, extra = {})
      Result.new(success?: false, payload: extra, errors: Array(errors))
    end
  end
end
