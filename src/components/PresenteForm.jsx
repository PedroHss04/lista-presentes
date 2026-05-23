import { useState } from 'react'

export default function PresenteForm({ onAdicionar }) {
  const [aberto, setAberto] = useState(false)
  const [nome, setNome] = useState('')
  const [valor, setValor] = useState('')
  const [link, setLink] = useState('')
  const [observacao, setObservacao] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)

  function reset() {
    setNome('')
    setValor('')
    setLink('')
    setObservacao('')
    setErro(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!nome.trim()) return
    setSalvando(true)
    setErro(null)
    try {
      await onAdicionar({
        nome: nome.trim(),
        valor: valor === '' ? null : Number(valor.replace(',', '.')),
        link: link.trim() || null,
        observacao: observacao.trim() || null,
      })
      reset()
      setAberto(false)
    } catch (err) {
      setErro(err.message || 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="w-full rounded-xl border-2 border-dashed border-brand-200 hover:border-brand-400 hover:bg-brand-50/50 text-brand-600 py-4 font-medium transition"
      >
        + Adicionar presente
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white border border-brand-100 shadow-soft p-5 space-y-3"
    >
      <h3 className="font-semibold text-gray-800">Novo presente</h3>

      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block">
          Nome do presente *
        </label>
        <input
          autoFocus
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Fone JBL Tune 510BT"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">
            Valor (R$)
          </label>
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
          <label className="text-xs font-medium text-gray-600 mb-1 block">
            Link de compra
          </label>
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block">
          Observação
        </label>
        <input
          type="text"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          placeholder="Cor preferida, tamanho, etc."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
      </div>

      {erro && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {erro}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={salvando || !nome.trim()}
          className="flex-1 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white font-medium rounded-lg py-2 transition"
        >
          {salvando ? 'Salvando...' : 'Salvar presente'}
        </button>
        <button
          type="button"
          onClick={() => {
            reset()
            setAberto(false)
          }}
          className="px-4 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
