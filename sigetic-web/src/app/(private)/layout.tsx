import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppTopbar } from "@/components/layout/AppTopbar";

export default function PrivateLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <AuthGuard>
            <main className="min-h-dvh bg-[#f3f8f5] text-[#14233b]">
                <div className="grid min-h-dvh lg:grid-cols-[280px_1fr]">
                    <AppSidebar />

                    <section className="min-w-0">
                        <AppTopbar />

                        <div className="px-5 py-6 lg:px-8">{children}</div>

                        <footer className="px-5 pb-6 text-center lg:px-8">
                            <p className="text-[11px] font-black uppercase leading-5 tracking-[0.18em] text-slate-500">
                                DESARROLLADO POR ING. CRISTIAN HUMBERTO OVALLE VARÓN
                            </p>
                            <p className="mt-1 text-[10px] font-black uppercase leading-5 tracking-[0.2em] text-[#006b2e]">
                                ALCALDÍA DE SAN CARLOS DE GUAROA
                            </p>
                        </footer>
                    </section>
                </div>
            </main>
        </AuthGuard>
    );
}
