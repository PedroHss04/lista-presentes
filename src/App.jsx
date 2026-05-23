import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from './lib/supabase.js'
import PessoaSidebar from './components/PessoaSidebar.jsx'
import PresenteForm from './components/PresenteForm.jsx'
import PresenteCard from './components/PresenteCard.jsx'
import { formatBRL } from './lib/format.js'

export default function App() {
  const [pessoas, setPessoas] = useState([])
  const [presentes, setPresentes] = useState([])
  const [pessoaSelecionadaId, setPessoaSelecionadaId] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [nomeViewer, setNomeViewer] = useState(
    () => localStorage.getItem('viewerNome') || ''
  )

  useEffect(() => {
    if (nomeViewer) localStorage.setItem('viewerNome', nomeViewer)
  }, [nomeViewer])

  const carregar = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setCarregando(false)
      return
    }
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
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pessoaSelecionada = useMemo(
    () => pessoas.find((p) => p.id === pessoaSelecionadaId) || null,
    [pessoas, pessoaSelecionadaId]
  )

  const presentesDaPessoa = useMemo(
    () =>
      presentes
        .filter((g) => g.pessoa_id === pessoaSelecionadaId)
        .sort((a, b) => {
          if (a.comprado !== b.comprado) return a.comprado ? 1 : -1
          return new Date(a.created_at) - new Date(b.created_at)
        }),
    [presentes, pessoaSelecionadaId]
  )

  const totalEstimado = useMemo(
    () =>
      presentesDaPessoa.reduce((acc, p) => acc + (Number(p.valor) || 0), 0),
    [presentesDaPessoa]
  )

  async function adicionarPessoa({ nome, emoji }) {
    const { data, error } = await supabase
      .from('pessoas')
      .insert({ nome, emoji })
      .select()
      .single()
    if (error) {
      alert(error.message)
      throw error
    }
    setPessoas((prev) => [...prev, data])
    setPessoaSelecionadaId(data.id)
  }

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

  if (!isSupabaseConfigured) {
    return <TelaConfig />
  }

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
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Você é:</label>
            <input
              type="text"
              value={nomeViewer}
              onChange={(e) => setNomeViewer(e.target.value)}
              placeholder="seu nome"
              className="rounded-full border border-brand-200 bg-white/80 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
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
            onAdicionar={adicionarPessoa}
          />

          <section className="flex-1 min-w-0">
            {carregando ? (
              <div className="text-center py-20 text-gray-500">Carregando...</div>
            ) : !pessoaSelecionada ? (
              <EmptyState
                titulo="Comece adicionando alguém"
                mensagem="Clique em '+ Adicionar' no lado esquerdo pra criar o primeiro membro da família."
              />
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
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
                      nomeViewer={nomeViewer}
                    />
                  ))}
                </div>

                <PresenteForm onAdicionar={adicionarPresente} />
              </>
            )}
          </section>
        </div>

        <footer className="text-center text-xs text-gray-400 mt-12">
          Feito com 💖 para a família ·{' '}
          <button
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

function TelaConfig() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-lg rounded-2xl bg-white shadow-soft border border-brand-100 p-8">
        <div className="text-4xl mb-3">🎁</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Configure o Supabase
        </h1>
        <p className="text-gray-600 text-sm mb-4">
          Crie um arquivo <code className="bg-gray-100 rounded px-1">.env</code>{' '}
          na raiz com as variáveis:
        </p>
        <pre className="bg-gray-900 text-gray-100 text-xs rounded-lg p-4 overflow-x-auto">
{`VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key`}
        </pre>
        <p className="text-gray-600 text-sm mt-4">
          Depois, rode o arquivo <code className="bg-gray-100 rounded px-1">supabase-schema.sql</code> no SQL Editor do Supabase e reinicie o servidor (
          <code className="bg-gray-100 rounded px-1">npm run dev</code>).
        </p>
      </div>
    </div>
  )
}
