import { createContext, useContext } from 'react'
import { repositoriosPadrao, type Repositorios } from '../dados/repositorios'

export const ContextoRepositorios = createContext<Repositorios | null>(null)

// As telas chegam aos dados só por aqui, nunca pelo Dexie direto.
export function useRepositorios(): Repositorios {
  return useContext(ContextoRepositorios) ?? repositoriosPadrao()
}
