import { Config } from '../config';
export type url = string;
export type body = string;
export type selector = string;
export type CronStartUri = Config['cronStartUri'];

export interface WebConfig {
  cronStartUri: string;
}

export enum ElementSelector {
  NOM = '.titre-principal',         // "Nom de la rando"
  LIEU = '.row:nth-child(3) .vtt',        // "Lieu"
  DPT = '.row:nth-child(2) .vtt',           // "Département"
  DATE = '.row:nth-child(1) .vtt',          // "Date"
  ORGANISATEUR = '.row:nth-child(5) .vtt',  // "Organisateur"
  HORAIRES = '.row:nth-child(7) .vtt',      // "Horaires"
  LIEN = '.row:nth-child(8) .vtt a',        // "Site"
  RDV = '.row:nth-child(6) .vtt',           // "Lieu de R-d-V"
  PRIX = '.row:nth-child(10) .form-control',    // "Prix public"
  CONTACT = '.row:nth-child(14) .form-control', // "Contact"
  DESCRIPTION = '.row:nth-child(16) .form-control', // "Description"
  ANNULE = '#zone_texte_annule',
}
