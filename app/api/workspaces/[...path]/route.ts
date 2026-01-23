/**
 * Proxy route for workspace API calls
 * Forwards requests to the VM workspace service to avoid mixed content issues
 * (HTTPS frontend -> HTTP VM)
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

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, "POST");
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, "PUT");
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, "DELETE");
}

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    // Reconstruct the path
    const path = pathSegments.join("/");
    const url = `${VM_BASE_URL}/api/workspaces/${path}`;

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    // Get request body if present
    let body: string | undefined;
    if (method !== "GET" && method !== "DELETE") {
      try {
        body = await request.text();
      } catch {
        // No body
      }
    }

    // Forward headers (especially Authorization)
    const headers: HeadersInit = {};
    request.headers.forEach((value, key) => {
      // Forward important headers
      if (
        key.toLowerCase() === "authorization" ||
        key.toLowerCase() === "content-type"
      ) {
        headers[key] = value;
      }
    });

    // Make request to VM
    const response = await fetch(fullUrl, {
      method,
      headers,
      body,
    });

    // Get response data
    const data = await response.text();
    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch {
      jsonData = data;
    }

    // Return response with same status
    return NextResponse.json(jsonData, {
      status: response.status,
      statusText: response.statusText,
    });
  } catch (error) {
    console.error("Workspace proxy error:", error);
    return NextResponse.json(
      { error: "Failed to proxy request to workspace service" },
      { status: 500 }
    );
  }
}
