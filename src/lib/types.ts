import type { Timestamp } from "firebase/firestore";

export interface FirebaseTimestamp extends Timestamp {}

export interface Empresa {
  id: string;
  codigo: string;
  nome: string;
  config?: Record<string, any>; // Using Record for Map<String, dynamic>
  created_at?: FirebaseTimestamp;
  api_key?: string; // Potentially sensitive, consider security implications
  admin_login?: string; // Potentially sensitive
  admin_senha?: string; // Potentially sensitive
}

export interface Entregador {
  id: string; // Corresponds to Firebase Auth UID
  empresa_codigo: string;
  login: string; // Email used for Firebase Auth
  // senha should not be stored directly; managed by Firebase Auth
  nome: string;
  uniqueId: string; // Traccar uniqueId
  status: 'online' | 'offline' | 'inativo'; // Example statuses
  fcmToken?: string; // For push notifications
  last_seen?: FirebaseTimestamp;
}

export interface Dispositivo {
  id: string; // Traccar device ID
  name: string;
  uniqueId: string; // Traccar unique ID (redundant but might be useful)
  status?: 'online' | 'offline' | 'unknown'; // Traccar status
  lastUpdate?: FirebaseTimestamp; // Traccar last update time
  phone?: string;
  model?: string;
  contact?: string;
  empresa_codigo: string; // Link to Empresa
}

export interface Posicao {
  id: string; // Firestore document ID
  deviceId: string; // Traccar device ID
  protocol?: string;
  serverTime?: FirebaseTimestamp; // Time received by server (Firebase)
  deviceTime: FirebaseTimestamp; // Time reported by device
  fixTime: FirebaseTimestamp; // Time of GPS fix
  latitude: number;
  longitude: number;
  altitude?: number;
  speed?: number; // Speed in knots (Traccar default)
  course?: number; // Direction in degrees
  attributes?: Record<string, any>; // Flexible attributes (battery, accuracy, etc.)
  synced?: boolean; // Indicates if sent to Traccar (if storing locally first)
  empresa_codigo: string; // Link to Empresa for data partitioning/rules
}

export interface Entrega {
  id: string; // Firestore document ID
  name?: string; // Optional delivery name/identifier
  customer: string;
  address: string;
  status: 'pendente' | 'em_andamento' | 'entregue' | 'cancelada' | 'falha'; // Example statuses
  driver_id?: string; // Entregador ID (Firebase Auth UID) assigned
  empresa_codigo: string; // Link to Empresa
  tracking_code?: string;
  phone?: string; // Customer phone
  lat?: number; // Destination latitude
  lon?: number; // Destination longitude
  created_at?: FirebaseTimestamp;
  updated_at?: FirebaseTimestamp;
  scheduled_time?: FirebaseTimestamp;
  completion_time?: FirebaseTimestamp;
  notes?: string;
}
