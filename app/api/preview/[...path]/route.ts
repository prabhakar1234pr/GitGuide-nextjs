/**
 * Proxy route for preview API calls
 * Forwards requests to the VM workspace service
 */

import { NextRequest, NextResponse } from "next/server";

const VM_BASE_URL =
  process.env.WORKSPACE_API_BASE_URL || "http://35.222.130.245:8080";

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, "GET");
}

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    const path = pathSegments.join("/");
    const url = `${VM_BASE_URL}/api/preview/${path}`;

    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    const headers: HeadersInit = {};
    request.headers.forEach((value, key) => {
      if (
        key.toLowerCase() === "authorization" ||
        key.toLowerCase() === "content-type"
      ) {
        headers[key] = value;
      }
    });

    const response = await fetch(fullUrl, {
      method,
      headers,
    });

    const data = await response.text();
    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch {
      jsonData = data;
    }

    return NextResponse.json(jsonData, {
      status: response.status,
      statusText: response.statusText,
    });
  } catch (error) {
    console.error("Preview proxy error:", error);
    return NextResponse.json(
      { error: "Failed to proxy request to preview service" },
      { status: 500 }
    );
  }
}
