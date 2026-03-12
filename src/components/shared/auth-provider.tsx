"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { auth, db } from "@/lib/firebase/client"
import { onAuthStateChanged, User } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"

interface AuthContextType {
  user: User | null
  profile: any | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        const docRef = doc(db, "profiles", user.uid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          setProfile(docSnap.data())
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
