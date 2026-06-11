'use client'
import { useEffect, useState } from 'react'
import { getSublevels, getFicha } from '../../../lib/api'

interface Criterion {
  id: string; type: 'BLOCKER' | 'COMPLEMENTARY'; category: string; text: string; context?: string; minimumValue?: number
}
interface Drill  { nome: string; descricao: string }
interface Jogo   { nome: string; descricao: string }
interface Ficha  {
  id: string; level: number; label: string; description: string
  tecnicas: string[]; drills: Drill[]; jogos: Jogo[]; criteria: Criterion[]
}
interface Sublevel { id: string; level: number; label: string; description: string; criteria: Criterion[] }

const LEVEL_NAMES = ['', 'FUNDAMENTOS', 'TÉCNICO', 'TÁTICO', 'COMPETIDOR']
const SUBLEVEL_ORDER = ['1A','1B','1C','2A','2B','2C','3A','3B','3C','4A','4B','4C']

export default function FichasPage() {
  const [sublevels, setSublevels] = useState<Sublevel[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [fichas, setFichas] = useState<Record<string, Ficha>>({})
  const [loadingFicha, setLoadingFicha] = useState<string | null>(null)

  useEffect(() => {
    getSublevels().then(d => { setSublevels(d.sublevels); setLoading(false) })
  }, [])

  const handleExpand = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    if (!fichas[id]) {
      setLoadingFicha(id)
      try {
        const data = await getFicha(id)
        setFichas(f => ({ ...f, [id]: data.ficha }))
      } finally {
        setLoadingFicha(null)
      }
    }
  }

  // group by level 1-4
  const byLevel: Record<number, Sublevel[]> = { 1: [], 2: [], 3: [], 4: [] }
  const ordered = [...sublevels].sort((a, b) => SUBLEVEL_ORDER.indexOf(a.id) - SUBLEVEL_ORDER.indexOf(b.id))
  for (const s of ordered) { if (byLevel[s.level]) byLevel[s.level].push(s) }

  return (
    <div>
      <div className="text-[9px] tracking-widest text-brand-red mb-1">OPERACIONAL</div>
      <div className="text-xl font-medium mb-1">Fichas de Subnível</div>
      <div className="text-xs text-text-muted mb-5">Técnicas, drills e critérios por subnível</div>

      {loading ? (
        <div className="text-text-muted text-sm">Carregando...</div>
      ) : (
        <div className="space-y-6">
          {[1, 2, 3, 4].map(level => (
            <div key={level}>
              {/* Level header */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[9px] tracking-widest text-text-hint whitespace-nowrap">
                  NÍVEL {level} · {LEVEL_NAMES[level]}
                </span>
                <div className="flex-1 h-px bg-surface-border" />
              </div>

              <div className="space-y-2">
                {(byLevel[level] || []).map(sub => {
                  const isOpen = expandedId === sub.id
                  const ficha = fichas[sub.id]
                  const isLoadingThis = loadingFicha === sub.id

                  return (
                    <div key={sub.id} className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
                      {/* Card header — always visible */}
                      <button
                        className="w-full text-left px-4 py-3.5 flex items-center gap-3"
                        onClick={() => handleExpand(sub.id)}
                      >
                        <span className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg bg-brand-red-dim border border-brand-red-border text-[11px] font-medium text-brand-red">
                          {sub.id}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{sub.label}</div>
                          <div className="text-xs text-text-muted truncate">{sub.description}</div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[9px] text-text-hint">{sub.criteria.length} critérios</span>
                          <span className="text-text-muted text-xs">{isOpen ? '▲' : '▼'}</span>
                        </div>
                      </button>

                      {/* Expanded content */}
                      {isOpen && (
                        <div className="border-t border-surface-border px-4 py-4 space-y-5">
                          {isLoadingThis ? (
                            <div className="text-text-muted text-sm py-2">Carregando ficha...</div>
                          ) : ficha ? (
                            <>
                              {/* Técnica */}
                              {ficha.tecnicas.length > 0 && (
                                <section>
                                  <SectionHead label="TÉCNICA" />
                                  <ul className="space-y-1.5">
                                    {ficha.tecnicas.map((t, i) => (
                                      <li key={i} className="flex gap-2 text-xs text-text-secondary leading-relaxed">
                                        <span className="text-brand-red flex-shrink-0 mt-0.5">•</span>
                                        {t}
                                      </li>
                                    ))}
                                  </ul>
                                </section>
                              )}

                              {/* Drills de fixação */}
                              {ficha.drills.length > 0 && (
                                <section>
                                  <SectionHead label="DRILLS DE FIXAÇÃO" />
                                  <div className="space-y-2.5">
                                    {ficha.drills.map((d, i) => (
                                      <div key={i} className="bg-surface-base border border-surface-border rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-1.5">
                                          <span className="text-[9px] font-medium px-2 py-0.5 rounded-sm border bg-orange-950/40 text-orange-400 border-orange-800/60">
                                            FIXAÇÃO
                                          </span>
                                          <span className="text-xs font-medium text-text-primary">{d.nome}</span>
                                        </div>
                                        <p className="text-xs text-text-muted leading-relaxed">{d.descricao}</p>
                                      </div>
                                    ))}
                                  </div>
                                </section>
                              )}

                              {/* Jogos táticos */}
                              {ficha.jogos.length > 0 && (
                                <section>
                                  <SectionHead label="JOGOS TÁTICOS" />
                                  <div className="space-y-2.5">
                                    {ficha.jogos.map((j, i) => (
                                      <div key={i} className="bg-surface-base border border-surface-border rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-1.5">
                                          <span className="text-[9px] font-medium px-2 py-0.5 rounded-sm border bg-sky-950/40 text-sky-400 border-sky-800/60">
                                            TÁTICO
                                          </span>
                                          <span className="text-xs font-medium text-text-primary">{j.nome}</span>
                                        </div>
                                        <p className="text-xs text-text-muted leading-relaxed">{j.descricao}</p>
                                      </div>
                                    ))}
                                  </div>
                                </section>
                              )}

                              {/* Critérios de avanço */}
                              {ficha.criteria.length > 0 && (
                                <section>
                                  <SectionHead label="CRITÉRIOS DE AVANÇO" />
                                  <div className="space-y-1.5">
                                    {ficha.criteria.map(c => (
                                      <div key={c.id} className="flex gap-2 items-start bg-surface-base border border-surface-border rounded-lg px-3 py-2.5">
                                        <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded-sm border flex-shrink-0 mt-0.5 ${
                                          c.type === 'BLOCKER'
                                            ? 'bg-brand-red-dim text-brand-red border-brand-red-border'
                                            : 'bg-state-developing-bg text-state-developing border-state-developing-border'
                                        }`}>
                                          {c.type === 'BLOCKER' ? 'BLOQ' : 'COMP'}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs text-text-secondary leading-relaxed">{c.text}</p>
                                          {c.context && (
                                            <p className="text-[10px] text-text-hint mt-0.5 leading-relaxed">{c.context}</p>
                                          )}
                                          {c.minimumValue != null && (
                                            <p className="text-[10px] text-text-hint mt-0.5">Mínimo: {c.minimumValue}</p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </section>
                              )}

                              {/* Empty state */}
                              {ficha.tecnicas.length === 0 && ficha.drills.length === 0 && ficha.jogos.length === 0 && ficha.criteria.length === 0 && (
                                <p className="text-text-muted text-xs py-2">Conteúdo ainda não cadastrado para este subnível.</p>
                              )}
                            </>
                          ) : null}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SectionHead({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-[9px] tracking-widest text-text-hint whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-surface-border" />
    </div>
  )
}
