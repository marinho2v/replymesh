import { useRef, useState } from 'react'
import { Image, Link, Loader2, Trash2, UploadCloud } from 'lucide-react'
import { uploadCloudMedia } from '../../services/media'

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const MAX_SIZE = 10 * 1024 * 1024

const CloudImageUploader = ({
  label,
  helper = 'Envie PNG, JPG ou WEBP. O sistema converte para WEBP otimizado.',
  mediaType,
  ownerType,
  ownerId,
  valueUrl,
  storageKey,
  onChange,
  onError,
  externalUrlLabel = 'URL externa',
}) => {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)

  const notifyError = (message) => {
    if (onError) onError(message)
  }

  const handleFile = async (file) => {
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type)) {
      notifyError('Formato invalido. Envie PNG, JPG, JPEG ou WEBP. SVG nao e permitido por seguranca.')
      return
    }
    if (file.size > MAX_SIZE) {
      notifyError('Imagem muito grande. O limite e 10 MB.')
      return
    }

    setUploading(true)
    try {
      const media = await uploadCloudMedia({ file, mediaType, ownerType, ownerId })
      onChange?.({
        url: media.url,
        storageKey: media.storage_key,
        path: media.path,
        source: 'cloudflare_r2',
      })
    } catch (error) {
      notifyError(error?.message || 'Nao foi possivel enviar a imagem.')
    } finally {
      setUploading(false)
    }
  }

  const clearImage = () => {
    onChange?.({ url: '', storageKey: '', source: 'empty' })
  }

  return (
    <div className="rounded-xl border border-dark-600 bg-dark-900/60 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-white">{label}</p>
          <p className="mt-1 text-xs text-gray-400">{helper}</p>
        </div>
        {storageKey && (
          <span className="rounded-full border border-green-800 bg-green-900/30 px-2 py-1 text-[10px] font-semibold text-green-200">
            R2
          </span>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-[180px_1fr]">
        <div className="overflow-hidden rounded-lg border border-dark-600 bg-dark-950">
          {valueUrl ? (
            <img src={valueUrl} alt={label} className="h-36 w-full object-cover" />
          ) : (
            <div className="grid h-36 place-items-center text-gray-500">
              <Image size={28} />
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragEnter={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault()
              setDragging(false)
              handleFile(event.dataTransfer.files?.[0])
            }}
            disabled={uploading}
            className={`flex w-full items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-5 text-sm font-semibold transition ${
              dragging ? 'border-blue-400 bg-blue-950/30 text-blue-100' : 'border-dark-500 bg-dark-800 text-gray-200 hover:border-gray-300'
            }`}
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
            {uploading ? 'Otimizando e enviando...' : 'Enviar imagem para Cloud R2'}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(event) => {
              handleFile(event.target.files?.[0])
              event.target.value = ''
            }}
          />

          <label className="block">
            <span className="mb-1 flex items-center gap-2 text-xs font-semibold text-gray-300">
              <Link size={13} />
              {externalUrlLabel}
            </span>
            <input
              value={valueUrl || ''}
              onChange={(event) => onChange?.({ url: event.target.value, storageKey: '', source: 'external_url' })}
              placeholder="https://..."
              className="w-full rounded-lg border border-dark-600 bg-dark-950 px-3 py-2 text-sm text-white outline-none focus:border-white"
            />
          </label>

          {valueUrl && (
            <button
              type="button"
              onClick={clearImage}
              className="inline-flex items-center gap-2 rounded-lg border border-red-900/70 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-950/30"
            >
              <Trash2 size={14} />
              Remover imagem deste cadastro
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default CloudImageUploader
