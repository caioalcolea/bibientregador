import type { Timestamp } from "firebase/firestore";

export interface FirebaseTimestamp extends Timestamp {}

export interface Empresa {
  id: string; // Firestore document ID or Supabase ID
  codigo: string; // Unique code for the company
  nome: string;
  config?: Record<string, any>; // Using Record for Map<String, dynamic>
  created_at?: FirebaseTimestamp | string; // Allow string for Supabase timestamps
  api_key?: string;
  admin_login?: string;
  admin_senha?: string; // Should be hashed if stored and verified securely
  // Added from script logic analysis - potentially holds driver credentials if used
  entregadores?: string | Array<{ login: string; senha?: string; uniqueId: string; nome?: string }>; // Can be JSON string or array
}

export interface Entregador {
  id?: string; // Firestore/Supabase document ID
  empresa_codigo: string;
  login: string; // Login identifier (username or email)
  senha?: string; // Password (SHOULD NOT be stored/retrieved insecurely)
  nome: string;
  uniqueId: string; // Traccar uniqueId for device association
  status?: 'online' | 'offline' | 'inativo'; // Example statuses
  fcmToken?: string;
  last_seen?: FirebaseTimestamp | string;
  // Potentially Firebase Auth UID if hybrid approach was used, but removing based on request
  // auth_uid?: string;
}

export interface Dispositivo {
  id: number; // Traccar device ID is usually a number
  name: string;
  uniqueId: string;
  status?: 'online' | 'offline' | 'unknown';
  lastUpdate?: string; // Traccar timestamps are usually ISO strings
  phone?: string;
  model?: string;
  contact?: string;
  empresa_codigo?: string; // Added for linking, might not exist directly in Traccar API response
  // Other Traccar fields might be present
  attributes?: Record<string, any>;
  positionId?: number;
  groupId?: number;
  geofenceIds?: number[];
  disabled?: boolean;
  // Add other fields from Traccar API as needed
}


// Represents a position record, primarily for storing in Firestore
export interface Posicao {
  id?: string; // Firestore document ID (optional)
  deviceId: number | string; // Traccar device ID (can be number or string depending on source)
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
  driver_id?: string; // Entregador uniqueId (Traccar) or login identifier
  empresa_codigo: string; // Link to Empresa
  tracking_code?: string; // Unique tracking code for the delivery
  phone?: string; // Customer phone number
  lat?: number; // Destination latitude
  lon?: number; // Destination longitude
  created_at?: FirebaseTimestamp | string; // When the delivery was created
  updated_at?: FirebaseTimestamp | string; // Last status update time
  scheduled_time?: FirebaseTimestamp | string; // Optional scheduled delivery time
  completion_time?: FirebaseTimestamp | string; // Time the delivery was completed/failed
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

// Represents the authenticated user based on the custom logic
export interface AuthUser {
  empresaCodigo: string; // Company code used for login
  loginIdentifier: string; // The username/email used to log in
  uniqueId: string; // Traccar uniqueId associated with the driver
  nome?: string; // Driver's name (if available from Supabase/Traccar)
  type: 'entregador'; // Since we only support entregador now
  // Removed Firebase specific fields: uid, email, displayName, entregadorId
}
