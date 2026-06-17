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
            <main className="min-h-dvh overflow-x-hidden bg-[#f3f8f5] text-[#14233b]">
                <div className="grid min-h-dvh lg:grid-cols-[18rem_minmax(0,1fr)]">
                    <AppSidebar />

                    <section className="min-w-0 overflow-x-hidden">
                        <AppTopbar />

                        <div className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-5 lg:px-6">
                            {children}
                        </div>

                        <footer className="mx-auto w-full max-w-[1440px] px-4 pb-6 text-center sm:px-5 lg:px-6">
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
