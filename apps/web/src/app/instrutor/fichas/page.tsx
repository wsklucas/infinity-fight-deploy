'use client'
import { useEffect, useState } from 'react'
import { getSublevels, getFicha, createFichaItem, updateFichaItem, deleteFichaItem, duplicateFichaItem, reorderFichaItems } from '../../../lib/api'
import { useAuth } from '../../../store/auth'

type FichaCategory = 'TECNICA' | 'DRILL_FIXACAO' | 'JOGO_TATICO'

interface FichaItem {
  id: string
  sublevelId: string
  category: FichaCategory
  title: string
  description: string | null
  order: number
}

interface Criterion {
  id: string
  type: 'BLOCKER' | 'COMPLEMENTARY'
  category: string
  text: string
  context?: string
  minimumValue?: number
}

interface Ficha {
  id: string
  level: number
  label: string
  description: string
  items: FichaItem[]
  criteria: Criterion[]
}

interface Sublevel {
  id: string
  level: number
  label: string
  description: string
  criteria: Criterion[]
}

type ModalState =
  | { type: 'create'; sublevelId: string; category: FichaCategory }
  | { type: 'edit'; item: FichaItem }
  | { type: 'duplicate'; item: FichaItem }
  | null

const LEVEL_NAMES = ['', 'FUNDAMENTOS', 'TÉCNICO', 'TÁTICO', 'COMPETIDOR']
const SUBLEVEL_ORDER = ['1A','1B','1C','2A','2B','2C','3A','3B','3C','4A','4B','4C']

const CATEGORY_LABELS: Record<FichaCategory, string> = {
  TECNICA: 'Técnica',
  DRILL_FIXACAO: 'Drill de Fixação',
  JOGO_TATICO: 'Jogo Tático',
}

export default function FichasPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [sublevels, setSublevels] = useState<Sublevel[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [fichas, setFichas] = useState<Record<string, Ficha>>({})
  const [loadingFicha, setLoadingFicha] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState>(null)

  useEffect(() => {
    getSublevels().then(d => { setSublevels(d.sublevels); setLoading(false) })
  }, [])

  const loadFicha = async (id: string) => {
    setLoadingFicha(id)
    try {
      const data = await getFicha(id)
      setFichas(f => ({ ...f, [id]: data.ficha }))
    } finally {
      setLoadingFicha(null)
    }
  }

  const refreshFicha = async (id: string) => {
    const data = await getFicha(id)
    setFichas(f => ({ ...f, [id]: data.ficha }))
  }

  const handleExpand = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    if (!fichas[id]) await loadFicha(id)
  }

  const handleCreate = async (data: { title: string; description: string; category: string; sublevelId: string }) => {
    await createFichaItem(data)
    await refreshFicha(data.sublevelId)
    setModal(null)
  }

  const handleEdit = async (id: string, data: { title: string; description: string; category: string; sublevelId: string }, originalSublevelId: string) => {
    await updateFichaItem(id, { ...data, description: data.description || null })
    await refreshFicha(data.sublevelId)
    if (data.sublevelId !== originalSublevelId && fichas[originalSublevelId]) {
      await refreshFicha(originalSublevelId)
    }
    setModal(null)
  }

  const handleDelete = async (item: FichaItem) => {
    if (!confirm(`Excluir "${item.title}"?`)) return
    await deleteFichaItem(item.id)
    await refreshFicha(item.sublevelId)
  }

  const handleDuplicate = async (item: FichaItem, targetSublevelId: string) => {
    await duplicateFichaItem(item.id, targetSublevelId)
    if (fichas[targetSublevelId]) await refreshFicha(targetSublevelId)
    setModal(null)
  }

  const handleMoveUp = async (item: FichaItem, allItems: FichaItem[]) => {
    const categoryItems = allItems.filter(i => i.category === item.category).sort((a, b) => a.order - b.order)
    const idx = categoryItems.findIndex(i => i.id === item.id)
    if (idx <= 0) return
    const swapped = [...categoryItems]
    ;[swapped[idx - 1], swapped[idx]] = [swapped[idx], swapped[idx - 1]]
    await reorderFichaItems(swapped.map(i => i.id))
    await refreshFicha(item.sublevelId)
  }

  const handleMoveDown = async (item: FichaItem, allItems: FichaItem[]) => {
    const categoryItems = allItems.filter(i => i.category === item.category).sort((a, b) => a.order - b.order)
    const idx = categoryItems.findIndex(i => i.id === item.id)
    if (idx < 0 || idx >= categoryItems.length - 1) return
    const swapped = [...categoryItems]
    ;[swapped[idx], swapped[idx + 1]] = [swapped[idx + 1], swapped[idx]]
    await reorderFichaItems(swapped.map(i => i.id))
    await refreshFicha(item.sublevelId)
  }

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
                  const tecnicas = ficha?.items.filter(i => i.category === 'TECNICA').sort((a,b) => a.order - b.order) ?? []
                  const drills   = ficha?.items.filter(i => i.category === 'DRILL_FIXACAO').sort((a,b) => a.order - b.order) ?? []
                  const jogos    = ficha?.items.filter(i => i.category === 'JOGO_TATICO').sort((a,b) => a.order - b.order) ?? []

                  return (
                    <div key={sub.id} className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
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

                      {isOpen && (
                        <div className="border-t border-surface-border px-4 py-4 space-y-5">
                          {isLoadingThis ? (
                            <div className="text-text-muted text-sm py-2">Carregando ficha...</div>
                          ) : ficha ? (
                            <>
                              {/* TÉCNICA */}
                              <section>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-[9px] tracking-widest text-text-hint whitespace-nowrap">TÉCNICA</span>
                                  <div className="flex-1 h-px bg-surface-border" />
                                  {isAdmin && (
                                    <button
                                      onClick={() => setModal({ type: 'create', sublevelId: sub.id, category: 'TECNICA' })}
                                      className="text-[10px] text-brand-red hover:text-brand-red/80 flex-shrink-0"
                                    >
                                      + adicionar
                                    </button>
                                  )}
                                </div>
                                {tecnicas.length === 0 ? (
                                  <p className="text-xs text-text-hint italic">Nenhuma técnica cadastrada.</p>
                                ) : (
                                  <ul className="space-y-1">
                                    {tecnicas.map((item, idx) => (
                                      <ItemRow
                                        key={item.id}
                                        item={item}
                                        isAdmin={isAdmin}
                                        isFirst={idx === 0}
                                        isLast={idx === tecnicas.length - 1}
                                        onEdit={() => setModal({ type: 'edit', item })}
                                        onDelete={() => handleDelete(item)}
                                        onDuplicate={() => setModal({ type: 'duplicate', item })}
                                        onMoveUp={() => handleMoveUp(item, ficha.items)}
                                        onMoveDown={() => handleMoveDown(item, ficha.items)}
                                      />
                                    ))}
                                  </ul>
                                )}
                              </section>

                              {/* DRILLS */}
                              <section>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-[9px] tracking-widest text-text-hint whitespace-nowrap">DRILLS DE FIXAÇÃO</span>
                                  <div className="flex-1 h-px bg-surface-border" />
                                  {isAdmin && (
                                    <button
                                      onClick={() => setModal({ type: 'create', sublevelId: sub.id, category: 'DRILL_FIXACAO' })}
                                      className="text-[10px] text-brand-red hover:text-brand-red/80 flex-shrink-0"
                                    >
                                      + adicionar
                                    </button>
                                  )}
                                </div>
                                {drills.length === 0 ? (
                                  <p className="text-xs text-text-hint italic">Nenhum drill cadastrado.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {drills.map((item, idx) => (
                                      <DrillJogoRow
                                        key={item.id}
                                        item={item}
                                        chipLabel="FIXAÇÃO"
                                        chipClass="bg-orange-950/40 text-orange-400 border-orange-800/60"
                                        isAdmin={isAdmin}
                                        isFirst={idx === 0}
                                        isLast={idx === drills.length - 1}
                                        onEdit={() => setModal({ type: 'edit', item })}
                                        onDelete={() => handleDelete(item)}
                                        onDuplicate={() => setModal({ type: 'duplicate', item })}
                                        onMoveUp={() => handleMoveUp(item, ficha.items)}
                                        onMoveDown={() => handleMoveDown(item, ficha.items)}
                                      />
                                    ))}
                                  </div>
                                )}
                              </section>

                              {/* JOGOS */}
                              <section>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-[9px] tracking-widest text-text-hint whitespace-nowrap">JOGOS TÁTICOS</span>
                                  <div className="flex-1 h-px bg-surface-border" />
                                  {isAdmin && (
                                    <button
                                      onClick={() => setModal({ type: 'create', sublevelId: sub.id, category: 'JOGO_TATICO' })}
                                      className="text-[10px] text-brand-red hover:text-brand-red/80 flex-shrink-0"
                                    >
                                      + adicionar
                                    </button>
                                  )}
                                </div>
                                {jogos.length === 0 ? (
                                  <p className="text-xs text-text-hint italic">Nenhum jogo cadastrado.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {jogos.map((item, idx) => (
                                      <DrillJogoRow
                                        key={item.id}
                                        item={item}
                                        chipLabel="TÁTICO"
                                        chipClass="bg-sky-950/40 text-sky-400 border-sky-800/60"
                                        isAdmin={isAdmin}
                                        isFirst={idx === 0}
                                        isLast={idx === jogos.length - 1}
                                        onEdit={() => setModal({ type: 'edit', item })}
                                        onDelete={() => handleDelete(item)}
                                        onDuplicate={() => setModal({ type: 'duplicate', item })}
                                        onMoveUp={() => handleMoveUp(item, ficha.items)}
                                        onMoveDown={() => handleMoveDown(item, ficha.items)}
                                      />
                                    ))}
                                  </div>
                                )}
                              </section>

                              {/* CRITÉRIOS */}
                              {ficha.criteria.length > 0 && (
                                <section>
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[9px] tracking-widest text-text-hint whitespace-nowrap">CRITÉRIOS DE AVANÇO</span>
                                    <div className="flex-1 h-px bg-surface-border" />
                                  </div>
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
                                          {c.context && <p className="text-[10px] text-text-hint mt-0.5 leading-relaxed">{c.context}</p>}
                                          {c.minimumValue != null && <p className="text-[10px] text-text-hint mt-0.5">Mínimo: {c.minimumValue}</p>}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </section>
                              )}

                              {ficha.items.length === 0 && ficha.criteria.length === 0 && (
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

      {/* Modals */}
      {modal?.type === 'create' && (
        <Modal title="Novo item" onClose={() => setModal(null)}>
          <ItemForm
            initial={{ sublevelId: modal.sublevelId, category: modal.category, title: '', description: '' }}
            sublevels={sublevels}
            onSubmit={async (data) => handleCreate(data)}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

      {modal?.type === 'edit' && (
        <Modal title="Editar item" onClose={() => setModal(null)}>
          <ItemForm
            initial={{ sublevelId: modal.item.sublevelId, category: modal.item.category, title: modal.item.title, description: modal.item.description ?? '' }}
            sublevels={sublevels}
            onSubmit={async (data) => handleEdit(modal.item.id, data, modal.item.sublevelId)}
            onClose={() => setModal(null)}
            isEdit
          />
        </Modal>
      )}

      {modal?.type === 'duplicate' && (
        <Modal title="Duplicar para outro subnível" onClose={() => setModal(null)}>
          <DuplicateForm
            item={modal.item}
            sublevels={sublevels}
            onSubmit={handleDuplicate}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  )
}

/* ── Inline item row for TÉCNICA ───────────────────────────────────────────── */

interface ItemRowProps {
  item: FichaItem
  isAdmin: boolean
  isFirst: boolean
  isLast: boolean
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

function ItemRow({ item, isAdmin, isFirst, isLast, onEdit, onDelete, onDuplicate, onMoveUp, onMoveDown }: ItemRowProps) {
  return (
    <li className="flex gap-2 items-start group">
      <span className="text-brand-red flex-shrink-0 mt-1 text-xs">•</span>
      <div className="flex-1 min-w-0">
        <span className="text-xs text-text-secondary leading-relaxed">{item.title}</span>
        {item.description && <p className="text-[10px] text-text-hint leading-relaxed mt-0.5">{item.description}</p>}
      </div>
      {isAdmin && (
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <AdminActions isFirst={isFirst} isLast={isLast} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} onMoveUp={onMoveUp} onMoveDown={onMoveDown} />
        </div>
      )}
    </li>
  )
}

/* ── Card row for DRILL / JOGO ─────────────────────────────────────────────── */

interface DrillJogoRowProps extends ItemRowProps {
  chipLabel: string
  chipClass: string
}

function DrillJogoRow({ item, chipLabel, chipClass, isAdmin, isFirst, isLast, onEdit, onDelete, onDuplicate, onMoveUp, onMoveDown }: DrillJogoRowProps) {
  return (
    <div className="bg-surface-base border border-surface-border rounded-lg p-3 group">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-[9px] font-medium px-2 py-0.5 rounded-sm border flex-shrink-0 ${chipClass}`}>
              {chipLabel}
            </span>
            <span className="text-xs font-medium text-text-primary">{item.title}</span>
          </div>
          {item.description && <p className="text-xs text-text-muted leading-relaxed">{item.description}</p>}
        </div>
        {isAdmin && (
          <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <AdminActions isFirst={isFirst} isLast={isLast} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} onMoveUp={onMoveUp} onMoveDown={onMoveDown} />
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Admin action buttons ───────────────────────────────────────────────────── */

interface AdminActionsProps {
  isFirst: boolean
  isLast: boolean
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

function AdminActions({ isFirst, isLast, onEdit, onDelete, onDuplicate, onMoveUp, onMoveDown }: AdminActionsProps) {
  return (
    <>
      <button onClick={onMoveUp} disabled={isFirst} className="p-1 text-text-hint hover:text-text-secondary disabled:opacity-20 text-[10px]" title="Mover para cima">▲</button>
      <button onClick={onMoveDown} disabled={isLast} className="p-1 text-text-hint hover:text-text-secondary disabled:opacity-20 text-[10px]" title="Mover para baixo">▼</button>
      <button onClick={onDuplicate} className="p-1 text-text-hint hover:text-sky-400 text-[10px]" title="Duplicar">⧉</button>
      <button onClick={onEdit} className="p-1 text-text-hint hover:text-text-primary text-[10px]" title="Editar">✎</button>
      <button onClick={onDelete} className="p-1 text-text-hint hover:text-brand-red text-[10px]" title="Excluir">✕</button>
    </>
  )
}

/* ── Modal shell ────────────────────────────────────────────────────────────── */

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-card border border-surface-border rounded-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
          <span className="text-sm font-medium">{title}</span>
          <button onClick={onClose} className="text-text-muted hover:text-brand-red text-sm">✕</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

/* ── Item create/edit form ──────────────────────────────────────────────────── */

interface ItemFormProps {
  initial: { sublevelId: string; category: string; title: string; description: string }
  sublevels: Sublevel[]
  onSubmit: (data: { sublevelId: string; category: string; title: string; description: string }) => Promise<void>
  onClose: () => void
  isEdit?: boolean
}

function ItemForm({ initial, sublevels, onSubmit, onClose, isEdit }: ItemFormProps) {
  const [form, setForm] = useState({ ...initial })
  const [saving, setSaving] = useState(false)

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try { await onSubmit(form) } finally { setSaving(false) }
  }

  const field = (label: string, content: React.ReactNode) => (
    <div>
      <label className="text-[9px] tracking-widest text-text-hint">{label}</label>
      <div className="mt-1">{content}</div>
    </div>
  )

  const inputClass = 'w-full bg-surface-base border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red'

  const orderedSublevels = [...sublevels].sort((a, b) =>
    ['1A','1B','1C','2A','2B','2C','3A','3B','3C','4A','4B','4C'].indexOf(a.id) -
    ['1A','1B','1C','2A','2B','2C','3A','3B','3C','4A','4B','4C'].indexOf(b.id)
  )

  return (
    <form onSubmit={handle} className="space-y-3">
      {field('SUBNÍVEL',
        <select value={form.sublevelId} onChange={e => setForm(f => ({ ...f, sublevelId: e.target.value }))} className={inputClass}>
          {orderedSublevels.map(s => <option key={s.id} value={s.id}>{s.id} — {s.label}</option>)}
        </select>
      )}
      {field('CATEGORIA',
        <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inputClass}>
          <option value="TECNICA">Técnica</option>
          <option value="DRILL_FIXACAO">Drill de Fixação</option>
          <option value="JOGO_TATICO">Jogo Tático</option>
        </select>
      )}
      {field('TÍTULO',
        <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputClass} />
      )}
      {field('DESCRIÇÃO',
        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          rows={3} className={`${inputClass} resize-none`} />
      )}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onClose} className="flex-1 border border-surface-border text-text-muted text-xs py-2.5 rounded-lg">
          Cancelar
        </button>
        <button type="submit" disabled={saving} className="flex-1 bg-brand-red text-white text-xs font-medium py-2.5 rounded-lg disabled:opacity-50">
          {saving ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar'}
        </button>
      </div>
    </form>
  )
}

/* ── Duplicate form ─────────────────────────────────────────────────────────── */

interface DuplicateFormProps {
  item: FichaItem
  sublevels: Sublevel[]
  onSubmit: (item: FichaItem, targetSublevelId: string) => Promise<void>
  onClose: () => void
}

function DuplicateForm({ item, sublevels, onSubmit, onClose }: DuplicateFormProps) {
  const orderedSublevels = [...sublevels].sort((a, b) =>
    ['1A','1B','1C','2A','2B','2C','3A','3B','3C','4A','4B','4C'].indexOf(a.id) -
    ['1A','1B','1C','2A','2B','2C','3A','3B','3C','4A','4B','4C'].indexOf(b.id)
  )
  const others = orderedSublevels.filter(s => s.id !== item.sublevelId)
  const [targetId, setTargetId] = useState(others[0]?.id ?? '')
  const [saving, setSaving] = useState(false)

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try { await onSubmit(item, targetId) } finally { setSaving(false) }
  }

  return (
    <form onSubmit={handle} className="space-y-3">
      <p className="text-xs text-text-muted">Duplicar <span className="font-medium text-text-primary">"{item.title}"</span> para:</p>
      <select value={targetId} onChange={e => setTargetId(e.target.value)}
        className="w-full bg-surface-base border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red">
        {others.map(s => <option key={s.id} value={s.id}>{s.id} — {s.label}</option>)}
      </select>
      <div className="flex gap-2">
        <button type="button" onClick={onClose} className="flex-1 border border-surface-border text-text-muted text-xs py-2.5 rounded-lg">
          Cancelar
        </button>
        <button type="submit" disabled={saving || !targetId} className="flex-1 bg-brand-red text-white text-xs font-medium py-2.5 rounded-lg disabled:opacity-50">
          {saving ? 'Duplicando...' : 'Duplicar'}
        </button>
      </div>
    </form>
  )
}
