class PasswordResetService
  Result = Struct.new(:success?, :payload, :errors, keyword_init: true)

  CODE_TTL = 15.minutes
  RESEND_DELAY = 60.seconds
  MAX_ATTEMPTS = 5

  class << self
    def start(email:, company_slug:, request:)
      reset = nil
      company = Company.find_by(slug: CompanyDomainService.normalize_slug(company_slug))
      return generic_started unless company

      user = User.joins(:company_members).where(email: email.to_s.strip.downcase)
                 .where(company_members: { company_id: company.id, status: "active" })
                 .first
      return generic_started unless user&.status == "active"
      return failure("SMTP nao configurado. Configure o envio de e-mail no Painel Master.") unless SmtpSetting.ready?

      recent = PasswordResetRequest.where(company:, email: user.email, status: "pending").order(created_at: :desc).first
      if recent&.last_sent_at && (wait = RESEND_DELAY - (Time.current - recent.last_sent_at)).positive?
        return failure("Aguarde #{wait.ceil} segundos para pedir outro codigo.")
      end

      code = format("%06d", SecureRandom.random_number(1_000_000))
      reset = PasswordResetRequest.create!(
        user:,
        company:,
        email: user.email,
        code_digest: BCrypt::Password.create(code),
        expires_at: CODE_TTL.from_now,
        ip_address: request.remote_ip,
        user_agent: request.user_agent
      )
      PasswordResetMailer.reset_code(reset.id, code).deliver_now
      reset.update!(last_sent_at: Time.current)
      Rails.logger.info(
        "[PasswordReset] code sent request_id=#{reset.id} company_id=#{company.id} " \
        "user_id=#{user.id} email_domain=#{email_domain(user.email)}"
      )

      Result.new(success?: true, payload: {
        reset_id: reset.id,
        email: masked_email(user.email),
        expires_in: CODE_TTL.to_i
      }, errors: [])
    rescue StandardError => e
      reset&.destroy
      Rails.logger.error("[PasswordReset] start failed: #{e.class}: #{e.message.to_s.truncate(180)}")
      failure("Nao foi possivel enviar o codigo agora. Tente novamente.")
    end

    def verify(reset_id:, code:)
      reset = pending_request(reset_id)
      return failure("Solicitacao nao encontrada.") unless reset
      return expire!(reset) if reset.expired?
      return block!(reset) if reset.attempts_count >= MAX_ATTEMPTS

      unless reset.code_matches?(code)
        reset.increment!(:attempts_count)
        return block!(reset) if reset.attempts_count >= MAX_ATTEMPTS
        return failure("Codigo invalido.", remaining_attempts: MAX_ATTEMPTS - reset.attempts_count)
      end

      Result.new(success?: true, payload: { reset_id: reset.id }, errors: [])
    end

    def reset_password(reset_id:, code:, password:, password_confirmation:)
      reset = pending_request(reset_id)
      return failure("Solicitacao nao encontrada.") unless reset
      return expire!(reset) if reset.expired?
      return failure("As senhas nao coincidem.") unless password == password_confirmation
      return failure("A senha precisa ter pelo menos 10 caracteres.") if password.to_s.length < 10
      return failure("Codigo invalido.") unless reset.code_matches?(code)

      User.transaction do
        reset.user.update!(password:)
        reset.update!(status: "used", used_at: Time.current)
      end

      Result.new(success?: true, payload: {}, errors: [])
    rescue ActiveRecord::RecordInvalid => e
      failure(e.record.errors.full_messages)
    end

    private

    def pending_request(reset_id)
      PasswordResetRequest.includes(:user, :company).find_by(id: reset_id, status: "pending")
    end

    def generic_started
      Result.new(success?: true, payload: { email: nil, expires_in: CODE_TTL.to_i }, errors: [])
    end

    def masked_email(email) = email.sub(/\A(.{2}).*(@.*)\z/, '\1***\2')

    def email_domain(email)
      email.to_s.split("@").last
    end

    def expire!(reset)
      reset.update!(status: "expired")
      failure("Codigo expirado. Solicite um novo codigo.")
    end

    def block!(reset)
      reset.update!(status: "blocked")
      failure("Limite de tentativas atingido. Solicite um novo codigo.")
    end

    def failure(errors, extra = {})
      Result.new(success?: false, payload: extra, errors: Array(errors))
    end
  end
end
