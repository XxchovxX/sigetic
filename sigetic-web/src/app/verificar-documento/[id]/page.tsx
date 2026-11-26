import type { Metadata } from "next";
import Image from "next/image";
import Verificador from "./verificador";

export const metadata: Metadata = {
    title: "Verificar documento | SIGETIC",
    robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return (
        <main className="min-h-dvh bg-[#f3f8f5] px-4 py-8 text-[#14233b] sm:py-14">
            <div className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-green-900/10 bg-white shadow-sm">
                <header className="flex items-center gap-4 bg-[#006b2e] p-5 text-white sm:p-7">
                    <div className="shrink-0 rounded-xl bg-white p-2">
                        <Image src="/identity/logo-alcaldia.png" alt="Alcaldía de San Carlos de Guaroa" width={74} height={48} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-green-100">SIGETIC · Alcaldía de San Carlos de Guaroa</p>
                        <h1 className="mt-1 text-xl font-black sm:text-2xl">Verificar documento</h1>
                    </div>
                </header>
                <Verificador id={id} />
            </div>
        </main>
    );
}
