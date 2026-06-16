import { NextRequest, NextResponse } from "next/server";

const internalApiUrl = (
    process.env.SIGETIC_INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5032"
).replace(/\/$/, "");

type RouteContext = {
    params: Promise<{
        path: string[];
    }>;
};

async function proxyRequest(request: NextRequest, context: RouteContext) {
    const { path } = await context.params;
    const targetUrl = new URL(`${internalApiUrl}/api/${path.join("/")}`);
    targetUrl.search = request.nextUrl.search;

    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.delete("connection");
    headers.delete("content-length");
    headers.delete("expect");
    headers.delete("accept-encoding");
    headers.delete("origin");
    headers.delete("referer");

    const response = await fetch(targetUrl, {
        method: request.method,
        headers,
        body: request.method === "GET" || request.method === "HEAD"
            ? undefined
            : await request.arrayBuffer(),
        cache: "no-store",
    });

    const responseHeaders = new Headers();
    const contentType = response.headers.get("content-type");

    if (contentType) {
        responseHeaders.set("content-type", contentType);
    }

    return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
    });
}

export async function GET(request: NextRequest, context: RouteContext) {
    return proxyRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
    return proxyRequest(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
    return proxyRequest(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
    return proxyRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
    return proxyRequest(request, context);
}

export async function OPTIONS() {
    return new NextResponse(null, { status: 204 });
}
