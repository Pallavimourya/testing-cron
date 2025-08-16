import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility function for consistent signout handling
export async function handleSignOut(router?: any) {
  try {
    // Clear any local storage or session storage
    if (typeof window !== 'undefined') {
      localStorage.clear()
      sessionStorage.clear()
    }

    // Sign out using NextAuth
    const { signOut } = await import('next-auth/react')
    await signOut({ 
      callbackUrl: "/signin",
      redirect: true 
    })
  } catch (error) {
    console.error("Signout error:", error)
    
    // Fallback: redirect manually if router is provided
    if (router) {
      router.push("/signin")
    } else if (typeof window !== 'undefined') {
      window.location.href = "/signin"
    }
  }
}

// Utility function to check if user is authenticated
export function isAuthenticated(session: any) {
  return session && session.user && session.user.email
}
