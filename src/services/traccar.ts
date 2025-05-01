
import type { Posicao, Dispositivo } from "@/lib/types";

/**
 * Represents a position input specifically for the Traccar OsmAnd HTTP protocol.
 * This is the data structure expected by the internal API route.
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


// Base URL for Traccar API endpoint (Used for fetching devices, not sending position directly from client now)
const TRACCAR_API_BASE_URL = process.env.NEXT_PUBLIC_TRACCAR_API_URL || "https://track.talkhub.me"; // Use environment variable for API base
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
 * Sends position data to our internal Next.js API route, which will then forward it to Traccar.
 * This avoids direct client-side calls to Traccar, mitigating CORS issues.
 * @param position - The position data matching the TraccarPositionInput interface.
 * @returns A promise that resolves to true if the API route accepted the request, false otherwise.
 */
export async function sendPositionToTraccar(position: TraccarPositionInput): Promise<boolean> {
  const apiUrl = '/api/traccar/position'; // Internal API route path
  console.log(`Traccar Proxy: Sending position data for ${position.uniqueId} to internal API route ${apiUrl}`);

  try {
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(position), // Send data in the body
    });

    if (response.ok) {
        const result = await response.json();
        if (result.success) {
             console.log(`Traccar Proxy: Internal API route successfully processed position for ${position.uniqueId}.`);
             return true;
        } else {
             console.error(`Traccar Proxy: Internal API route failed to process position for ${position.uniqueId}. Reason: ${result.error || 'Unknown error'}`);
             return false;
        }
    } else {
      const errorText = await response.text();
      console.error(`Traccar Proxy: Failed to call internal API route for device ${position.uniqueId}. Status: ${response.status} ${response.statusText}. Response: ${errorText}`);
      return false;
    }
  } catch (error) {
    console.error(`Traccar Proxy: Network or other error calling internal API route for device ${position.uniqueId}:`, error);
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
         console.error("Traccar Proxy: 'Failed to fetch' error calling internal API. Check network or if the API route is running.");
    }
    return false;
  }
}


/**
 * Fetches all devices from the Traccar API.
 * Requires Basic Authentication credentials set in environment variables.
 * This function can still be called from the client if needed, but ensure CORS is handled for this endpoint on the Traccar server OR use an API route proxy.
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
      // Check for specific statuses like 401 Unauthorized
      if (response.status === 401) {
         throw new Error(`Failed to fetch Traccar devices: Invalid Credentials (Status: 401)`);
      }
      throw new Error(`Failed to fetch Traccar devices (Status: ${response.status})`);
    }
  } catch (error: any) {
    console.error("Traccar Get Devices: Network or other error:", error);
    // Rethrow with a more specific message if possible
    if (error.message.includes('Failed to fetch')) {
         // This might indicate CORS issue if called from client, or network issue
         console.error("Traccar Get Devices: 'Failed to fetch' error. Possible CORS issue if called from client, network error, or invalid URL.");
         throw new Error("Network error or CORS issue while fetching Traccar devices.");
    }
    throw new Error(error.message || "Error fetching Traccar devices.");
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

    // Use a reliable endpoint that requires auth, like /api/session or /api/server
    const url = `${TRACCAR_API_BASE_URL}/api/session`;
    console.log(`Traccar Verify Credentials: Testing connection to ${url}`);

    try {
        const response = await fetch(url, {
            method: 'GET', // GET is usually sufficient for /api/session
            headers: {
                'Authorization': `Basic ${encodedCredentials}`,
                'Accept': 'application/json',
            }
        });

        if (response.ok) {
             // Attempt to parse JSON to ensure it's a valid session response
             await response.json();
            console.log("Traccar Verify Credentials: Credentials are valid.");
            return true;
        } else {
            console.warn(`Traccar Verify Credentials: Invalid credentials or API error. Status: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.error("Traccar Verify Credentials: Network or other error:", error);
         // Add specific error handling if needed (e.g., CORS error detection)
         if (error instanceof TypeError && error.message === 'Failed to fetch') {
            console.error("Traccar Verify Credentials: 'Failed to fetch' error. Possible CORS issue, network error, invalid URL, or mixed content.");
         }
        return false;
    }
}
