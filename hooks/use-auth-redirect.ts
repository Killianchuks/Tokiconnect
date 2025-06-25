"use client"

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { authService } from '@/lib/api-service'
import { useToast } from '@/hooks/use-toast'

interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export function useAuthRedirect(
  protectedPaths: string[],
  redirectPath: string
) {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)

  // Log the current state of the hook every render
  console.log(`[useAuthRedirect - RENDER] pathname: ${pathname}, isLoadingAuth: ${isLoadingAuth}, currentUser: ${currentUser ? currentUser.email : 'none'}, currentUser Role: ${currentUser ? currentUser.role : 'N/A'}`);


  useEffect(() => {
    const checkAuthStatus = async () => {
      console.log(`[useAuthRedirect - EFFECT] Starting auth check for pathname: ${pathname}`);
      setIsLoadingAuth(true) // Always start with loading state when effect runs

      if (pathname === redirectPath) {
        console.log("[useAuthRedirect - EFFECT] On redirect path, skipping full auth check. Setting isLoadingAuth=false, currentUser=null.");
        setCurrentUser(null);
        setIsLoadingAuth(false);
        return;
      }

      const isProtected = protectedPaths.some(path => pathname.startsWith(path));
      if (!isProtected) {
        console.log("[useAuthRedirect - EFFECT] Not a protected path, no redirect needed. Setting isLoadingAuth=false.");
        setIsLoadingAuth(false);
        return;
      }

      try {
        console.log("[useAuthRedirect - EFFECT] Calling authService.getCurrentUser() for protected path.");
        const user = await authService.getCurrentUser() // API call to /api/auth/me

        console.log(`[useAuthRedirect - EFFECT] authService.getCurrentUser() returned:`, user);

        if (user && user.role === 'admin') {
          console.log(`[useAuthRedirect - EFFECT] Auth successful: User is admin (${user.email}). Setting isLoadingAuth=false, currentUser.`);
          setCurrentUser(user as AuthUser)
          setIsLoadingAuth(false)
        } else {
          console.log("[useAuthRedirect - EFFECT] Auth failed: User not found or not admin. Triggering redirect and toast.");
          setCurrentUser(null); // Ensure current user is cleared
          setIsLoadingAuth(false); // Auth check is complete, even if failed
          toast({
            title: "Access Denied",
            description: "You must be logged in as an admin to view this page.",
            variant: "destructive",
          })
          router.replace(redirectPath)
        }
      } catch (error) {
        console.error("[useAuthRedirect - EFFECT] Authentication check failed (catch block):", error)
        setCurrentUser(null); // Ensure current user is cleared on error
        setIsLoadingAuth(false); // Auth check is complete, even if failed
        toast({
          title: "Authentication Error",
          description: "Failed to verify session. Please log in again.",
          variant: "destructive",
        })
        router.replace(redirectPath)
      }
      console.log(`[useAuthRedirect - EFFECT] Finished auth check for pathname: ${pathname}. Final isLoadingAuth (inside effect): ${isLoadingAuth}, Final currentUser (inside effect): ${currentUser ? currentUser.email : 'none'}`);
    }

    checkAuthStatus()

  }, [pathname, protectedPaths, redirectPath, router, toast])

  // This log is outside useEffect and will show the state returned on each render
  console.log(`[useAuthRedirect - RETURN] isLoadingAuth: ${isLoadingAuth}, currentUser: ${currentUser ? currentUser.email : 'none'}`);
  return { isLoadingAuth, currentUser }
}
