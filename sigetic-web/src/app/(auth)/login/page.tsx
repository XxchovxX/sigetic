"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
    Eye,
    EyeOff,
    LockKeyhole,
    LogIn,
    Mail,
    ShieldCheck,
} from "lucide-react";
import { getToken, login, saveSession } from "@/lib/auth";

export default function LoginPage() {
    const router = useRouter();

    const [correo, setCorreo] = useState("admin@sigetic.local");
    const [password, setPassword] = useState("Admin123*");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        const token = getToken();

        if (token) {
            router.replace("/dashboard");
        }
    }, [router]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            setIsSubmitting(true);
            setMessage("");

            const response = await login({
                correo,
                password,
            });

            saveSession(response);
            router.replace("/dashboard");
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "No fue posible iniciar sesión.";

            setMessage(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="min-h-dvh bg-[#f3f8f5] text-[#14233b] lg:flex lg:justify-center">
            <div className="grid min-h-dvh w-full lg:max-w-[1500px] lg:grid-cols-[minmax(560px,780px)_minmax(560px,720px)]">
                <section className="hidden min-h-dvh overflow-hidden bg-[#006b2e] p-3 lg:flex lg:items-center lg:justify-center">
                    <div className="relative aspect-[781/1041] h-[calc(100dvh-24px)] max-h-[1006px] max-w-full overflow-hidden rounded-lg shadow-2xl shadow-green-950/30">
                        <Image
                            src="/identity/login-san-carlos.png"
                            alt="Alcaldía de San Carlos de Guaroa"
                            fill
                            priority
                            sizes="(min-width: 1024px) 42vw, 100vw"
                            className="object-contain"
                        />
                    </div>
                </section>

                <section className="flex items-center justify-center px-5 py-8 lg:px-10">
                    <div className="w-full max-w-[560px]">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-13 w-13 items-center justify-center rounded-[1.4rem] bg-[#006b2e] text-white shadow-lg shadow-green-900/20">
                                <ShieldCheck className="h-6 w-6" />
                            </div>

                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.3em] text-[#006b2e]">
                                    Acceso seguro
                                </p>

                                <h2 className="text-2xl font-black tracking-[-0.05em] text-[#14233b]">
                                    Iniciar sesión
                                </h2>
                            </div>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="rounded-[1.75rem] border border-green-900/10 bg-white p-6 shadow-xl shadow-green-900/10"
                        >
                            <div className="mb-5">
                                <h3 className="text-xl font-black tracking-[-0.04em]">
                                    Bienvenido a SIGETIC
                                </h3>

                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    Ingresa con tu usuario institucional para administrar los
                                    módulos del sistema.
                                </p>
                            </div>

                            <label className="block">
                                <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                                    Correo electrónico
                                </span>

                                <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 transition focus-within:border-[#0b8f3a] focus-within:ring-4 focus-within:ring-green-700/10">
                                    <Mail className="h-4 w-4 text-slate-400" />

                                    <input
                                        type="email"
                                        value={correo}
                                        onChange={(event) => setCorreo(event.target.value)}
                                        placeholder="usuario@sigetic.local"
                                        className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                                    />
                                </div>
                            </label>

                            <label className="mt-4 block">
                                <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                                    Contraseña
                                </span>

                                <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 transition focus-within:border-[#0b8f3a] focus-within:ring-4 focus-within:ring-green-700/10">
                                    <LockKeyhole className="h-4 w-4 text-slate-400" />

                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(event) => setPassword(event.target.value)}
                                        placeholder="Ingresa tu contraseña"
                                        className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((current) => !current)}
                                        className="text-slate-400 transition hover:text-[#006b2e]"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </label>

                            {message ? (
                                <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                                    {message}
                                </div>
                            ) : null}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#006b2e] to-[#0b8f3a] px-5 text-sm font-black text-white shadow-lg shadow-green-900/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                <LogIn className="h-4 w-4" />
                                {isSubmitting ? "Validando acceso..." : "Entrar al sistema"}
                            </button>

                            <div className="mt-5 rounded-2xl bg-green-50 p-4 text-xs leading-6 text-[#006b2e]">
                                <strong>Administrador:</strong> admin@sigetic.local / Admin123*
                                <br />
                                <strong>Secretario administrativo financiero:</strong>{" "}
                                secretario.administrativo@sigetic.local / Sigetic123*
                                <br />
                                <strong>Administrador TIC:</strong>{" "}
                                administrador.tic@sigetic.local / Sigetic123*
                                <br />
                                <strong>Auxiliar administrativo SAF:</strong>{" "}
                                auxiliar.administrativo@sigetic.local / Sigetic123*
                            </div>
                        </form>

                        <p className="mt-4 text-center text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                            Desarrollado por ING. Cristian Humberto Ovalle Varón
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}
