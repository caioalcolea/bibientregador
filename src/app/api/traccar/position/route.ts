// src/app/api/traccar/position/route.ts
import { NextResponse, type NextRequest } from "next/server";
import type { TraccarPositionInput } from "@/services/traccar";

const TRACCAR_OSMAND_ENDPOINT_URL =
  process.env.NEXT_PUBLIC_TRACCAR_API_URL ?? "https://track.talkhub.me";

/** Estrutura da resposta JSON desta rota */
type ApiResponse =
  | { success: true; traccar_response?: string; warning?: string }
  | { success: false; error: string; traccar_error?: string };

export async function POST(request: NextRequest) {
  try {
    const position = (await request.json()) as TraccarPositionInput;

    // Validação básica
    if (
      !position ||
      typeof position.uniqueId !== "string" ||
      typeof position.latitude !== "number" ||
      typeof position.longitude !== "number" ||
      typeof position.timestamp !== "number"
    ) {
      console.error(
        "API /api/traccar/position: dados inválidos recebidos:",
        position
      );
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Invalid position data received" },
        { status: 400 }
      );
    }

    console.log(
      `API /api/traccar/position: recebida posição de ${position.uniqueId}`
    );

    // Query do protocolo OsmAnd
    const params = new URLSearchParams({
      id: position.uniqueId,
      lat: position.latitude.toString(),
      lon: position.longitude.toString(),
      timestamp: position.timestamp.toString(),
    });

    if (position.altitude !== undefined)
      params.append("altitude", position.altitude.toString());
    if (position.speed !== undefined)
      params.append("speed", position.speed.toString());
    if (position.bearing !== undefined)
      params.append("bearing", position.bearing.toString());
    if (position.accuracy !== undefined)
      params.append("accuracy", position.accuracy.toString());
    if (position.batt !== undefined)
      params.append("batt", position.batt.toString());

    const traccarUrl = `${TRACCAR_OSMAND_ENDPOINT_URL}/?${params.toString()}`;
    console.log(
      `API /api/traccar/position: encaminhando para ${traccarUrl}`
    );

    const traccarResponse = await fetch(traccarUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
    });

    const responseText = await traccarResponse.text();

    if (traccarResponse.ok) {
      if (responseText.toUpperCase().includes("ERROR")) {
        console.warn(
          `Traccar respondeu 'ERROR' para ${position.uniqueId}: ${responseText}`
        );
        return NextResponse.json<ApiResponse>({
          success: true,
          traccar_response: responseText,
          warning: "Traccar reported an error",
        });
      }

      console.log(
        `Posição de ${position.uniqueId} encaminhada com sucesso.`
      );
      return NextResponse.json<ApiResponse>({
        success: true,
        traccar_response: responseText || "<empty>",
      });
    }

    console.error(
      `Falha ao encaminhar ${position.uniqueId}. Status: ${
        traccarResponse.status
      } – ${traccarResponse.statusText}. Resp: ${responseText}`
    );

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: `Failed to forward to Traccar (Status: ${traccarResponse.status})`,
        traccar_error: responseText,
      },
      { status: 502 }
    );
  } catch (err: unknown) {
    const message =
      err instanceof SyntaxError
        ? "Invalid JSON received in request body."
        : err instanceof Error && err.message
        ? err.message
        : "Internal server error";

    console.error("API /api/traccar/position: erro interno:", err);

    return NextResponse.json<ApiResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message:
      "API route for Traccar position updates is active. Use POST to send data.",
  });
}

