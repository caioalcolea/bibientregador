import type { Timestamp } from "firebase/firestore";

export interface FirebaseTimestamp extends Timestamp {}

export interface Empresa {
  id: string; // Firestore document ID
  codigo: string; // Unique code for the company
  nome: string;
  config?: Record<string, any>; // Using Record for Map<String, dynamic>
  created_at?: FirebaseTimestamp;
  api_key?: string; // Potentially sensitive, consider security implications
  admin_login?: string; // Potentially sensitive
  admin_senha?: string; // Potentially sensitive (Should be hashed if stored)
}

export interface Entregador {
  id?: string; // Firestore document ID (optional if using UID as ID)
  empresa_codigo: string;
  login: string; // Email used for Firebase Auth
  // 'senha' is managed by Firebase Auth, not stored here
  nome: string;
  uniqueId: string; // Traccar uniqueId for device association
  status: 'online' | 'offline' | 'inativo'; // Example statuses
  fcmToken?: string; // For push notifications via Firebase Cloud Messaging
  last_seen?: FirebaseTimestamp;
  // Add any other relevant driver information
}

export interface Dispositivo {
  id: string; // Traccar device ID
  name: string; // Typically includes company code and driver name/identifier
  uniqueId: string; // Traccar unique ID (often the IMEI or a custom ID)
  status?: 'online' | 'offline' | 'unknown'; // Traccar status
  lastUpdate?: FirebaseTimestamp; // Traccar last update time (or Firestore timestamp)
  phone?: string; // Device phone number
  model?: string; // Device model
  contact?: string; // Driver contact info (can be redundant with Entregador)
  empresa_codigo: string; // Link to Empresa
}

// Represents a position record, primarily for storing in Firestore
export interface Posicao {
  id?: string; // Firestore document ID (optional)
  deviceId: string; // Traccar device ID (corresponds to Dispositivo.id)
  uniqueId: string; // Traccar unique ID (corresponds to Dispositivo.uniqueId)
  protocol?: string; // Protocol used (e.g., osmand, gps103)
  serverTime?: FirebaseTimestamp; // Time received by server (Firebase)
  deviceTime: FirebaseTimestamp; // Time reported by device
  fixTime: FirebaseTimestamp; // Time of GPS fix
  latitude: number;
  longitude: number;
  altitude?: number; // In meters
  speed?: number; // Speed in knots (Traccar default)
  course?: number; // Direction in degrees (bearing)
  accuracy?: number; // GPS accuracy in meters
  attributes?: Record<string, any>; // Flexible attributes (e.g., battery, satellites, ignition)
  syncedToTraccar?: boolean; // Flag indicating if this specific position was sent to Traccar
  empresa_codigo: string; // Link to Empresa for data partitioning/rules
}

export interface Entrega {
  id?: string; // Firestore document ID
  name?: string; // Optional delivery name/identifier (e.g., "Pedido #123")
  customer: string; // Customer name
  address: string; // Street address
  numero?: string; // House/Building number
  complemento?: string; // Complement (e.g., Apt 101)
  cep?: string; // Postal Code
  bairro?: string; // Neighborhood
  cidade?: string; // City
  estado?: string; // State
  status: 'pending' | 'in_progress' | 'completed' | 'canceled' | 'failed'; // Delivery status
  driver_id?: string; // Entregador ID (Firebase Auth UID) assigned
  empresa_codigo: string; // Link to Empresa
  tracking_code?: string; // Unique tracking code for the delivery
  phone?: string; // Customer phone number
  lat?: number; // Destination latitude
  lon?: number; // Destination longitude
  created_at?: FirebaseTimestamp; // When the delivery was created
  updated_at?: FirebaseTimestamp; // Last status update time
  scheduled_time?: FirebaseTimestamp; // Optional scheduled delivery time
  completion_time?: FirebaseTimestamp; // Time the delivery was completed/failed
  notes?: string; // General notes about the delivery
  observacoes?: string; // Specific observations entered by driver on completion/failure
  motivo_falha?: string; // Reason if status is 'failed' or 'canceled'
  tipo_frete?: 'padrao' | 'expresso' | 'economico'; // Type of freight/delivery
  // Fields potentially derived or added by the system/driver app:
  signature_required?: boolean;
  signature_base64?: string; // Signature image data
  posicao_atual_lat?: number; // Driver's current lat (can be redundant, from Posicao)
  posicao_atual_lon?: number; // Driver's current lon (can be redundant, from Posicao)
  distancia_destino?: number; // Calculated distance to destination (in meters)
  // Notification flags
  notificado?: boolean; // General notification flag
  proximo_destino_notificado?: boolean; // Flag for proximity notification
  entrega_concluida_notificada?: boolean; // Flag for completion notification
}

// Represents the combined data for an authenticated user
export interface AuthUser {
  uid: string; // Firebase Auth User ID
  email: string | null; // User's email from Firebase Auth
  displayName: string | null; // User's display name (can be from Auth or Firestore)
  empresaCodigo: string; // Company code from Firestore 'entregadores'
  uniqueId: string; // Traccar uniqueId from Firestore 'entregadores'
  entregadorId: string; // Firestore document ID for the 'entregadores' record
  nome: string; // Driver's full name from Firestore 'entregadores'
}
