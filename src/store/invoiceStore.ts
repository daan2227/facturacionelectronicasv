import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { LineItem, InvoiceDraft } from '../types/invoice'
import { calcTotals } from '../utils/taxUtils'

interface InvoiceStore {
  draft: InvoiceDraft
  setTipoDte: (tipo: InvoiceDraft['tipoDte']) => void
  setReceptor: (receptor: InvoiceDraft['receptor']) => void
  addItem: (item: Omit<LineItem, 'numItem'>) => void
  updateItem: (numItem: number, changes: Partial<LineItem>) => void
  removeItem: (numItem: number) => void
  resetDraft: () => void
}

const emptyDraft = (): InvoiceDraft => ({
  codigoGeneracion: uuidv4().toUpperCase(),
  tipoDte: '01',
  receptor: null,
  items: [],
  condicionOperacion: 1,
  totals: calcTotals([], false),
})

export const useInvoiceStore = create<InvoiceStore>((set, get) => ({
  draft: emptyDraft(),

  setTipoDte(tipo) {
    set((s) => ({ draft: { ...s.draft, tipoDte: tipo } }))
  },

  setReceptor(receptor) {
    set((s) => ({ draft: { ...s.draft, receptor } }))
  },

  addItem(item) {
    set((s) => {
      const items = [...s.draft.items, { ...item, numItem: s.draft.items.length + 1 }]
      return { draft: { ...s.draft, items, totals: calcTotals(items, s.draft.receptor?.esGranContribuyente ?? false) } }
    })
  },

  updateItem(numItem, changes) {
    set((s) => {
      const items = s.draft.items.map((i) => (i.numItem === numItem ? { ...i, ...changes } : i))
      return { draft: { ...s.draft, items, totals: calcTotals(items, s.draft.receptor?.esGranContribuyente ?? false) } }
    })
  },

  removeItem(numItem) {
    set((s) => {
      const items = s.draft.items
        .filter((i) => i.numItem !== numItem)
        .map((i, idx) => ({ ...i, numItem: idx + 1 }))
      return { draft: { ...s.draft, items, totals: calcTotals(items, s.draft.receptor?.esGranContribuyente ?? false) } }
    })
  },

  resetDraft() {
    set({ draft: emptyDraft() })
  },
}))
