
import type { Posicao } from "@/lib/types";

/**
 * Represents a position input specifically for the Traccar OsmAnd HTTP protocol.
 */
export interface TraccarPositionInput {
  uniqueId: string; // Traccar unique ID (usually IMEI or configured ID)
  latitude: number;
  longitude: number;
  altitude?: number; // In meters
  speed?: number; // Speed in knots
  bearing?: number; // Course/Heading in degrees
  accuracy?: number; // Accuracy in meters
  batt?: number; // Battery level (percentage)
  timestamp: number; // Unix timestamp (seconds)
  // Add other relevant OsmAnd parameters if needed (e.g., hdop, vdop, satellites)
}


// Base URL for Traccar API/OsmAnd endpoint
// Ensure this points to the server configured to listen for OsmAnd requests.
// Often it's the main server URL, but could be a specific port like 5055 if not proxied.
const TRACCAR_ENDPOINT_URL = process.env.NEXT_PUBLIC_TRACCAR_API_URL || "https://track.talkhub.me"; // Use environment variable

/**
 * Sends position data to Traccar using the OsmAnd HTTP protocol format.
 * This is typically a GET request with parameters in the query string.
 * @param position - The position data matching the TraccarPositionInput interface.
 * @returns A promise that resolves to true if the request was likely successful (received 2xx response), false otherwise.
 */
export async function sendPositionToTraccar(position: TraccarPositionInput): Promise<boolean> {
  const params = new URLSearchParams();
  params.append('id', position.uniqueId); // Traccar uses 'id' for uniqueId in OsmAnd
  params.append('lat', position.latitude.toString());
  params.append('lon', position.longitude.toString());
  params.append('timestamp', position.timestamp.toString()); // Unix timestamp (seconds)

  // Append optional parameters if they exist
  if (position.altitude !== undefined) params.append('altitude', position.altitude.toString());
  if (position.speed !== undefined) params.append('speed', position.speed.toString()); // Knots expected by Traccar
  if (position.bearing !== undefined) params.append('bearing', position.bearing.toString()); // Also known as course
  if (position.accuracy !== undefined) params.append('accuracy', position.accuracy.toString());
  if (position.batt !== undefined) params.append('batt', position.batt.toString()); // Battery level

  // Construct the full URL for the GET request
  // The endpoint might be '/' or '/api/osmand' depending on server config. Using '/' based on previous examples.
  const url = `${TRACCAR_ENDPOINT_URL}/?${params.toString()}`;

  console.log(`Traccar Send Position URL: ${url}`); // Log the URL for debugging

  try {
    // Use GET method as standard for OsmAnd HTTP protocol
    const response = await fetch(url, {
      method: 'GET',
      // 'no-cors' mode might be needed if the Traccar server doesn't send appropriate
      // CORS headers for this specific endpoint, but it prevents reading the response.
      // Try without it first. If CORS errors occur, ensure Traccar config allows requests
      // from your app's origin or consider using 'no-cors' (less ideal).
      // mode: 'no-cors',
    });

    // Check if the response status code indicates success (e.g., 200 OK, 202 Accepted)
    if (response.ok) {
      // Traccar OsmAnd endpoint usually returns a simple text response or just 200 OK
      const responseText = await response.text(); // Read response body (optional)
      console.log(`Traccar Send Position: Success for device ${position.uniqueId}. Response: ${responseText || '<empty>'}`);
      return true;
    } else {
      // Log detailed error information if the request failed
      const errorText = await response.text();
      console.error(`Traccar Send Position: Failed for device ${position.uniqueId}. Status: ${response.status} ${response.statusText}. Response: ${errorText}`);
      return false;
    }
  } catch (error) {
    // Handle network errors or other exceptions during the fetch operation
    console.error(`Traccar Send Position: Network or other error for device ${position.uniqueId}:`, error);
    return false;
  }
}

// Removed getDevices, getPositions, authenticateAdmin as they are not used
// in the core functionality of sending position updates from the client.
// These would typically be used in an admin panel or backend service.
