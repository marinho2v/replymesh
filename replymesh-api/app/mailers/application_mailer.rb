class ApplicationMailer < ActionMailer::Base
  default from: -> { "#{ENV.fetch('MAIL_FROM_NAME', 'Replymesh')} <#{ENV.fetch('MAIL_FROM', 'suporte@replymesh.cloud')}>" }
  layout "mailer"
end
