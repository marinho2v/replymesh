import { request } from './replymeshApi'

export const getSupportTickets = async (params = {}) => {
  const payload = await request('/store/tickets', { params })
  return payload.tickets || []
}

export const getSupportTicket = async (id) => {
  const payload = await request(`/store/tickets/${id}`)
  return payload.ticket
}

export const createSupportTicket = async ({ subject, message, priority }) => {
  const payload = await request('/store/tickets', {
    method: 'POST',
    body: {
      ticket: {
        subject,
        message,
        priority,
      },
    },
  })
  return payload.ticket
}

export const replySupportTicket = async (id, message) => {
  const payload = await request(`/store/tickets/${id}/messages`, {
    method: 'POST',
    body: { message },
  })
  return payload.message
}

export const updateSupportTicketStatus = async (id, status) => {
  const payload = await request(`/store/tickets/${id}/status`, {
    method: 'PATCH',
    body: { status },
  })
  return payload.ticket
}
