import { matchDeliveryZone } from '../services/deliveryZones'

export const calculateDeliveryFee = async (addressOrNeighborhood) => {
  try {
    if (!addressOrNeighborhood) return { fee: 0, zone: null, isDeliverable: false }

    const deliveryMatch = await matchDeliveryZone(addressOrNeighborhood)
    const zone = deliveryMatch.zone
    
    if (!zone || !zone.is_active) {
      return { fee: 0, zone: null, isDeliverable: false, match: deliveryMatch.match }
    }

    return {
      fee: zone.delivery_fee,
      zone,
      isDeliverable: true,
      estimatedTime: zone.estimated_time,
      minimumOrder: zone.minimum_order_amount,
      match: deliveryMatch.match,
    }
  } catch (error) {
    console.error('Error calculating delivery fee:', error)
    return { fee: 0, zone: null, isDeliverable: false }
  }
}
