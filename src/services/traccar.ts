import type { Posicao } from "@/lib/types";

/**
 * Represents a device.
 */
export interface Device {
  /**
   * The ID of the device.
   */
  id: string;
  /**
   * The name of the device.
   */
  name: string;
  /**
   * The unique ID of the device.
   */
  uniqueId: string;
}

/**
 * Represents a position (input for Traccar OsmAnd format).
 * This might differ slightly from the Firebase Posicao model.
 */
export interface TraccarPositionInput {
  uniqueId: string; // Traccar unique ID
  latitude: number;
  longitude: number;
  altitude?: number;
  speed?: number; // Speed in knots
  bearing?: number; // Course/Heading
  accuracy?: number;
  batt?: number; // Battery level (percentage)
  timestamp: number; // Unix timestamp (seconds)
  // Add other relevant OsmAnd parameters if needed
}


// Base URL for Traccar API
const TRACCAR_API_URL = process.env.NEXT_PUBLIC_TRACCAR_API_URL || "https://track.talkhub.me"; // Use environment variable

// TODO: Securely manage Traccar admin credentials or use per-device tokens if possible.
// Avoid hardcoding credentials. Authentication might be needed for device management,
// but sending positions often uses a simpler URL-based method (OsmAnd protocol).
// const TRACCAR_ADMIN_USER = process.env.TRACCAR_ADMIN_USER;
// const TRACCAR_ADMIN_PASSWORD = process.env.TRACCAR_ADMIN_PASSWORD;


/**
 * Asynchronously retrieves devices from Traccar.
 * Requires Authentication.
 * @returns A promise that resolves to an array of Device objects.
 */
export async function getDevices(): Promise<Device[]> {
  console.warn("Traccar getDevices: Not implemented. Requires authenticated API call.");
  // TODO: Implement authenticated call to /api/devices
  // Example structure:
  // const authenticatedFetch = /* ... get authenticated fetch instance ... */;
  // const response = await authenticatedFetch(`${TRACCAR_API_URL}/api/devices`);
  // if (!response.ok) throw new Error('Failed to fetch devices');
  // return await response.json();

  // Placeholder data:
  return [
    {
      id: '1', // Traccar's internal ID
      name: 'Device 1 Simulated',
      uniqueId: 'simulated_id_123', // The ID used for sending positions
    },
     {
      id: '2',
      name: 'Device 2 Simulated',
      uniqueId: 'simulated_id_456',
    },
  ];
}

/**
 * Asynchronously retrieves positions from Traccar.
 * Requires Authentication.
 * @returns A promise that resolves to an array of Position objects (Traccar's format).
 */
export async function getPositions(deviceId?: string): Promise<any[]> {
   console.warn("Traccar getPositions: Not implemented. Requires authenticated API call.");
  // TODO: Implement authenticated call to /api/positions (potentially filtered by deviceId, dates)
  // Example structure:
  // const authenticatedFetch = /* ... get authenticated fetch instance ... */;
  // const url = deviceId ? `${TRACCAR_API_URL}/api/positions?deviceId=${deviceId}` : `${TRACCAR_API_URL}/api/positions`;
  // const response = await authenticatedFetch(url);
  // if (!response.ok) throw new Error('Failed to fetch positions');
  // return await response.json();

  // Placeholder data:
  return [
    {
      id: 101, // Traccar's internal position ID
      deviceId: 1, // Matches Traccar device ID
      latitude: -23.5505,
      longitude: -46.6333,
      altitude: 760,
      speed: 10, // knots
      course: 90,
      deviceTime: "2023-10-27T10:00:00Z",
      fixTime: "2023-10-27T10:00:00Z",
      serverTime: "2023-10-27T10:00:05Z",
      attributes: { batteryLevel: 85, accuracy: 15 },
    },
  ];
}

/**
 * Authenticates with the Traccar API using admin credentials.
 * IMPORTANT: This should ideally be done server-side (e.g., in a Cloud Function)
 * and not directly in the client-side code due to security risks.
 * @returns A promise that resolves to true if authentication is successful.
 */
export async function authenticateAdmin(): Promise<boolean> {
  console.warn("Traccar authenticateAdmin: Not implemented securely for client-side. Use server-side authentication.");
  // TODO: Implement server-side authentication if needed for management tasks.
  // For client-side position sending via OsmAnd, this might not be required.
  return true; // Placeholder
}


/**
 * Sends position data to Traccar using the OsmAnd HTTP protocol format.
 * This usually doesn't require complex session authentication.
 * @param position - The position data matching the TraccarPositionInput interface.
 */
export async function sendPositionToTraccar(position: TraccarPositionInput): Promise<boolean> {
  const params = new URLSearchParams();
  params.append('id', position.uniqueId);
  params.append('lat', position.latitude.toString());
  params.append('lon', position.longitude.toString());
  params.append('timestamp', position.timestamp.toString());

  if (position.altitude !== undefined) params.append('altitude', position.altitude.toString());
  if (position.speed !== undefined) params.append('speed', position.speed.toString()); // Knots
  if (position.bearing !== undefined) params.append('bearing', position.bearing.toString());
  if (position.accuracy !== undefined) params.append('accuracy', position.accuracy.toString());
  if (position.batt !== undefined) params.append('batt', position.batt.toString());

  // Construct the URL (Traccar typically listens on port 5055 for OsmAnd by default, but depends on config)
  // The prompt specified sending to /api/?... which implies the main web server port (80/443)
  // is configured to proxy/handle OsmAnd requests. Double-check Traccar setup.
  const url = `${TRACCAR_API_URL}/?${params.toString()}`; // Using base URL + OsmAnd query params

  console.log(`Traccar Send Position URL: ${url}`); // Log the URL for debugging

  try {
    // We use GET for OsmAnd protocol as specified by Traccar docs
    const response = await fetch(url, {
      method: 'GET', // Or POST depending on Traccar config, GET is common for OsmAnd URL format
      // mode: 'no-cors' // Might be needed if Traccar server doesn't send CORS headers for this endpoint
    });

    // Traccar OsmAnd endpoint usually returns 200 OK with simple text body on success
    if (response.ok) {
      console.log(`Traccar Send Position: Success for device ${position.uniqueId}`);
      // Consider checking response text if needed, e.g., await response.text();
      return true;
    } else {
      console.error(`Traccar Send Position: Failed for device ${position.uniqueId}. Status: ${response.status}, Text: ${await response.text()}`);
      return false;
    }
  } catch (error) {
    console.error(`Traccar Send Position: Network or other error for device ${position.uniqueId}:`, error);
    return false;
  }
}
