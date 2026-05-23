import { useState } from 'react'
import { formatBRL, safeHostname } from '../lib/format.js'

export default function PresenteCard({ presente, onAtualizar, onRemover, nomeViewer, isOwner }) {
  const [marcando, setMarcando] = useState(false)
  const [editando, setEditando] = useState(false)
  const [nome, setNome] = useState(presente.nome)
  const [valor, setValor] = useState(presente.valor != null ? String(presente.valor).replace('.', ',') : '')
  const [link, setLink] = useState(presente.link || '')
  const [observacao, setObservacao] = useState(presente.observacao || '')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)

  const valorFormatado = formatBRL(presente.valor)
  const host = presente.link ? safeHostname(presente.link) : null

  async function toggleComprado() {
    setMarcando(true)
    try {
      if (presente.comprado) {
        await onAtualizar(presente.id, { comprado: false, comprado_por: null })
      } else {
        await onAtualizar(presente.id, { comprado: true, comprado_por: nomeViewer })
      }
    } finally {
      setMarcando(false)
    }
  }

  async function salvarEdicao(e) {
    e.preventDefault()
    if (!nome.trim()) return
    setSalvando(true)
    setErro(null)
    try {
      await onAtualizar(presente.id, {
        nome: nome.trim(),
        valor: valor === '' ? null : Number(valor.replace(',', '.')),
        link: link.trim() || null,
        observacao: observacao.trim() || null,
      })
      setEditando(false)
    } catch (err) {
      setErro(err.message || 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  function cancelarEdicao() {
    setNome(presente.nome)
    setValor(presente.valor != null ? String(presente.valor).replace('.', ',') : '')
    setLink(presente.link || '')
    setObservacao(presente.observacao || '')
    setErro(null)
    setEditando(false)
  }

  async function remover() {
    if (!window.confirm(`Remover "${presente.nome}"?`)) return
    await onRemover(presente.id)
  }

  if (editando) {
    return (
      <article className="rounded-2xl border border-brand-200 bg-white p-4 shadow-soft">
        <form onSubmit={salvarEdicao} className="space-y-3">
          <h4 className="font-semibold text-gray-800 text-sm">Editar presente</h4>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Nome *</label>
            <input
              autoFocus
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Valor (R$)</label>
              <input
                type="text"
                inputMode="decimal"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="299,90"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Link de compra</label>
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Observação</label>
            <input
              type="text"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Cor preferida, tamanho, etc."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          {erro && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{erro}</p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={salvando || !nome.trim()}
              className="flex-1 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white font-medium rounded-lg py-2 text-sm transition"
            >
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              type="button"
              onClick={cancelarEdicao}
              className="px-4 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      </article>
    )
  }

  return (
    <article
      className={`rounded-2xl border p-4 shadow-soft transition ${
        presente.comprado
          ? 'bg-emerald-50/70 border-emerald-200'
          : 'bg-white border-brand-100 hover:border-brand-200'
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={toggleComprado}
          disabled={marcando}
          title={presente.comprado ? 'Desmarcar' : 'Marcar como comprado'}
          className={`mt-1 w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center transition ${
            presente.comprado
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-gray-300 hover:border-brand-400'
          }`}
        >
          {presente.comprado && (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <h4
              className={`font-semibold text-gray-900 ${
                presente.comprado ? 'line-through text-gray-500' : ''
              }`}
            >
              {presente.nome}
            </h4>
            {valorFormatado && (
              <span className="text-sm font-semibold text-brand-600 shrink-0">
                {valorFormatado}
              </span>
            )}
          </div>

          {presente.observacao && (
            <p className="text-sm text-gray-600 mt-1">{presente.observacao}</p>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
            {presente.link && (
              <a
                href={presente.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                {host || 'abrir link'}
              </a>
            )}
            {presente.comprado && presente.comprado_por && (
              <span className="text-xs bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">
                comprado por {presente.comprado_por}
              </span>
            )}
            {isOwner && (
              <div className="flex items-center gap-3 ml-auto">
                <button
                  type="button"
                  onClick={() => setEditando(true)}
                  className="text-gray-400 hover:text-brand-500 text-xs"
                >
                  editar
                </button>
                <button
                  type="button"
                  onClick={remover}
                  className="text-gray-400 hover:text-red-500 text-xs"
                >
                  remover
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
