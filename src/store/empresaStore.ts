import { create } from 'zustand'
import { getEmpresa, saveEmpresa, type EmpresaData } from '../lib/storage'

interface EmpresaStore {
  empresa: EmpresaData | null
  load: () => void
  save: (data: Omit<EmpresaData, 'id' | 'correlativoActual'>) => void
  clear: () => void
}

export const useEmpresaStore = create<EmpresaStore>((set) => ({
  empresa: null,

  load() {
    set({ empresa: getEmpresa() })
  },

  save(data) {
    const empresa = saveEmpresa(data)
    set({ empresa })
  },

  clear() {
    localStorage.clear()
    set({ empresa: null })
  },
}))
