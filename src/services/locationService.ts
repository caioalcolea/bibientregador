
// Location Tracking Service for Next.js Web App

import type { Posicao, Entrega, FirebaseTimestamp, AuthUser } from '@/lib/types';
import { db } from '@/lib/firebase'; // Import initialized Firebase Firestore
import { collection, addDoc, serverTimestamp, updateDoc, doc, getDocs, query, where, limit, writeBatch, Timestamp } from 'firebase/firestore';
import { sendPositionToTraccar, type TraccarPositionInput } from './traccar'; // Function to push to Traccar API

let trackingInterval: NodeJS.Timeout | null = null;
let currentUserContext: AuthUser | null = null; // Store the full user context
let lastKnownPosition: GeolocationPosition | null = null;

const TRACKING_INTERVAL_MS = 30000; // 30 seconds - Reduced interval for more frequent updates
const MIN_DISTANCE_UPDATE_METERS = 50; // Only update if moved at least 50 meters


// --- Utility Functions ---

/**
 * Calculates the distance between two geographic coordinates using the Haversine formula.
 * @param lat1 Latitude of the first point.
 * @param lon1 Longitude of the first point.
 * @param lat2 Latitude of the second point.
 * @param lon2 Longitude of the second point.
 * @returns The distance in meters.
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Gets the current location using Geolocation API with higher accuracy settings.
 */
const getCurrentLocation = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject(new Error("Geolocation is not supported or not available in this environment."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true, // Request high accuracy
      timeout: 15000, // Increased timeout to 15 seconds
      maximumAge: 0, // Force fresh location data
    });
  });
};


// --- Firestore Update Logic ---

/**
 * Updates the driver's current position in relevant 'deliveries' documents in Firestore.
 * Finds 'in_progress' deliveries assigned to the current driver for the correct company.
 * @param positionData - The current position data.
 */
const updatePositionInDeliveries = async (positionData: Omit<Posicao, 'id' | 'serverTime'>) => {
  if (!currentUserContext || !db) {
     console.warn("Cannot update deliveries, missing user context or DB connection.");
     return;
  }

  const { uid: driverId, empresaCodigo } = currentUserContext;
  const { latitude, longitude, speed, course, altitude, deviceTime } = positionData;
  console.log(`Location Service: Updating 'in_progress' deliveries for driver ${driverId} in company ${empresaCodigo}`);

  try {
    // Query for 'in_progress' deliveries assigned to this driver and company
    const deliveriesQuery = query(
      collection(db, "deliveries"),
      where("empresa_codigo", "==", empresaCodigo),
      where("driver_id", "==", driverId),
      where("status", "==", "in_progress")
      // No limit, update all active deliveries for the driver
    );

    const querySnapshot = await getDocs(deliveriesQuery);

    if (querySnapshot.empty) {
      console.log("Location Service: No 'in_progress' deliveries found for this driver to update.");
      return;
    }

    // Use a batch write for efficiency if updating multiple documents
    const batch = writeBatch(db);
    let updateCount = 0;

    querySnapshot.forEach((docSnap) => {
       const deliveryRef = doc(db, "deliveries", docSnap.id);
       const deliveryData = docSnap.data() as Entrega;

       // Prepare the update payload matching the target schema
       const updatePayload: Partial<Entrega> = {
         posicao_atual_lat: latitude,
         posicao_atual_lon: longitude,
         speed: speed ?? null, // Use null if undefined
         course: course?.toString() ?? null, // Convert course to string or null
         altitude: altitude ?? null,
         timestamp: deviceTime, // Use device time for the position timestamp
         updated_at: serverTimestamp() as FirebaseTimestamp, // Update the general updated_at timestamp
       };

       // Calculate distance to destination if lat/lon are available
       if (deliveryData.lat && deliveryData.lon) {
          updatePayload.distancia_destino = calculateDistance(latitude, longitude, deliveryData.lat, deliveryData.lon);
       }

       batch.update(deliveryRef, updatePayload);
       updateCount++;
       console.log(`Location Service: Queued update for delivery ID: ${docSnap.id}`);
    });

    await batch.commit();
    console.log(`Location Service: Successfully updated position in ${updateCount} deliveries.`);

  } catch (error) {
    console.error("Location Service: Error updating position in deliveries:", error);
  }
};


// --- Traccar Synchronization ---

/**
 * Formats position data and sends it to Traccar.
 * @param position - The raw GeolocationPosition object.
 */
const syncPositionWithTraccar = async (position: GeolocationPosition) => {
    if (!currentUserContext) {
        console.warn("Traccar Sync: Missing user context.");
        return;
    }

    const { uniqueId } = currentUserContext; // Traccar device uniqueId
    const { latitude, longitude, altitude, speed, heading, accuracy } = position.coords;
    const timestamp = Math.floor(position.timestamp / 1000); // Unix timestamp in seconds

    const traccarPayload: TraccarPositionInput = {
        uniqueId: uniqueId,
        latitude: latitude,
        longitude: longitude,
        timestamp: timestamp,
        altitude: altitude ?? undefined,
        speed: speed ? speed * 1.94384 : undefined, // Convert m/s to knots
        bearing: heading ?? undefined,
        accuracy: accuracy ?? undefined,
        // batt: await navigator.getBattery?.().then(b => b.level * 100).catch(() => undefined), // Optional battery
    };

    console.log("Traccar Sync: Sending position:", traccarPayload);
    try {
        const success = await sendPositionToTraccar(traccarPayload);
        if (success) {
            console.log("Traccar Sync: Position sent successfully.");
            // Optionally update a 'lastSyncedToTraccar' field in Firestore if needed
        } else {
            console.warn("Traccar Sync: Failed to send position.");
            // Handle failure (e.g., retry logic, though complex for web)
        }
    } catch (error) {
        console.error("Traccar Sync: Error sending position:", error);
    }
};

// --- Main Tracking Logic ---

/**
 * The core tracking function, executed periodically.
 */
const trackLocation = async () => {
  if (!currentUserContext) {
    console.warn("Tracking stopped: Missing user context.");
    stopLocationService();
    return;
  }

  console.log("Location Service: Attempting to get location...");
  try {
    const position = await getCurrentLocation();
    const now = new Date();
    const currentLat = position.coords.latitude;
    const currentLon = position.coords.longitude;

    console.log(`Location Service: Location acquired: ${currentLat}, ${currentLon} (Accuracy: ${position.coords.accuracy}m)`);

    // Check if the user has moved significantly since the last update
    let shouldUpdate = true;
    if (lastKnownPosition) {
        const distanceMoved = calculateDistance(
            lastKnownPosition.coords.latitude,
            lastKnownPosition.coords.longitude,
            currentLat,
            currentLon
        );
        console.log(`Location Service: Distance moved since last update: ${distanceMoved.toFixed(2)}m`);
        if (distanceMoved < MIN_DISTANCE_UPDATE_METERS) {
            console.log(`Location Service: Skipping update, distance moved (${distanceMoved.toFixed(2)}m) is less than threshold (${MIN_DISTANCE_UPDATE_METERS}m).`);
            shouldUpdate = false;
        }
    }

    if (shouldUpdate) {
        console.log("Location Service: Significant movement detected or first update, proceeding.");
        lastKnownPosition = position; // Update last known position

        const positionData: Omit<Posicao, 'id' | 'serverTime'> = {
            uniqueId: currentUserContext.uniqueId, // Use uniqueId from context
            deviceId: currentUserContext.uniqueId, // Often uniqueId is also used as deviceId, adjust if different
            latitude: currentLat,
            longitude: currentLon,
            altitude: position.coords.altitude ?? undefined,
            speed: position.coords.speed ? position.coords.speed * 1.94384 : undefined, // m/s to knots
            course: position.coords.heading ?? undefined,
            accuracy: position.coords.accuracy ?? undefined,
            attributes: {
                // battery: await navigator.getBattery?.().then(b => b.level * 100).catch(() => undefined), // Example battery
                source: 'web-app',
                timestampAccuracy: position.timestamp, // Include original timestamp for reference
            },
             // Use Firebase Timestamp for Firestore compatibility
            deviceTime: Timestamp.fromDate(now),
            fixTime: Timestamp.fromDate(new Date(position.timestamp)),
            empresa_codigo: currentUserContext.empresaCodigo,
            // protocol: 'web', // Indicate source if needed
        };

        // Update Firestore 'deliveries' table
        await updatePositionInDeliveries(positionData);

        // Send position to Traccar
        await syncPositionWithTraccar(position);

    }

  } catch (error: any) {
    console.error("Location Service: Error getting or processing location:", error.message);
    // Handle specific errors, e.g., geolocation permission denied
    if (error.code === error.PERMISSION_DENIED) {
      console.error("Location Service: Geolocation permission denied by user.");
      stopLocationService(); // Stop the service if permission is denied
      // Consider notifying the user via toast or UI update
    }
  }
};


// --- Service Control Functions ---

/**
 * Starts the location tracking service simulation.
 * @param user - The authenticated user object containing necessary IDs.
 */
export const startLocationService = (user: AuthUser) => {
  if (trackingInterval) {
    console.warn("Location Service: Already running.");
    return;
  }
  if (typeof window === 'undefined' || !navigator.geolocation) {
      console.warn("Location Service: Geolocation not available. Cannot start service.");
      return;
  }

  console.log(`Location Service: Starting for user ${user.uid}, Traccar ID ${user.uniqueId}, company ${user.empresaCodigo}`);
  currentUserContext = user;
  lastKnownPosition = null; // Reset last known position on start

  // Request permission and run immediately first time
  navigator.permissions?.query({ name: 'geolocation' }).then((permissionStatus) => {
    if (permissionStatus.state === 'granted' || permissionStatus.state === 'prompt') {
        trackLocation(); // Run immediately
        // Then run on interval
        trackingInterval = setInterval(trackLocation, TRACKING_INTERVAL_MS);
    } else {
        console.error("Location Service: Geolocation permission denied. Service not started.");
         stopLocationService(); // Ensure it's stopped
        // Maybe show a toast asking the user to enable permissions
    }
     permissionStatus.onchange = () => {
        if (permissionStatus.state !== 'granted') {
            console.warn("Location Service: Geolocation permission revoked. Stopping service.");
            stopLocationService();
        }
     }
  }).catch(err => {
     console.error("Location Service: Error checking geolocation permission:", err);
     // Fallback for browsers not supporting permissions query - try starting anyway
     trackLocation();
     trackingInterval = setInterval(trackLocation, TRACKING_INTERVAL_MS);
  });
};

/**
 * Stops the location tracking service simulation.
 */
export const stopLocationService = () => {
  if (trackingInterval) {
    console.log("Location Service: Stopping.");
    clearInterval(trackingInterval);
    trackingInterval = null;
  }
  currentUserContext = null; // Clear user context
  lastKnownPosition = null; // Clear last known position
};

/**
 * Checks if the service is currently running (has an active interval).
 * @returns True if the service interval is set, false otherwise.
 */
export const isLocationServiceRunning = (): boolean => {
  return !!trackingInterval;
};
