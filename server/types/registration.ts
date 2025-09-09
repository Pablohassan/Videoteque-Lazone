// ========================================================================
// TYPES SPÉCIFIQUES AUX INSCRIPTIONS
//
// Ce fichier contient tous les types spécifiques aux fonctionnalités
// d'inscription et de gestion des demandes d'inscription.
// ========================================================================

// Types pour les demandes d'inscription
export interface CreateRegistrationRequest {
  email: string;
  name: string;
}

export interface RegistrationFilters {
  status?: "PENDING" | "APPROVED" | "REJECTED";
  page?: number;
  limit?: number;
}

export interface ProcessRegistrationRequest {
  registrationId: number;
  action: "APPROVE" | "REJECT";
  adminNotes?: string;
}

// Note: Ces types étaient auparavant définis dans registrationService.ts
// Ils ont été déplacés ici pour respecter l'architecture modulaire.
