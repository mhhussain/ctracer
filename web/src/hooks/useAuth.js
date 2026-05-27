import { useContext } from 'react'
import { AuthContext } from '../lib/AuthContext'

export function useAuth() {
  return useContext(AuthContext)
}
