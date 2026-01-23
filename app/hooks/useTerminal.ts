/**
 * useTerminal Hook
 * Manages WebSocket connection for terminal sessions.
 */

import { useEffect, useRef, useCallback, useState } from "react";

// For WebSocket, we need the VM URL directly (WebSockets can't go through HTTP proxy)
// In production, this should be the VM's HTTPS WebSocket URL (wss://)
const API_BASE =
  process.env.NEXT_PUBLIC_WORKSPACE_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";

// Debug logging helper
const DEBUG = process.env.NODE_ENV === "development";
const log = (tag: string, ...args: unknown[]) => {
  if (DEBUG) console.log(`[useTerminal:${tag}]`, ...args);
};

// Convert HTTP/HTTPS URL to WebSocket URL
function getWebSocketUrl(
  workspaceId: string,
  token: string,
  sessionId?: string
): string {
  // Convert http:// to ws:// and https:// to wss://
  const wsBase = API_BASE.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
  const params = new URLSearchParams({ token });
  if (sessionId) {
    params.append("session_id", sessionId);
  }
  return `${wsBase}/api/terminal/${workspaceId}/connect?${params}`;
}

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export interface TerminalMessage {
  type: "output" | "error" | "connected";
  data?: string;
  message?: string;
  session_id?: string;
}

export interface UseTerminalOptions {
  workspaceId: string;
  token: string;
  sessionId?: string;
  onOutput?: (data: string) => void;
  onConnected?: (sessionId: string) => void;
  onError?: (message: string) => void;
  onDisconnect?: () => void;
  autoReconnect?: boolean;
  reconnectDelay?: number;
}

export interface UseTerminalReturn {
  status: ConnectionStatus;
  sessionId: string | null;
  connect: () => void;
  disconnect: () => void;
  sendInput: (data: string) => void;
  resize: (cols: number, rows: number) => void;
}

export function useTerminal(options: UseTerminalOptions): UseTerminalReturn {
  const {
    workspaceId,
    token,
    sessionId: initialSessionId,
    onOutput,
    onConnected,
    onError,
    onDisconnect,
    autoReconnect = false,
    reconnectDelay = 3000,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectRef = useRef<(() => void) | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [sessionId, setSessionId] = useState<string | null>(
    initialSessionId || null
  );

  // Cleanup function
  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    log("CONNECT", `Starting connection for workspace: ${workspaceId}`);
    cleanup();

    if (!workspaceId || !token) {
      log(
        "CONNECT",
        `Missing params - workspaceId: ${!!workspaceId}, token: ${!!token}`
      );
      setStatus("error");
      return;
    }

    setStatus("connecting");

    const url = getWebSocketUrl(workspaceId, token, sessionId || undefined);
    log("CONNECT", `WebSocket URL: ${url.replace(/token=[^&]+/, "token=***")}`);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      log("WS_OPEN", "WebSocket connection opened");
      // Status will be set to 'connected' when we receive the connected message
    };

    ws.onmessage = (event) => {
      try {
        const message: TerminalMessage = JSON.parse(event.data);
        log("WS_MSG", `Received message type: ${message.type}`);

        switch (message.type) {
          case "connected":
            log("WS_MSG", `Connected with session: ${message.session_id}`);
            setStatus("connected");
            if (message.session_id) {
              setSessionId(message.session_id);
              onConnected?.(message.session_id);
            }
            break;

          case "output":
            if (message.data) {
              log("WS_OUTPUT", `Received ${message.data.length} chars`);
              onOutput?.(message.data);
            }
            break;

          case "error":
            log("WS_ERROR", `Server error: ${message.message}`);
            onError?.(message.message || "Unknown error");
            break;
        }
      } catch {
        // Handle raw output (shouldn't happen with our protocol)
        log("WS_RAW", `Raw message: ${event.data.length} chars`);
        onOutput?.(event.data);
      }
    };

    ws.onerror = (error) => {
      log("WS_ERROR", "WebSocket error:", error);
      setStatus("error");
      onError?.("WebSocket connection error");
    };

    ws.onclose = (event) => {
      log(
        "WS_CLOSE",
        `WebSocket closed - code: ${event.code}, reason: ${event.reason}`
      );
      setStatus("disconnected");
      wsRef.current = null;
      onDisconnect?.();

      // Auto-reconnect if enabled
      if (autoReconnect && connectRef.current) {
        log("WS_RECONNECT", `Scheduling reconnect in ${reconnectDelay}ms`);
        reconnectTimeoutRef.current = setTimeout(() => {
          connectRef.current?.();
        }, reconnectDelay);
      }
    };
  }, [
    workspaceId,
    token,
    sessionId,
    onOutput,
    onConnected,
    onError,
    onDisconnect,
    autoReconnect,
    reconnectDelay,
    cleanup,
  ]);

  // Store connect function in ref (use effect to avoid render-time ref update)
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    log("DISCONNECT", "Disconnecting...");
    cleanup();
    setStatus("disconnected");
  }, [cleanup]);

  // Send keyboard input
  const sendInput = useCallback((data: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      log("SEND_INPUT", `Sending ${data.length} chars`);
      wsRef.current.send(
        JSON.stringify({
          type: "input",
          data,
        })
      );
    } else {
      log(
        "SEND_INPUT",
        `Cannot send - WebSocket not open (state: ${wsRef.current?.readyState})`
      );
    }
  }, []);

  // Send resize event
  const resize = useCallback((cols: number, rows: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      log("RESIZE", `Resizing to ${cols}x${rows}`);
      wsRef.current.send(
        JSON.stringify({
          type: "resize",
          cols,
          rows,
        })
      );
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    status,
    sessionId,
    connect,
    disconnect,
    sendInput,
    resize,
  };
}
