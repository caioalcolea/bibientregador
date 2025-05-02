// src/services/traccar.ts
import type { Dispositivo } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */
export interface TraccarPositionInput {
  uniqueId: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  speed?: number;            // nós
  bearing?: number;          // graus
  accuracy?: number;         // metros
  batt?: number;             // %
  timestamp: number;         // unix seg
}

/* ------------------------------------------------------------------ */
/* Constantes                                                          */
/* ------------------------------------------------------------------ */
const TRACCAR_API_BASE_URL =
  process.env.NEXT_PUBLIC_TRACCAR_API_URL ?? "https://track.talkhub.me";

const TRACCAR_API_CREDENTIALS =
  process.env.NEXT_PUBLIC_TRACCAR_API_CREDENTIALS;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const getEncodedCredentials = (): string | null => {
  if (!TRACCAR_API_CREDENTIALS) {
    console.error(
      "NEXT_PUBLIC_TRACCAR_API_CREDENTIALS não definido nas variáveis de ambiente."
    );
    return null;
  }
  try {
    return typeof window === "undefined"
      ? Buffer.from(TRACCAR_API_CREDENTIALS).toString("base64")
      : btoa(TRACCAR_API_CREDENTIALS);
  } catch (err) {
    console.error("Erro ao codificar credenciais Traccar:", err);
    return null;
  }
};

/* ------------------------------------------------------------------ */
/* Envia posição para API interna                                      */
/* ------------------------------------------------------------------ */
export async function sendPositionToTraccar(
  position: TraccarPositionInput
): Promise<boolean> {
  try {
    const res = await fetch("/api/traccar/position", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(position),
    });

    if (!res.ok) {
      console.error(
        `Traccar Proxy: chamada falhou (${res.status}) — ${await res.text()}`
      );
      return false;
    }

    const json: { success: boolean; error?: string } = await res.json();
    if (!json.success) {
      console.error(
        `Traccar Proxy: API interna retornou erro — ${json.error ?? "desconhecido"}`
      );
    }
    return json.success;
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Erro desconhecido no fetch";
    console.error("Traccar Proxy:", msg);
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Busca dispositivos no Traccar                                       */
/* ------------------------------------------------------------------ */
export async function getTraccarDevices(): Promise<Dispositivo[]> {
  const creds = getEncodedCredentials();
  if (!creds) throw new Error("Credenciais Traccar ausentes ou inválidas.");

  const url = `${TRACCAR_API_BASE_URL}/api/devices`;
  console.log("Traccar Get Devices:", url);

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Basic ${creds}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(
        `Falha ${res.status} ${res.statusText}: ${txt || "sem corpo"}`
      );
    }

    return (await res.json()) as Dispositivo[];
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Erro desconhecido no fetch";
    console.error("Traccar Get Devices:", msg);
    throw new Error(msg);
  }
}

/* ------------------------------------------------------------------ */
/* Verifica se credenciais Traccar são válidas                         */
/* ------------------------------------------------------------------ */
export async function verifyTraccarCredentials(): Promise<boolean> {
  const creds = getEncodedCredentials();
  if (!creds) return false;

  const url = `${TRACCAR_API_BASE_URL}/api/session`;
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Basic ${creds}`,
        Accept: "application/json",
      },
    });
    return res.ok;
  } catch (err) {
    console.error("Verify Traccar Credentials:", err);
    return false;
  }
}

