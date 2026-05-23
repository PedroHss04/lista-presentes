// Camada de acesso aos dados.
// Usa Supabase quando configurado; senão usa localStorage (modo demo).

import { supabase, isSupabaseConfigured } from './supabase.js'

export const mode = isSupabaseConfigured ? 'supabase' : 'demo'

// ============================================================
// Backend: Supabase
// ============================================================
const supabaseDb = {
  async listPessoas() {
    const { data, error } = await supabase
      .from('pessoas')
      .select('*')
      .order('created_at')
    return { data: data || [], error }
  },
  async listPresentes() {
    const { data, error } = await supabase
      .from('presentes')
      .select('*')
      .order('created_at')
    return { data: data || [], error }
  },
  async addPessoa(payload) {
    const { data, error } = await supabase
      .from('pessoas')
      .insert(payload)
      .select()
      .single()
    return { data, error }
  },
  async addPresente(payload) {
    const { data, error } = await supabase
      .from('presentes')
      .insert(payload)
      .select()
      .single()
    return { data, error }
  },
  async updatePresente(id, patch) {
    const { data, error } = await supabase
      .from('presentes')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },
  async removePresente(id) {
    const { error } = await supabase.from('presentes').delete().eq('id', id)
    return { error }
  },
}

// ============================================================
// Backend: localStorage (modo demo)
// ============================================================
const KEY_PESSOAS = 'demo.pessoas'
const KEY_PRESENTES = 'demo.presentes'

function uid() {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
  )
}

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function seedIfEmpty() {
  if (read(KEY_PESSOAS).length === 0 && read(KEY_PRESENTES).length === 0) {
    const exemplo = {
      id: uid(),
      nome: 'Exemplo',
      emoji: '🎁',
      created_at: new Date().toISOString(),
    }
    write(KEY_PESSOAS, [exemplo])
    write(KEY_PRESENTES, [
      {
        id: uid(),
        pessoa_id: exemplo.id,
        nome: 'Fone JBL Tune 510BT',
        valor: 299.9,
        link: 'https://www.jbl.com',
        observacao: 'Preto, se possível',
        comprado: false,
        comprado_por: null,
        created_at: new Date().toISOString(),
      },
    ])
  }
}

const demoDb = {
  async listPessoas() {
    seedIfEmpty()
    return { data: read(KEY_PESSOAS), error: null }
  },
  async listPresentes() {
    seedIfEmpty()
    return { data: read(KEY_PRESENTES), error: null }
  },
  async addPessoa(payload) {
    const pessoas = read(KEY_PESSOAS)
    if (pessoas.some((p) => p.nome.toLowerCase() === payload.nome.toLowerCase())) {
      return { data: null, error: { message: 'Já existe alguém com esse nome.' } }
    }
    const nova = {
      id: uid(),
      nome: payload.nome,
      emoji: payload.emoji || '🎁',
      created_at: new Date().toISOString(),
    }
    pessoas.push(nova)
    write(KEY_PESSOAS, pessoas)
    return { data: nova, error: null }
  },
  async addPresente(payload) {
    const presentes = read(KEY_PRESENTES)
    const novo = {
      id: uid(),
      pessoa_id: payload.pessoa_id,
      nome: payload.nome,
      valor: payload.valor ?? null,
      link: payload.link ?? null,
      observacao: payload.observacao ?? null,
      comprado: false,
      comprado_por: null,
      created_at: new Date().toISOString(),
    }
    presentes.push(novo)
    write(KEY_PRESENTES, presentes)
    return { data: novo, error: null }
  },
  async updatePresente(id, patch) {
    const presentes = read(KEY_PRESENTES)
    const idx = presentes.findIndex((p) => p.id === id)
    if (idx === -1) return { data: null, error: { message: 'Não encontrado' } }
    presentes[idx] = { ...presentes[idx], ...patch }
    write(KEY_PRESENTES, presentes)
    return { data: presentes[idx], error: null }
  },
  async removePresente(id) {
    const presentes = read(KEY_PRESENTES).filter((p) => p.id !== id)
    write(KEY_PRESENTES, presentes)
    return { error: null }
  },
}

// ============================================================
// Export final — mesma interface, troca o backend
// ============================================================
export const db = isSupabaseConfigured ? supabaseDb : demoDb
