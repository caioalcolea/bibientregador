
import type { Posicao, Dispositivo } from "@/lib/types";

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
}


// Base URL for Traccar API/OsmAnd endpoint
const TRACCAR_API_BASE_URL = process.env.NEXT_PUBLIC_TRACCAR_API_URL || "https://track.talkhub.me"; // Use environment variable for API base
const TRACCAR_OSMAND_ENDPOINT_URL = process.env.NEXT_PUBLIC_TRACCAR_API_URL || "https://track.talkhub.me"; // OsmAnd might be the same or different
const TRACCAR_API_CREDENTIALS = process.env.NEXT_PUBLIC_TRACCAR_API_CREDENTIALS; // Format: "username:password"

// Function to safely get Base64 encoded credentials
const getEncodedCredentials = (): string | null => {
    if (!TRACCAR_API_CREDENTIALS) {
        console.error("Traccar API Credentials (NEXT_PUBLIC_TRACCAR_API_CREDENTIALS) are not set in environment variables.");
        return null;
    }
    try {
        // Check if running in browser or server environment
        if (typeof window !== 'undefined') {
            // Browser environment
            return btoa(TRACCAR_API_CREDENTIALS);
        } else {
            // Node.js environment
            return Buffer.from(TRACCAR_API_CREDENTIALS).toString('base64');
        }
    } catch (error) {
        console.error("Error encoding Traccar credentials:", error);
        return null;
    }
};

/**
 * Sends position data to Traccar using the OsmAnd HTTP protocol format.
 * @param position - The position data matching the TraccarPositionInput interface.
 * @returns A promise that resolves to true if the request was likely successful (received 2xx response), false otherwise.
 */
export async function sendPositionToTraccar(position: TraccarPositionInput): Promise<boolean> {
  const params = new URLSearchParams();
  params.append('id', position.uniqueId);
  params.append('lat', position.latitude.toString());
  params.append('lon', position.longitude.toString());
  params.append('timestamp', position.timestamp.toString());

  if (position.altitude !== undefined) params.append('altitude', position.altitude.toString());
  if (position.speed !== undefined) params.append('speed', position.speed.toString());
  if (position.bearing !== undefined) params.append('bearing', position.bearing.toString());
  if (position.accuracy !== undefined) params.append('accuracy', position.accuracy.toString());
  if (position.batt !== undefined) params.append('batt', position.batt.toString());

  // Use the specific OsmAnd endpoint URL
  const url = `${TRACCAR_OSMAND_ENDPOINT_URL}/?${params.toString()}`;
  console.log(`Traccar Send Position URL: ${url}`);

  try {
    const response = await fetch(url, { method: 'GET' });
    if (response.ok) {
      const responseText = await response.text();
      console.log(`Traccar Send Position: Success for device ${position.uniqueId}. Response: ${responseText || '<empty>'}`);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`Traccar Send Position: Failed for device ${position.uniqueId}. Status: ${response.status} ${response.statusText}. Response: ${errorText}`);
      return false;
    }
  } catch (error) {
    console.error(`Traccar Send Position: Network or other error for device ${position.uniqueId}:`, error);
    return false;
  }
}

/**
 * Fetches all devices from the Traccar API.
 * Requires Basic Authentication credentials set in environment variables.
 * @returns A promise that resolves to an array of Traccar Devices.
 * @throws An error if credentials are missing or the API call fails.
 */
export async function getTraccarDevices(): Promise<Dispositivo[]> {
  const encodedCredentials = getEncodedCredentials();
  if (!encodedCredentials) {
    throw new Error("Traccar API credentials are missing or invalid.");
  }

  const url = `${TRACCAR_API_BASE_URL}/api/devices`;
  console.log(`Traccar Get Devices: Fetching from ${url}`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${encodedCredentials}`,
        'Accept': 'application/json', // Ensure we request JSON
      }
    });

    if (response.ok) {
      const devices: Dispositivo[] = await response.json();
      console.log(`Traccar Get Devices: Successfully fetched ${devices.length} devices.`);
      return devices;
    } else {
      const errorText = await response.text();
      console.error(`Traccar Get Devices: Failed. Status: ${response.status} ${response.statusText}. Response: ${errorText}`);
      throw new Error(`Failed to fetch Traccar devices (Status: ${response.status})`);
    }
  } catch (error) {
    console.error("Traccar Get Devices: Network or other error:", error);
    throw new Error("Network error while fetching Traccar devices.");
  }
}

/**
 * Verifies Traccar user credentials (used indirectly for driver verification).
 * Note: This checks the API credentials themselves, not individual driver logins against Traccar.
 * The provided script uses device name matching, not password verification against Traccar.
 * @returns A promise that resolves to true if the credentials are valid (API responds successfully), false otherwise.
 */
export async function verifyTraccarCredentials(): Promise<boolean> {
    const encodedCredentials = getEncodedCredentials();
    if (!encodedCredentials) {
        return false; // Credentials not set
    }

    const url = `${TRACCAR_API_BASE_URL}/api/session`; // Endpoint to test credentials
    console.log(`Traccar Verify Credentials: Testing connection to ${url}`);

    try {
        const response = await fetch(url, {
            method: 'GET', // Or POST depending on what /api/session expects for verification
            headers: {
                'Authorization': `Basic ${encodedCredentials}`,
                'Accept': 'application/json',
            }
        });

        if (response.ok) {
            console.log("Traccar Verify Credentials: Credentials are valid.");
            return true;
        } else {
            console.warn(`Traccar Verify Credentials: Invalid credentials or API error. Status: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.error("Traccar Verify Credentials: Network or other error:", error);
        return false;
    }
}
