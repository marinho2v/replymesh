import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const createDisabledSupabaseClient = (clientName = 'Supabase') => {
  const buildError = () => (
    new Error(`${clientName} nao configurado neste template. Use os services Replymesh Rails para rotas migradas.`)
  )
  const rejected = () => Promise.reject(buildError())

  const query = {
    select: () => query,
    insert: () => query,
    update: () => query,
    delete: () => query,
    upsert: () => query,
    eq: () => query,
    neq: () => query,
    gt: () => query,
    gte: () => query,
    lt: () => query,
    lte: () => query,
    is: () => query,
    in: () => query,
    or: () => query,
    filter: () => query,
    order: () => query,
    limit: () => query,
    range: () => query,
    abortSignal: () => query,
    single: rejected,
    maybeSingle: rejected,
    then: (resolve, reject) => rejected().then(resolve, reject),
  }

  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: rejected,
      signUp: rejected,
      signOut: async () => ({ error: null }),
    },
    from: () => query,
    rpc: rejected,
    functions: { invoke: rejected },
    storage: {
      from: () => ({
        upload: rejected,
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
    channel: () => ({
      on: () => ({ subscribe: () => ({}) }),
      subscribe: () => ({}),
    }),
    removeChannel: () => {},
  }
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createDisabledSupabaseClient()

export const supabaseMotoboy = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: 'sb-motoboy-auth-token',
        autoRefreshToken: true,
        persistSession: true,
      },
    })
  : createDisabledSupabaseClient('Supabase Motoboy')

export const runSupabaseQuery = async (query, timeoutMs = 12000) => {
  const controller = new AbortController()
  let timeoutId

  try {
    const request = typeof query.abortSignal === 'function'
      ? query.abortSignal(controller.signal)
      : query

    const timeout = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        controller.abort()
        reject(new Error('Tempo esgotado ao carregar dados. Tente atualizar a pagina.'))
      }, timeoutMs)
    })

    return await Promise.race([request, timeout])
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Tempo esgotado ao carregar dados. Tente atualizar a pagina.')
    }

    throw error
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}
