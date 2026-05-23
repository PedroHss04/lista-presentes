export default function PessoaSidebar({
  pessoas,
  pessoaSelecionadaId,
  onSelecionar,
}) {
  return (
    <aside className="w-full md:w-72 md:shrink-0">
      <div className="rounded-2xl bg-white/80 backdrop-blur p-4 shadow-soft border border-brand-100">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
            Família
          </h2>
        </div>

        <ul className="space-y-1">
          {pessoas.length === 0 && (
            <li className="text-sm text-gray-500 italic px-2 py-3">
              Ninguém ainda.
            </li>
          )}
          {pessoas.map((p) => {
            const ativo = p.id === pessoaSelecionadaId
            return (
              <li key={p.id}>
                <button
                  type="button"
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
