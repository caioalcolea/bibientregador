
import { NextResponse, type NextRequest } from 'next/server';
import type { TraccarPositionInput } from '@/services/traccar'; // Use the same input type

// Ensure the Traccar OsmAnd endpoint URL is available server-side
const TRACCAR_OSMAND_ENDPOINT_URL = process.env.NEXT_PUBLIC_TRACCAR_API_URL || "https://track.talkhub.me";

export async function POST(request: NextRequest) {
  try {
    const position = (await request.json()) as TraccarPositionInput;

    // Validate received data (basic validation)
    if (
      !position ||
      typeof position.uniqueId !== 'string' ||
      typeof position.latitude !== 'number' ||
      typeof position.longitude !== 'number' ||
      typeof position.timestamp !== 'number'
    ) {
      console.error('API Route /api/traccar/position: Invalid data received:', position);
      return NextResponse.json({ success: false, error: 'Invalid position data received' }, { status: 400 });
    }

    console.log(`API Route /api/traccar/position: Received position for ${position.uniqueId}`);

    // Construct the URL for the actual Traccar OsmAnd endpoint
    const params = new URLSearchParams();
    params.append('id', position.uniqueId);
    params.append('lat', position.latitude.toString());
    params.append('lon', position.longitude.toString());
    params.append('timestamp', position.timestamp.toString());

    if (position.altitude !== undefined) params.append('altitude', position.altitude.toString());
    if (position.speed !== undefined) params.append('speed', position.speed.toString()); // Send knots directly
    if (position.bearing !== undefined) params.append('bearing', position.bearing.toString());
    if (position.accuracy !== undefined) params.append('accuracy', position.accuracy.toString());
    if (position.batt !== undefined) params.append('batt', position.batt.toString());

    const traccarUrl = `${TRACCAR_OSMAND_ENDPOINT_URL}/?${params.toString()}`;
    console.log(`API Route /api/traccar/position: Forwarding to Traccar URL: ${traccarUrl}`);

    // Make the fetch call from the server-side to Traccar
    const traccarResponse = await fetch(traccarUrl, {
      method: 'POST', // OsmAnd protocol usually expects POST
      headers: {
         // OsmAnd protocol usually doesn't require specific headers for this endpoint type
         // Keep it minimal unless Traccar server specifically requires something
         'Content-Type': 'text/plain', // Even with no body, this can sometimes help
      },
      // No body is sent as data is in query parameters for OsmAnd protocol
    });

    if (traccarResponse.ok) {
      const responseText = await traccarResponse.text();
      // Check for specific success/error strings if the protocol defines them
      if (responseText.toUpperCase().includes("ERROR")) {
         console.error(`API Route /api/traccar/position: Traccar server responded OK but returned error message for device ${position.uniqueId}: ${responseText}`);
         // Still return success: true to the client, as the API route itself worked, but log the Traccar error.
         // Or return success: false if client needs to know about Traccar failure. Let's return true for now.
         return NextResponse.json({ success: true, traccar_response: responseText, warning: 'Traccar reported an error' });
      }
      console.log(`API Route /api/traccar/position: Successfully forwarded position for ${position.uniqueId} to Traccar. Response: ${responseText || '<empty>'}`);
      return NextResponse.json({ success: true, traccar_response: responseText });
    } else {
      const errorText = await traccarResponse.text();
      console.error(`API Route /api/traccar/position: Failed to forward position for ${position.uniqueId} to Traccar. Status: ${traccarResponse.status} ${traccarResponse.statusText}. Response: ${errorText}`);
      // Return failure to the client
      return NextResponse.json({ success: false, error: `Failed to forward to Traccar (Status: ${traccarResponse.status})`, traccar_error: errorText }, { status: 502 }); // Bad Gateway
    }
  } catch (error: any) {
    console.error('API Route /api/traccar/position: Internal server error:', error);
    let errorMessage = 'Internal server error';
    if (error instanceof SyntaxError) {
        errorMessage = 'Invalid JSON received in request body.';
    } else if (error.message) {
        errorMessage = error.message;
    }
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// Optional: Add a GET handler for testing or other purposes
export async function GET() {
    return NextResponse.json({ message: 'API route for Traccar position updates is active. Use POST to send data.' });
}
