const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;

if (!configuredApiUrl) {
    throw new Error("La variable NEXT_PUBLIC_API_URL no esta configurada.");
}

export function getApiUrl() {
    const fallbackUrl = configuredApiUrl!.replace(/\/$/, "");

    return typeof window === "undefined" ? fallbackUrl : "";
}
