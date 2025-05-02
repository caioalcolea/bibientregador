import type { Timestamp } from "firebase/firestore";

/** Alias usado em vários modelos */
export type FirebaseTimestamp = Timestamp;

/* ------------------------------------------------------------------ */
/* Empresa                                                            */
/* ------------------------------------------------------------------ */
export interface Empresa {
  id: string;                           // Firestore document ID ou Supabase ID
  codigo: string;                       // Código único da empresa
  nome: string;
  config?: Record<string, unknown>;     // Equivalente a Map<String, dynamic>
  created_at?: FirebaseTimestamp | string;
  api_key?: string;
  admin_login?: string;
  admin_senha?: string;                 // Idealmente armazenar hash
  /** Lista de entregadores ou logins registrados via script */
  entregadores?: Array<{
    login: string;
    senha?: string;
    uniqueId: string;
    nome?: string;
  }>;
}

/* ------------------------------------------------------------------ */
/* Entregador                                                         */
/* ------------------------------------------------------------------ */
export interface Entregador {
  id?: string;                          // Firestore / Supabase ID
  empresa_codigo: string;
  login: string;                        // Username ou e‑mail
  senha?: string;                       // Não armazenar texto puro!
  nome: string;
  uniqueId: string;                     // uniqueId do Traccar
  status?: "online" | "offline" | "inativo";
  fcmToken?: string;
  last_seen?: FirebaseTimestamp | string;
}

/* ------------------------------------------------------------------ */
/* Dispositivo (Traccar)                                              */
/* ------------------------------------------------------------------ */
export interface Dispositivo {
  id: number;
  name: string;
  uniqueId: string;
  status?: "online" | "offline" | "unknown";
  lastUpdate?: string;                  // ISO string vinda do Traccar
  phone?: string;
  model?: string;
  contact?: string;
  empresa_codigo?: string;
  attributes?: Record<string, unknown>;
  positionId?: number;
  groupId?: number;
  geofenceIds?: number[];
  disabled?: boolean;
}

/* ------------------------------------------------------------------ */
/* Posicao (ponto de localização)                                     */
/* ------------------------------------------------------------------ */
export interface Posicao {
  id?: string;                          // ID do documento Firestore
  deviceId: number | string;
  uniqueId: string;                     // Dispositivo associado
  protocol?: string;
  serverTime?: FirebaseTimestamp;
  deviceTime: FirebaseTimestamp;
  fixTime: FirebaseTimestamp;
  latitude: number;
  longitude: number;
  altitude?: number;                    // Em metros
  speed?: number;                       // Nós (padrão Traccar)
  course?: number;                      // Graus
  accuracy?: number;                    // Em metros
  attributes?: Record<string, unknown>;
  syncedToTraccar?: boolean;
  empresa_codigo: string;
}

/* ------------------------------------------------------------------ */
/* Entrega                                                            */
/* ------------------------------------------------------------------ */
export interface Entrega {
  id?: string;
  name?: string;
  customer: string;
  address: string;
  numero?: string;
  complemento?: string;
  cep?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  status: "pending" | "in_progress" | "completed" | "canceled" | "failed";
  driver_id?: string;                   // uniqueId do Entregador
  empresa_codigo: string;
  tracking_code?: string;
  phone?: string;
  lat?: number;
  lon?: number;
  created_at?: FirebaseTimestamp | string;
  updated_at?: FirebaseTimestamp | string;
  scheduled_time?: FirebaseTimestamp | string;
  completion_time?: FirebaseTimestamp | string;
  notes?: string;
  observacoes?: string;
  motivo_falha?: string;
  tipo_frete?: "padrao" | "expresso" | "economico";

  /* Campos adicionados para rastreamento em tempo real */
  posicao_atual_lat?: number;
  posicao_atual_lon?: number;
  distancia_destino?: number;

  /* Novos campos derivados da Posicao */
  speed?: number;                       // km/h (convertido se desejar)
  course?: string;                      // direção em texto/° convertida
  altitude?: number;                    // metros
  timestamp?: FirebaseTimestamp;        // timestamp da posição

  /* Flags de notificação */
  notificado?: boolean;
  proximo_destino_notificado?: boolean;
  entrega_concluida_notificada?: boolean;
}

/* ------------------------------------------------------------------ */
/* Usuário autenticado (app motorista)                                */
/* ------------------------------------------------------------------ */
export interface AuthUser {
  empresaCodigo: string;
  loginIdentifier: string;
  uniqueId: string;
  nome?: string;
  type: "entregador";
}

