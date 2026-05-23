import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase.js'
import PessoaSidebar from './components/PessoaSidebar.jsx'
import PresenteForm from './components/PresenteForm.jsx'
import PresenteCard from './components/PresenteCard.jsx'
import TelaLogin from './components/TelaLogin.jsx'
import { formatBRL } from './lib/format.js'

export default function App() {
  const [session, setSession] = useState(null)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [pessoas, setPessoas] = useState([])
  const [presentes, setPresentes] = useState([])
  const [pessoaSelecionadaId, setPessoaSelecionadaId] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [historicoAberto, setHistoricoAberto] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoadingAuth(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
      setSession(s)
      if (!s) {
        setPessoas([])
        setPresentes([])
        setPessoaSelecionadaId(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const [pessoasRes, presentesRes] = await Promise.all([
        supabase.from('pessoas').select('*').order('created_at'),
        supabase.from('presentes').select('*').order('created_at'),
      ])
      if (pessoasRes.error) throw pessoasRes.error
      if (presentesRes.error) throw presentesRes.error
      setPessoas(pessoasRes.data || [])
      setPresentes(presentesRes.data || [])
      if (
        pessoasRes.data?.length &&
        !pessoasRes.data.find((p) => p.id === pessoaSelecionadaId)
      ) {
        setPessoaSelecionadaId(pessoasRes.data[0].id)
      }
    } catch (e) {
      setErro(e.message || 'Erro ao carregar dados')
    } finally {
      setCarregando(false)
    }
  }, [pessoaSelecionadaId])

  useEffect(() => {
    if (session) carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id])

  // Realtime: sync ao vivo com outros membros da família
  useEffect(() => {
    if (!session?.user?.id) return

    const channel = supabase
      .channel('familia-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'presentes' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setPresentes((prev) =>
              prev.some((p) => p.id === payload.new.id) ? prev : [...prev, payload.new]
            )
          } else if (payload.eventType === 'UPDATE') {
            setPresentes((prev) =>
              prev.map((p) => (p.id === payload.new.id ? payload.new : p))
            )
          } else if (payload.eventType === 'DELETE') {
            setPresentes((prev) => prev.filter((p) => p.id !== payload.old.id))
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pessoas' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setPessoas((prev) =>
              prev.some((p) => p.id === payload.new.id) ? prev : [...prev, payload.new]
            )
          } else if (payload.eventType === 'UPDATE') {
            setPessoas((prev) =>
              prev.map((p) => (p.id === payload.new.id ? payload.new : p))
            )
          } else if (payload.eventType === 'DELETE') {
            setPessoas((prev) => prev.filter((p) => p.id !== payload.old.id))
            setPessoaSelecionadaId((currentId) =>
              currentId === payload.old.id ? null : currentId
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session?.user?.id])

  useEffect(() => {
    setHistoricoAberto(false)
  }, [pessoaSelecionadaId])

  const pessoaSelecionada = useMemo(
    () => pessoas.find((p) => p.id === pessoaSelecionadaId) || null,
    [pessoas, pessoaSelecionadaId]
  )

  const presentesDaPessoa = useMemo(
    () =>
      presentes
        .filter((g) => g.pessoa_id === pessoaSelecionadaId && !g.arquivado)
        .sort((a, b) => {
          if (a.comprado !== b.comprado) return a.comprado ? 1 : -1
          return new Date(a.created_at) - new Date(b.created_at)
        }),
    [presentes, pessoaSelecionadaId]
  )

  const arquivadosDaPessoa = useMemo(
    () =>
      presentes
        .filter((g) => g.pessoa_id === pessoaSelecionadaId && g.arquivado)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [presentes, pessoaSelecionadaId]
  )

  const totalEstimado = useMemo(
    () =>
      presentesDaPessoa.reduce((acc, p) => acc + (Number(p.valor) || 0), 0),
    [presentesDaPessoa]
  )

  const nomeViewer =
    session?.user?.user_metadata?.full_name ||
    session?.user?.email ||
    'Anônimo'

  const isOwner = Boolean(
    pessoaSelecionada && pessoaSelecionada.user_id === session?.user?.id
  )

  async function adicionarPresente(payload) {
    if (!pessoaSelecionadaId) return
    const { data, error } = await supabase
      .from('presentes')
      .insert({ ...payload, pessoa_id: pessoaSelecionadaId })
      .select()
      .single()
    if (error) throw error
    setPresentes((prev) => [...prev, data])
  }

  async function atualizarPresente(id, patch) {
    const { data, error } = await supabase
      .from('presentes')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) {
      alert(error.message)
      return
    }
    setPresentes((prev) => prev.map((p) => (p.id === id ? data : p)))
  }

  async function removerPresente(id) {
    const { error } = await supabase.from('presentes').delete().eq('id', id)
    if (error) {
      alert(error.message)
      return
    }
    setPresentes((prev) => prev.filter((p) => p.id !== id))
  }

  async function arquivarPresente(id) {
    await atualizarPresente(id, { arquivado: true })
  }

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Carregando...
      </div>
    )
  }

  if (!session) return <TelaLogin />

  return (
    <div className="min-h-screen">
      <header className="max-w-5xl mx-auto px-4 pt-10 pb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
              <span>🎁</span> Lista de Presentes
            </h1>
            <p className="text-gray-600 mt-1 text-sm">
              Para a família organizar desejos e quem dá o quê.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {session?.user?.user_metadata?.avatar_url && (
              <img
                src={session.user.user_metadata.avatar_url}
                alt={nomeViewer}
                className="w-8 h-8 rounded-full"
              />
            )}
            <span className="text-sm text-gray-700">{nomeViewer}</span>
            <button
              type="button"
              onClick={() => supabase.auth.signOut().catch(console.error)}
              className="text-xs text-gray-500 hover:text-red-500 transition"
            >
              sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pb-12">
        {erro && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {erro}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6">
          <PessoaSidebar
            pessoas={pessoas}
            pessoaSelecionadaId={pessoaSelecionadaId}
            onSelecionar={setPessoaSelecionadaId}
          />

          <section className="flex-1 min-w-0">
            {carregando ? (
              <div className="text-center py-20 text-gray-500">Carregando...</div>
            ) : !pessoaSelecionada ? (
              <EmptyState
                titulo="Nenhuma pessoa ainda"
                mensagem="Ainda não há membros. Peça para alguém entrar com o Google!"
              />
            ) : (
              <>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                    <span className="text-3xl">{pessoaSelecionada.emoji}</span>
                    Presentes para {pessoaSelecionada.nome}
                  </h2>
                  {totalEstimado > 0 && (
                    <span className="text-sm text-gray-500">
                      total estimado:{' '}
                      <strong className="text-gray-700">
                        {formatBRL(totalEstimado)}
                      </strong>
                    </span>
                  )}
                </div>

                <div className="space-y-3 mb-4">
                  {presentesDaPessoa.length === 0 && (
                    <EmptyState
                      titulo="Nenhum presente ainda"
                      mensagem="Adicione o primeiro presente que essa pessoa gostaria de ganhar."
                    />
                  )}
                  {presentesDaPessoa.map((p) => (
                    <PresenteCard
                      key={p.id}
                      presente={p}
                      onAtualizar={atualizarPresente}
                      onRemover={removerPresente}
                      onArquivar={arquivarPresente}
                      nomeViewer={nomeViewer}
                      isOwner={isOwner}
                    />
                  ))}
                </div>

                {isOwner && <PresenteForm onAdicionar={adicionarPresente} />}

                {arquivadosDaPessoa.length > 0 && (
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => setHistoricoAberto((o) => !o)}
                      className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 w-full text-left transition"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`transition-transform ${historicoAberto ? 'rotate-180' : ''}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                      Histórico ({arquivadosDaPessoa.length} presente{arquivadosDaPessoa.length !== 1 ? 's' : ''})
                    </button>
                    {historicoAberto && (
                      <div className="mt-3 space-y-2">
                        {arquivadosDaPessoa.map((p) => (
                          <HistoricoCard key={p.id} presente={p} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        </div>

        <footer className="text-center text-xs text-gray-400 mt-12">
          Feito com 💖 para a família ·{' '}
          <button
            type="button"
            onClick={carregar}
            className="underline hover:text-brand-600"
          >
            recarregar dados
          </button>
        </footer>
      </main>
    </div>
  )
}

function EmptyState({ titulo, mensagem }) {
  return (
    <div className="rounded-2xl bg-white/70 border border-dashed border-brand-200 p-8 text-center">
      <div className="text-4xl mb-2">🎀</div>
      <h3 className="font-semibold text-gray-800">{titulo}</h3>
      <p className="text-sm text-gray-500 mt-1">{mensagem}</p>
    </div>
  )
}

function HistoricoCard({ presente }) {
  const valorFormatado = formatBRL(presente.valor)
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3 flex items-start gap-3">
      <div className="mt-0.5 w-4 h-4 rounded border border-gray-200 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm text-gray-400 line-through">{presente.nome}</span>
          {valorFormatado && (
            <span className="text-xs text-gray-400 shrink-0">{valorFormatado}</span>
          )}
        </div>
        {presente.comprado_por && (
          <span className="text-xs text-gray-400 mt-0.5 block">
            comprado por {presente.comprado_por}
          </span>
        )}
      </div>
    </div>
  )
}
