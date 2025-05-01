/**
 * @deprecated Supabase data models are being migrated to Firebase Firestore. Use Firebase services instead.
 */

/**
 * Represents a company (Supabase model).
 * @deprecated Migrating to Firebase Empresa model.
 */
export interface Company {
  /**
   * The ID of the company.
   */
  id: string;
  /**
   * The code of the company.
   */
  codigo: string;
  /**
   * The name of the company.
   */
  nome: string;
}

/**
 * Represents a delivery (Supabase model).
 * @deprecated Migrating to Firebase Entrega model.
 */
export interface Delivery {
  /**
   * The ID of the delivery.
   */
  id: string;
  /**
   * The name of the delivery.
   */
  name: string;
  /**
   * The customer for the delivery.
   */
  customer: string;
}

/**
 * Asynchronously retrieves companies from Supabase.
 * @deprecated Migrating to Firebase. Do not use for new implementations.
 * @returns A promise that resolves to an array of Company objects.
 */
export async function getCompanies(): Promise<Company[]> {
  console.warn("getCompanies is deprecated. Migrating from Supabase to Firebase.");
  // TODO: Implement logic to fetch from Supabase ONLY IF needed during transition.
  // Ideally, new features should use Firebase directly.

  return [
    {
      id: '1',
      codigo: '123',
      nome: 'Company A (Deprecated)',
    },
    {
      id: '2',
      codigo: '456',
      nome: 'Company B (Deprecated)',
    },
  ];
}

/**
 * Asynchronously retrieves deliveries from Supabase.
 * @deprecated Migrating to Firebase. Do not use for new implementations.
 * @returns A promise that resolves to an array of Delivery objects.
 */
export async function getDeliveries(): Promise<Delivery[]> {
   console.warn("getDeliveries is deprecated. Migrating from Supabase to Firebase.");
   // TODO: Implement logic to fetch from Supabase ONLY IF needed during transition.

  return [
    {
      id: '1',
      name: 'Delivery 1 (Deprecated)',
      customer: 'Customer A',
    },
    {
      id: '2',
      name: 'Delivery 2 (Deprecated)',
      customer: 'Customer B',
    },
  ];
}
