require "aws-sdk-s3"
require "erb"
require "marcel"
require "mini_magick"
require "securerandom"
require "stringio"
require "tempfile"

class CloudStorageService
  class Error < StandardError; end
  class NotConfiguredError < Error; end
  class InvalidFileError < Error; end
  class UnsafeKeyError < Error; end

  CACHE_CONTROL = "public, max-age=31536000, immutable".freeze
  OUTPUT_CONTENT_TYPE = "image/webp".freeze
  OUTPUT_QUALITY = ENV.fetch("CLOUDFLARE_R2_IMAGE_QUALITY", "82").to_i.clamp(80, 85)
  MAX_FILE_SIZE = 10.megabytes
  ALLOWED_MIME_TYPES = %w[image/png image/jpeg image/webp].freeze
  DISALLOWED_EXTENSIONS = %w[.svg .js .html .htm .xml].freeze

  MEDIA_PROFILES = {
    "logo" => { folder: "logo", width: 512, height: 512 },
    "banner" => { folder: "banner", width: 1920, height: 1080 },
    "cover" => { folder: "banner", width: 1920, height: 1080 },
    "hero" => { folder: "banner", width: 1920, height: 1080 },
    "product" => { folder: "products", width: 800, height: 800 },
    "category" => { folder: "categories", width: 600, height: 600 },
    "avatar" => { folder: "avatars", width: 400, height: 400 },
    "gallery" => { folder: "gallery", width: 1200, height: 1200 },
    "promotion" => { folder: "promotions", width: 1200, height: 1200 },
    "coupon" => { folder: "coupons", width: 1200, height: 1200 }
  }.freeze

  class << self
    def configured?
      bucket.present? && endpoint.present? && access_key_id.present? && secret_access_key.present?
    end

    def upload(company:, file:, media_type:, owner: nil)
      ensure_configured!
      profile = profile_for(media_type)
      bytes = read_file!(file)
      validate_file!(file, bytes)

      key = build_key(company: company, profile: profile)
      processed = process_image!(bytes, profile)

      client.put_object(
        bucket: bucket,
        key: key,
        body: processed,
        content_type: OUTPUT_CONTENT_TYPE,
        cache_control: CACHE_CONTROL,
        metadata: metadata_for(company: company, media_type: media_type, owner: owner)
      )

      {
        storage_key: key,
        path: key,
        url: url_for(key),
        content_type: OUTPUT_CONTENT_TYPE,
        size_bytes: processed.bytesize,
        media_type: media_type
      }
    end

    def replace(company:, file:, media_type:, previous_key: nil, owner: nil)
      result = upload(company: company, file: file, media_type: media_type, owner: owner)
      delete(previous_key, company: company) if previous_key.present? && previous_key != result[:storage_key]
      result
    end

    def delete(storage_key, company: nil)
      return false if storage_key.blank?
      ensure_safe_key!(storage_key, company: company)
      return false unless configured?

      client.delete_object(bucket: bucket, key: storage_key)
      true
    rescue Aws::S3::Errors::NoSuchKey, Aws::S3::Errors::NotFound
      false
    end

    def url_for(storage_key)
      return nil if storage_key.blank?

      encoded_key = storage_key.to_s.split("/").map { |part| ERB::Util.url_encode(part) }.join("/")
      if cdn_base_url.present?
        "#{cdn_base_url}/#{encoded_key}"
      elsif public_base_url.present?
        "#{public_base_url}/#{encoded_key}"
      else
        "#{endpoint}/#{bucket}/#{encoded_key}"
      end
    end

    def public_url_or_fallback(storage_key, fallback_url)
      url_for(storage_key).presence || fallback_url
    end

    def preview_metadata(storage_key)
      {
        storage_key: storage_key,
        url: url_for(storage_key),
        provider: "cloudflare_r2"
      }
    end

    def bucket = ENV["CLOUDFLARE_R2_BUCKET"].presence || ENV["R2_BUCKET"].presence
    def endpoint = (ENV["CLOUDFLARE_R2_ENDPOINT"].presence || ENV["R2_ENDPOINT"].presence).to_s.delete_suffix("/")
    def access_key_id = ENV["CLOUDFLARE_R2_ACCESS_KEY_ID"].presence || ENV["R2_ACCESS_KEY_ID"].presence
    def secret_access_key = ENV["CLOUDFLARE_R2_SECRET_ACCESS_KEY"].presence || ENV["R2_SECRET_ACCESS_KEY"].presence
    def cdn_base_url = (ENV["REPLYMESH_CDN_BASE_URL"].presence || ENV["CLOUDFLARE_R2_CDN_URL"].presence).to_s.delete_suffix("/")
    def public_base_url = ENV["CLOUDFLARE_R2_PUBLIC_BASE_URL"].to_s.delete_suffix("/")

    private

    def ensure_configured!
      return true if configured?

      raise NotConfiguredError, "Armazenamento de imagens nao configurado. Fale com o suporte Replymesh para liberar o envio de imagens."
    end

    def client
      @client ||= Aws::S3::Client.new(
        access_key_id: access_key_id,
        secret_access_key: secret_access_key,
        endpoint: endpoint,
        region: ENV.fetch("CLOUDFLARE_R2_REGION", ENV.fetch("R2_REGION", "auto")),
        force_path_style: true
      )
    end

    def profile_for(media_type)
      MEDIA_PROFILES.fetch(media_type.to_s) do
        raise InvalidFileError, "Tipo de midia invalido."
      end
    end

    def read_file!(file)
      raise InvalidFileError, "Arquivo nao enviado." unless file.respond_to?(:read)

      file.rewind if file.respond_to?(:rewind)
      bytes = file.read
      file.rewind if file.respond_to?(:rewind)
      raise InvalidFileError, "Arquivo vazio." if bytes.blank?
      raise InvalidFileError, "Imagem muito grande. Tamanho maximo: 10 MB." if bytes.bytesize > MAX_FILE_SIZE

      bytes
    end

    def validate_file!(file, bytes)
      original_name = file.respond_to?(:original_filename) ? file.original_filename.to_s : ""
      extension = File.extname(original_name).downcase
      raise InvalidFileError, "Formato de arquivo bloqueado por seguranca." if DISALLOWED_EXTENSIONS.include?(extension)

      content_type = Marcel::MimeType.for(StringIO.new(bytes), name: original_name)
      return true if ALLOWED_MIME_TYPES.include?(content_type)

      raise InvalidFileError, "Formato invalido. Envie PNG, JPG, JPEG ou WEBP."
    end

    def process_image!(bytes, profile)
      image = MiniMagick::Image.read(bytes)
      image.auto_orient
      image.resize "#{profile[:width]}x#{profile[:height]}>"
      image.strip
      image.quality OUTPUT_QUALITY.to_s
      image.format "webp"

      image.to_blob
    rescue MiniMagick::Error, MiniMagick::Invalid => e
      raise InvalidFileError, "Nao foi possivel processar a imagem: #{e.message}"
    end

    def build_key(company:, profile:)
      company_id = company.respond_to?(:id) ? company.id : company
      folder = profile.fetch(:folder)
      uuid = SecureRandom.uuid

      "companies/#{company_id}/#{folder}/#{uuid}.webp"
    end

    def metadata_for(company:, media_type:, owner: nil)
      metadata = {
        "company_id" => company.id.to_s,
        "media_type" => media_type.to_s,
        "source" => "replymesh"
      }
      if owner
        metadata["owner_type"] = owner.class.name
        metadata["owner_id"] = owner.id.to_s if owner.respond_to?(:id)
      end
      metadata
    end

    def ensure_safe_key!(storage_key, company: nil)
      key = storage_key.to_s
      raise UnsafeKeyError, "Chave de storage invalida." if key.include?("..") || key.start_with?("/")

      return true unless company

      company_id = company.respond_to?(:id) ? company.id : company
      return true if key.start_with?("companies/#{company_id}/")

      raise UnsafeKeyError, "Imagem pertence a outra empresa."
    end
  end
end
