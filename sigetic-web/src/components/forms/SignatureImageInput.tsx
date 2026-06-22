"use client";

import type { ChangeEvent } from "react";
import { Upload, X } from "lucide-react";

const maxSignatureSizeBytes = 1024 * 1024;

export function SignatureImageInput({
    value,
    onChange,
    placeholder,
}: {
    value?: string | null;
    onChange: (value: string) => void;
    placeholder: string;
}) {
    const isImage = Boolean(value?.startsWith("data:image/"));

    async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            event.target.value = "";
            return;
        }

        if (file.size > maxSignatureSizeBytes) {
            window.alert("La firma no debe superar 1 MB. Recorta o comprime la imagen e intenta nuevamente.");
            event.target.value = "";
            return;
        }

        const dataUrl = await readFileAsDataUrl(file);
        onChange(dataUrl);
        event.target.value = "";
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
                <input
                    value={isImage ? "" : value ?? ""}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder}
                    className="h-12 min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0b8f3a] focus:ring-4 focus:ring-green-700/10"
                />

                <label className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-[#14233b] transition hover:bg-green-50 hover:text-[#006b2e]">
                    <Upload className="h-4 w-4" />
                    Subir firma
                    <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </label>
            </div>

            <p className="text-xs font-bold text-slate-500">
                Puedes escribir una firma interna o subir una firma escaneada PNG/JPG para uso interno.
            </p>

            {value ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                            Vista previa
                        </span>
                        <button
                            type="button"
                            onClick={() => onChange("")}
                            className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500 transition hover:text-red-600"
                        >
                            <X className="h-3.5 w-3.5" />
                            Quitar
                        </button>
                    </div>

                    {isImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={value ?? ""}
                            alt="Firma escaneada para uso interno"
                            className="max-h-24 max-w-full rounded-xl bg-white object-contain p-2"
                        />
                    ) : (
                        <p className="text-sm font-bold text-[#14233b]">{value}</p>
                    )}
                </div>
            ) : null}
        </div>
    );
}

function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}
