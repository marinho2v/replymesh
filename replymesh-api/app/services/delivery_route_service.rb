class DeliveryRouteService
  Result = Struct.new(:orders, :summary, :maps_url, keyword_init: true)

  def self.call(orders:, origin: nil)
    new(orders: orders, origin: origin).call
  end

  def initialize(orders:, origin: nil)
    @orders = Array(orders).compact
    @origin = origin
  end

  def call
    sorted = @orders.sort_by { |order| sort_key(order) }
    Result.new(
      orders: sorted,
      summary: summary(sorted),
      maps_url: google_maps_route_url(sorted)
    )
  end

  private

  def sort_key(order)
    [
      order.logistics_group.to_s.downcase.presence || "zzzz",
      order.estimated_distance_km.present? ? order.estimated_distance_km.to_d : BigDecimal("999999"),
      order.route_priority.present? ? order.route_priority.to_i : 999_999,
      order.created_at || Time.zone.at(0)
    ]
  end

  def summary(orders)
    {
      total_deliveries: orders.size,
      estimated_distance_km: orders.sum { |order| order.estimated_distance_km.present? ? order.estimated_distance_km.to_d : 0 }.to_f.round(2),
      estimated_delivery_minutes: orders.sum { |order| order.estimated_delivery_minutes.to_i },
      delivery_fee_cents: orders.sum { |order| order.delivery_fee_cents.to_i }
    }
  end

  def google_maps_route_url(orders)
    destinations = orders.map { |order| destination_for(order) }.compact_blank
    return nil if destinations.empty?

    params = {
      api: 1,
      travelmode: "driving",
      destination: destinations.last
    }
    params[:origin] = @origin if @origin.present?
    params[:waypoints] = destinations[0...-1].join("|") if destinations.size > 1

    "https://www.google.com/maps/dir/?#{params.to_query}"
  end

  def destination_for(order)
    if order.delivery_latitude.present? && order.delivery_longitude.present?
      return "#{order.delivery_latitude},#{order.delivery_longitude}"
    end

    [
      order.street && "#{order.street}, #{order.number}",
      order.complement,
      order.neighborhood.presence || order.delivery_area_name,
      [order.city, order.state].compact_blank.join(" - ")
    ].compact_blank.join(", ").presence
  end
end
