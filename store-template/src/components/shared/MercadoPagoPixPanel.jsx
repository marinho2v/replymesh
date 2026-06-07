import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { Copy, CheckCircle, Clock, RefreshCw, ExternalLink, QrCode, XCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import { usePixPayment } from '../../hooks/usePixPayment'
import { useCompanySlug } from '../../contexts/CompanySlugContext'
import { cancelPublicPixPayment } from '../../services/publicApi'
import { toast } from 'sonner'

const MercadoPagoPixPanel = ({ orderId, qrCode, qrCodeBase64, ticketUrl, testMode = false, onConfirmed, onCancelled }) => {
  const [copied, setCopied] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [generatedQrUrl, setGeneratedQrUrl] = useState('')
  const slug = useCompanySlug()
  const { status, confirmed, expired, cancelled, expiresAt, refresh } = usePixPayment(orderId, { enabled: Boolean(orderId) })
  const hasRemoteQrImage = Boolean(qrCodeBase64 && qrCodeBase64.length > 500)
  const qrImageUrl = hasRemoteQrImage ? `data:image/png;base64,${qrCodeBase64}` : generatedQrUrl

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    let active = true

    if (!qrCode || hasRemoteQrImage) {
      setGeneratedQrUrl('')
      return undefined
    }

    QRCode.toDataURL(qrCode, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 320,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then(url => {
        if (active) setGeneratedQrUrl(url)
      })
      .catch(() => {
        if (active) setGeneratedQrUrl('')
      })

    return () => {
      active = false
    }
  }, [qrCode, hasRemoteQrImage])

  useEffect(() => {
    if (confirmed || status === 'paid') onConfirmed?.()
  }, [confirmed, status, onConfirmed])

  const countdown = useMemo(() => {
    if (!expiresAt) return '03:00'

    const seconds = Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000))
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
  }, [expiresAt, now])

  const handleCopy = async () => {
    if (!qrCode) return
    try {
      await navigator.clipboard.writeText(qrCode)
      setCopied(true)
      toast.success('Codigo Pix copiado!')
      setTimeout(() => setCopied(false), 3000)
    } catch {
      toast.error('Nao foi possivel copiar')
    }
  }

  const handleCancel = async () => {
    if (!orderId || cancelling) return

    setCancelling(true)
    try {
      await cancelPublicPixPayment(orderId, slug)
      toast.success('Pedido cancelado')
      onCancelled?.()
      await refresh()
    } catch (error) {
      toast.error(error.message || 'Nao foi possivel cancelar o pedido')
      await refresh()
    } finally {
      setCancelling(false)
    }
  }

  if (confirmed || status === 'paid') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-green-700/50 bg-green-900/15 p-6 text-center">
        <CheckCircle size={36} className="text-green-400" />
        <p className="font-bold text-green-300">Pagamento confirmado!</p>
        <p className="text-sm text-green-400/80">Seu pedido foi aceito automaticamente.</p>
      </div>
    )
  }

  if (expired || cancelled || ['expired', 'cancelled', 'failed'].includes(status)) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-red-700/50 bg-red-900/20 p-6 text-center">
        <XCircle size={36} className="text-red-400" />
        <p className="font-bold text-red-200">Pagamento expirado. Pedido cancelado.</p>
        <p className="text-sm text-red-200/80">Refaca o pedido para gerar um novo Pix.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-dark-600 bg-dark-800 p-4 text-center">
        <p className="mb-1 text-sm font-semibold text-white">Pague via Pix - Mercado Pago</p>
        <p className="text-xs text-gray-400">
          Apos o pagamento, o pedido sera confirmado automaticamente.
        </p>
        <p className="mt-2 text-sm font-bold text-yellow-300">
          Tempo restante: {countdown}
        </p>
      </div>

      {testMode && (
        <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-3 text-center">
          <p className="text-sm font-bold text-yellow-200">Pix em modo teste</p>
          <p className="mt-1 text-xs text-yellow-100/80">
            Este QR Code e apenas para teste local e nao sera carregado no app do banco.
            Configure um Access Token real do Mercado Pago para gerar cobranca pagavel.
          </p>
        </div>
      )}

      {qrImageUrl ? (
        <div className="flex justify-center">
          <div className="rounded-xl bg-white p-3">
            <img
              src={qrImageUrl}
              alt="QR Code Pix"
              className="h-48 w-48 object-contain"
            />
          </div>
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-dark-600 text-gray-500">
          <div className="text-center">
            <QrCode size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-xs">QR Code indisponivel</p>
          </div>
        </div>
      )}

      {qrCode && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-400">Pix copia e cola</p>
          <div className="flex gap-2">
            <div className="min-w-0 flex-1 rounded-lg border border-dark-600 bg-dark-900 px-3 py-2">
              <p className="truncate font-mono text-xs text-gray-300">{qrCode.slice(0, 60)}...</p>
            </div>
            <Button
              type="button"
              variant={copied ? 'success' : 'outline'}
              size="sm"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
            </Button>
          </div>
        </div>
      )}

      {ticketUrl && (
        <a
          href={ticketUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-lg border border-dark-600 bg-dark-800 px-4 py-2.5 text-sm text-gray-300 transition-colors hover:border-white hover:text-white"
        >
          <ExternalLink size={15} />
          Abrir no app Mercado Pago
        </a>
      )}

      <div className="flex items-center justify-between rounded-lg border border-dark-700 bg-dark-900 px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Clock size={15} className="animate-pulse text-yellow-400" />
          Aguardando pagamento...
        </div>
        <button
          type="button"
          onClick={refresh}
          className="flex items-center gap-1 text-xs text-gray-500 transition-colors hover:text-white"
        >
          <RefreshCw size={12} />
          Atualizar
        </button>
      </div>

      <Button
        type="button"
        variant="danger"
        className="w-full"
        onClick={handleCancel}
        loading={cancelling}
      >
        Cancelar pedido
      </Button>

      <p className="text-center text-xs text-gray-500">
        O status e verificado automaticamente a cada 5 segundos.
      </p>
    </div>
  )
}

export default MercadoPagoPixPanel
