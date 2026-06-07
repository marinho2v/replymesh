Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      namespace :auth do
        post   "login",  to: "sessions#create"
        get    "me",     to: "me#show"
        delete "logout", to: "sessions#destroy"
      end

      get "me", to: "users#me"

      get "company/settings", to: "company_settings#show"
      put "company/settings", to: "company_settings#update"

      namespace :webhooks do
        post "evolution/location",    to: "evolution#location"
        post "evolution/messages",    to: "evolution#messages"
        post "mercadopago",           to: "mercadopago#payment"
        post "mercadopago/simulate",  to: "mercadopago#simulate"
      end

      namespace :master do
        get "dashboard", to: "dashboard#show"

        # Financeiro
        get "financeiro",               to: "financeiro#index"
        get "financeiro/cobrancas",     to: "financeiro#cobrancas"
        get "financeiro/inadimplencia", to: "financeiro#inadimplencia"

        resources :companies, only: %i[index show create update] do
          member do
            patch :activate
            patch :deactivate
            post :impersonate
          end
          post "backup_import/dry_run", to: "companies/backup_imports#dry_run"
          post "backup_import", to: "companies/backup_imports#create"
        end
        delete "impersonation/:token", to: "impersonations#destroy"

        resources :plans,         only: %i[index show create update]
        resources :subscriptions, only: %i[index show update]

        resources :domains, only: %i[index show create update destroy] do
          member do
            get :verify
            patch :set_primary
          end
        end

        namespace :whatsapp do
          get "settings/test_connection", to: "settings#test_connection"
          post "instances/sync", to: "instances#sync"
          post "instances/create_test", to: "instances#create_test"

          resources :instances, only: %i[index show create destroy] do
            member do
              get    :qrcode
              get    :status
              post   :disconnect
              post   :restart
            end
          end
          resources :templates, only: %i[index show create update]
          resources :logs,      only: %i[index]
        end

        resources :activity_logs,  only: %i[index]
        resources :audit_logs, only: %i[index]
        resources :system_alerts,  only: %i[index show] do
          member do
            patch :resolve
          end
        end

        resources :system_updates do
          member do
            patch :publish
            patch :unpublish
          end
        end

        resources :tickets, only: %i[index show] do
          member do
            post "messages", to: "tickets#create_message"
            patch "status", to: "tickets#update_status"
          end
        end

        # Notificações master
        scope "notifications" do
          get  "/",        to: "notifications#index"
          patch "read_all", to: "notifications#read_all"
          patch ":id/read", to: "notifications#mark_read"
        end

        get   "ai/settings", to: "ai#settings"
        patch "ai/settings", to: "ai#update_settings"
        post  "ai/test",     to: "ai#test"
        get   "ai/usage",    to: "ai#usage"
        resources :android_apps, only: %i[index show update] do
          member { patch :status, action: :update_status }
        end

        resources :users, only: %i[index create update destroy] do
          member do
            patch :status, action: :update_status
            patch :reset_password
          end
        end
        resources :roles, only: %i[index create update]
        resources :invites, only: %i[index create] do
          member do
            patch :cancel
            patch :resend
          end
        end
        get   "profile",          to: "profile#show"
        patch "profile",          to: "profile#update"
        patch "profile/password", to: "profile#update_password"
        get   "branding",         to: "branding#show"
        patch "branding",         to: "branding#update"
      end

      # ─── Store (autenticado — painel/admin/cozinha/motoboy) ───────────────────
      namespace :store do
        get "dashboard",      to: "dashboard#show"
        get "reports",        to: "reports#show"
        get "kitchen/orders", to: "orders#kitchen"

        # Cardápio
        resources :categories
        resources :products do
          resources :option_groups,
                    controller: "product_option_groups",
                    only: %i[index show create update destroy] do
            resources :items,
                      controller: "product_option_items",
                      only: %i[index show create update destroy]
          end
        end

        # Clientes
        resources :customers, only: %i[index show create update] do
          resources :addresses,
                    controller: "customer_addresses",
                    only: %i[index show create update destroy]
        end

        # Pedidos (ações de status e entrega como member actions)
        resources :orders, only: %i[index show create] do
          member do
            patch :status
            post  :assign_motoboy
            patch :delivery_status
            post  :complete_delivery
            post  :record_payment
          end
        end

        # Estoque
        resources :inventory_items do
          member do
            post :entry
            post :adjust
          end
        end
        resources :inventory_movements, only: %i[index]

        # Caixa
        resources :cash_sessions, only: %i[index show create] do
          member do
            post :close
          end
        end
        resources :cash_movements, only: %i[index create]

        # Motoboys e entregas
        resources :motoboys do
          collection { get :report }
        end
        resources :motoboy_adjustments, only: %i[index create destroy]
        resources :deliveries, only: %i[index show] do
          collection do
            post :assign
          end
          member do
            patch :status
            post :complete
          end
        end

        # Mesas
        resources :dining_tables do
          member do
            patch :set_qr_enabled
            post  :regenerate_qr
          end
        end
        resources :table_sessions, only: %i[index show create update]

        # Configuração da loja
        resources :users, only: %i[index create update destroy]
        resources :tickets, only: %i[index show create] do
          member do
            patch "status", to: "tickets#update_status"
          end
          resources :messages, controller: "ticket_messages", only: %i[create]
        end
        resources :business_hours, only: %i[index show update] do
          collection { post :bulk_create }
        end
        resources :business_hour_exceptions
        resources :app_banners
        resources :delivery_zones
        resources :coupons

        # Notificações da loja
        scope "notifications" do
          get  "/",         to: "notifications#index"
          patch "read_all", to: "notifications#read_all"
          delete "clear_all", to: "notifications#clear_all"
          patch ":id/read", to: "notifications#mark_read"
        end

        resources :system_updates, only: %i[index show] do
          member do
            post :read, action: :mark_read
          end
        end

        get "wheel/summary", to: "wheel#summary"
        get "wheel/spins", to: "wheel#spins"
        resources :wheel_prizes, only: %i[create update]

        namespace :whatsapp do
          resources :instances, only: %i[index] do
            collection do
              post :ensure
            end
            member do
              get :status
              get :qrcode
            end
          end
          resources :templates, only: %i[index update]
          resources :logs, only: %i[index]
          post "test_send", to: "test_sends#create"
        end

        get   "ai/settings", to: "ai#settings"
        post  "ai/chat",     to: "ai#chat"

        get   "store_ai/settings", to: "store_ai#settings"
        patch "store_ai/settings", to: "store_ai#update_settings"
        post  "store_ai/simulate", to: "store_ai#simulate"

        get  "marketing/customers", to: "marketing#customers"
        get  "marketing/campaigns", to: "marketing#campaigns"
        post "marketing/campaigns", to: "marketing#create_campaign"
        post "marketing/send_individual", to: "marketing#send_individual"
        post "marketing/campaigns/:id/send", to: "marketing#send_campaign"
        get  "sales_recovery/customers", to: "marketing#recovery_customers"

        get  "android_app", to: "android_apps#show"
        post "android_app", to: "android_apps#create"
      end

      # ─── Public (sem autenticação — site de delivery / cardápio) ─────────────
      namespace :motoboy do
        namespace :auth do
          post "login", to: "sessions#create"
        end

        get  "profile",             to: "profile#show"
        get  "orders",              to: "orders#index"
        post "orders/:id/start",    to: "orders#start"
        post "orders/:id/complete", to: "orders#complete"
        get  "history",             to: "history#index"
      end

      namespace :public do
        scope ":company_slug" do
          get  "store",           to: "stores#show"
          get  "menu",            to: "stores#menu"
          get  "products/:id",     to: "stores#product"
          get  "banners",         to: "stores#banners"
          get  "business_hours",  to: "stores#business_hours"
          get  "delivery_zones",  to: "stores#delivery_zones"
          get    "customers/lookup",            to: "customers#lookup"
          post   "coupons/validate",            to: "coupons#validate"
          get    "wheel/profile",               to: "wheel#profile"
          get    "wheel/prizes",                to: "wheel#prizes"
          post   "wheel/spin",                  to: "wheel#spin"
          delete "customers/addresses/:id",   to: "customer_addresses#destroy"
          get    "orders/:id",                to: "orders#show"
          post   "orders",                    to: "orders#create"
          post   "orders/:id/cancel_payment", to: "orders#cancel_payment"
          get    "payments/:order_id/status", to: "payments#status"
          get    "tables/qr/:qr_token",        to: "table_qr#show"
          post   "tables/qr/:qr_token/session", to: "table_qr#open_session"
          post   "tables/qr/:qr_token/orders",  to: "table_qr#create_order"
          get    "tables/qr/:qr_token/orders",  to: "table_qr#orders"
        end
      end
    end
  end
end
