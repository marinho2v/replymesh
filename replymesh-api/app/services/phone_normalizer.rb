class PhoneNormalizer
  BRAZIL_COUNTRY_CODE = "55".freeze

  class << self
    def digits(value)
      value.to_s.gsub(/\D/, "")
    end

    def local_br(value)
      number = digits(value)
      number = number[2..] if number.length > 11 && number.start_with?(BRAZIL_COUNTRY_CODE)
      number.to_s[-11, 11] || number
    end

    def equivalent?(left, right)
      left_number = local_br(left)
      right_number = local_br(right)
      left_number.present? && right_number.present? && left_number == right_number
    end
  end
end
