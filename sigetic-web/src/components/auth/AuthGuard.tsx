"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import {
    clearSession,
    getCurrentUser,
    getStoredUser,
    getToken,
    saveSession,
    type AuthUser,
} from "@/lib/auth";
import { canAccessPath, getDefaultPathForRole } from "@/lib/permissions";

export function AuthGuard({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();

    const [isChecking, setIsChecking] = useState(true);
    const [user, setUser] = useState<AuthUser | null>(null);

    useEffect(() => {
        async function validateSession() {
            const token = getToken();

            if (!token) {
                clearSession();
                router.replace("/login");
                return;
            }

            try {
                const storedUser = getStoredUser();

                if (storedUser) {
                    setUser(storedUser);
                }

                const currentUser = await getCurrentUser(token);

                saveSession({
                    token,
                    expiraEnUtc: "",
                    usuario: currentUser,
                });

                setUser(currentUser);

                if (!canAccessPath(currentUser, pathname)) {
                    router.replace(getDefaultPathForRole(currentUser.rol));
                    return;
                }
            } catch {
                clearSession();
                router.replace("/login");
            } finally {
                setIsChecking(false);
            }
        }

        validateSession();
    }, [pathname, router]);

    if (isChecking) {
        return (
            <div className="flex min-h-dvh items-center justify-center bg-[#f3f8f5] px-5">
                <div className="rounded-[2rem] border border-green-100 bg-white p-6 text-center shadow-xl shadow-green-900/10">
                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-green-100 border-t-[#006b2e]" />

                    <h1 className="text-lg font-black text-[#14233b]">
                        Validando sesión SIGETIC
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Estamos verificando tus credenciales...
                    </p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return children;
}
