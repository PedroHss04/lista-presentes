import { useState } from 'react'

const EMOJIS = ['🎁', '🎀', '🎂', '🎈', '🌟', '💝', '🍰', '🎄', '🎉', '✨']

export default function PessoaSidebar({
  pessoas,
  pessoaSelecionadaId,
  onSelecionar,
  onAdicionar,
}) {
  const [adicionando, setAdicionando] = useState(false)
  const [nome, setNome] = useState('')
  const [emoji, setEmoji] = useState(EMOJIS[0])
  const [salvando, setSalvando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const nomeLimpo = nome.trim()
    if (!nomeLimpo) return
    setSalvando(true)
    try {
      await onAdicionar({ nome: nomeLimpo, emoji })
      setNome('')
      setEmoji(EMOJIS[0])
      setAdicionando(false)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <aside className="w-full md:w-72 md:shrink-0">
      <div className="rounded-2xl bg-white/80 backdrop-blur p-4 shadow-soft border border-brand-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
            Família
          </h2>
          <button
            onClick={() => setAdicionando((v) => !v)}
            className="text-brand-600 hover:text-brand-700 text-sm font-medium"
          >
            {adicionando ? 'Cancelar' : '+ Adicionar'}
          </button>
        </div>

        {adicionando && (
          <form onSubmit={handleSubmit} className="mb-3 space-y-2">
            <div className="flex gap-2">
              <select
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                className="rounded-lg border border-gray-200 px-2 py-2 text-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                {EMOJIS.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
              <input
                autoFocus
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome da pessoa"
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
            <button
              type="submit"
              disabled={salvando || !nome.trim()}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white text-sm font-medium rounded-lg py-2 transition"
            >
              {salvando ? 'Salvando...' : 'Adicionar'}
            </button>
          </form>
        )}

        <ul className="space-y-1">
          {pessoas.length === 0 && !adicionando && (
            <li className="text-sm text-gray-500 italic px-2 py-3">
              Ninguém ainda. Adicione o primeiro!
            </li>
          )}
          {pessoas.map((p) => {
            const ativo = p.id === pessoaSelecionadaId
            return (
              <li key={p.id}>
                <button
                  onClick={() => onSelecionar(p.id)}
                  className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left transition ${
                    ativo
                      ? 'bg-brand-500 text-white shadow-soft'
                      : 'hover:bg-brand-50 text-gray-700'
                  }`}
                >
                  <span className="text-lg">{p.emoji || '🎁'}</span>
                  <span className="font-medium text-sm truncate">{p.nome}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}
