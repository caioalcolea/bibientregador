// src/services/locationService.ts
// Serviço de rastreamento de localização para o web‑app

import type {
  Posicao,
  Entrega,
  FirebaseTimestamp,
  AuthUser,
} from "@/lib/types";
import { db } from "@/lib/firebase";
import {
  collection,
  serverTimestamp,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import {
  sendPositionToTraccar,
  type TraccarPositionInput,
} from "./traccar";

/* ------------------------------------------------------------------ */
/* Constantes & estado interno                                         */
/* ------------------------------------------------------------------ */
const TRACKING_INTERVAL_MS = 30_000; // 30 s
const MIN_DISTANCE_UPDATE_METERS = 50;

let trackingInterval: NodeJS.Timeout | null = null;
let currentAuthUser: AuthUser | null = null;
let lastKnownPosition: GeolocationPosition | null = null;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const haversine = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6_371_000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getCurrentLocation = (): Promise<GeolocationPosition> =>
  new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(
        new Error("Geolocation não é suportada ou não está disponível.")
      );
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15_000,
      maximumAge: 0,
    });
  });

/* ------------------------------------------------------------------ */
/* Atualiza entregas em progresso                                      */
/* ------------------------------------------------------------------ */
const updatePositionInDeliveries = async (
  positionData: Omit<Posicao, "id" | "serverTime">
) => {
  if (!currentAuthUser) return;

  const { empresaCodigo, uniqueId } = currentAuthUser;
  const { latitude, longitude, speed, course, altitude, fixTime } =
    positionData;

  const deliveriesQuery = query(
    collection(db, "deliveries"),
    where("empresa_codigo", "==", empresaCodigo),
    where("driver_id", "==", uniqueId),
    where("status", "==", "in_progress")
  );

  const snap = await getDocs(deliveriesQuery);

  if (snap.empty) return;

  const batch = writeBatch(db);

  snap.forEach((d) => {
    const ref = doc(db, "deliveries", d.id);
    const data = d.data() as Entrega;

    const payload: Partial<Entrega> = {
      posicao_atual_lat: latitude,
      posicao_atual_lon: longitude,
      speed,
      course: course?.toString(),
      altitude,
      timestamp: fixTime as FirebaseTimestamp,
      updated_at: serverTimestamp() as FirebaseTimestamp,
    };

    if (data.lat && data.lon) {
      payload.distancia_destino = haversine(
        latitude,
        longitude,
        data.lat,
        data.lon
      );
    }

    batch.update(ref, payload);
  });

  await batch.commit();
};

/* ------------------------------------------------------------------ */
/* Envia posição ao Traccar                                            */
/* ------------------------------------------------------------------ */
const syncPositionWithTraccar = async (p: GeolocationPosition) => {
  if (!currentAuthUser) return;

  const { uniqueId } = currentAuthUser;
  const { latitude, longitude, altitude, speed, heading, accuracy } = p.coords;

  const payload: TraccarPositionInput = {
    uniqueId,
    latitude,
    longitude,
    timestamp: Math.floor(p.timestamp / 1000),
    altitude: altitude ?? undefined,
    speed: speed ? speed * 1.94384 : undefined, // m/s → nós
    bearing: heading ?? undefined,
    accuracy: accuracy ?? undefined,
  };

  await sendPositionToTraccar(payload).catch((err) =>
    console.error("Traccar Sync:", err)
  );
};

/* ------------------------------------------------------------------ */
/* Loop principal                                                      */
/* ------------------------------------------------------------------ */
const trackLocation = async () => {
  if (!currentAuthUser) {
    stopLocationService();
    return;
  }

  try {
    const pos = await getCurrentLocation();
    const { latitude, longitude } = pos.coords;

    let shouldUpdate = true;
    if (lastKnownPosition) {
      const dist = haversine(
        lastKnownPosition.coords.latitude,
        lastKnownPosition.coords.longitude,
        latitude,
        longitude
      );
      shouldUpdate = dist >= MIN_DISTANCE_UPDATE_METERS;
    }

    if (shouldUpdate) {
      lastKnownPosition = pos;

      const now = new Date();
      const baseData: Omit<Posicao, "id" | "serverTime"> = {
        uniqueId: currentAuthUser.uniqueId,
        deviceId: currentAuthUser.uniqueId,
        latitude,
        longitude,
        altitude: pos.coords.altitude ?? undefined,
        speed: pos.coords.speed ? pos.coords.speed * 1.94384 : undefined,
        course: pos.coords.heading ?? undefined,
        accuracy: pos.coords.accuracy ?? undefined,
        attributes: { source: "web-app" },
        deviceTime: Timestamp.fromDate(now),
        fixTime: Timestamp.fromDate(new Date(pos.timestamp)),
        empresa_codigo: currentAuthUser.empresaCodigo,
      };

      await Promise.all([
        updatePositionInDeliveries(baseData),
        syncPositionWithTraccar(pos),
      ]);
    }
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Erro inesperado no rastreamento.";
    console.error("Location Service:", msg);
  }
};

/* ------------------------------------------------------------------ */
/* Controladores públicos                                              */
/* ------------------------------------------------------------------ */
export const startLocationService = (user: AuthUser) => {
  if (trackingInterval) return;
  if (!navigator.geolocation) return;

  currentAuthUser = user;
  trackLocation();
  trackingInterval = setInterval(trackLocation, TRACKING_INTERVAL_MS);
};

export const stopLocationService = () => {
  if (trackingInterval) clearInterval(trackingInterval);
  trackingInterval = null;
  currentAuthUser = null;
  lastKnownPosition = null;
};

export const isLocationServiceRunning = () => !!trackingInterval;

