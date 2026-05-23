import { useState } from 'react'
import { formatBRL, safeHostname } from '../lib/format.js'

export default function PresenteCard({ presente, onAtualizar, onRemover, nomeViewer }) {
  const [marcando, setMarcando] = useState(false)
  const valorFormatado = formatBRL(presente.valor)
  const host = presente.link ? safeHostname(presente.link) : null

  async function toggleComprado() {
    setMarcando(true)
    try {
      if (presente.comprado) {
        await onAtualizar(presente.id, { comprado: false, comprado_por: null })
      } else {
        const por =
          nomeViewer ||
          window.prompt('Quem está comprando? (seu nome)') ||
          'Anônimo'
        await onAtualizar(presente.id, { comprado: true, comprado_por: por })
      }
    } finally {
      setMarcando(false)
    }
  }

  async function remover() {
    if (!window.confirm(`Remover "${presente.nome}"?`)) return
    await onRemover(presente.id)
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
            <button
              onClick={remover}
              className="text-gray-400 hover:text-red-500 text-xs ml-auto"
            >
              remover
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
