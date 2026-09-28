export type User = { id: number; nom: string; courriel: string; role: 'spectateur' | 'gestionnaire' };

export type Session = {
  id: number;
  date_heure: string;
  statut: string;
  salle: string;
  titre: string;
  genre: string;
  duree_minutes: number;
  image_url: string;
  description: string;
  capacite: number;
  places_disponibles: number;
};

export type Seat = {
  id: number;
  rangee: string;
  numero: number;
  type: string;
  etat: 'libre' | 'retenue' | 'vendue';
  retenue_active?: boolean;
};

export type Reservation = {
  id: number;
  code_billet: string;
  montant_total: number;
  creee_le: string;
  statut: string;
  date_heure: string;
  titre: string;
  image_url: string;
  places: Array<{ rangee: string; numero: number }>;
};