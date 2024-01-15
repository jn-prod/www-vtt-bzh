import { Config } from '../config';
export type url = string;
export type body = string;
export type selector = string;
export type CronStartUri = Config['cronStartUri'];

export interface WebConfig {
  cronStartUri: string;
}

export enum ElementSelector {
  NOM = '#txt_ref_int_nom_2',
  LIEU = '#txt_ref_int_lieu_2',
  DPT = '#txt_ref_int_dpt_2',
  DATE = '#txt_ref_int_date_2',
  ORGANISATEUR = '#txt_ref_int_organisateur_2',
  HORAIRES = '#txt_ref_int_horaires_2',
  LIEN = '#StyleLien1',
  RDV = '#txt_ref_int_ldrdv_2',
  PRIX = '#txt_ref_int_prix2',
  CONTACT = '#txt_ref_int_contacttxt',
  DESCRIPTION = '#txt_ref_int_decription',
  ANNULE = '#zone_texte_annule',
}
