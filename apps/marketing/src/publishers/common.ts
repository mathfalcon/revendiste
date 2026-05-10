import {z} from 'zod';

export const publishModeSchema = z.enum(['draft', 'launch']);
export type PublishMode = z.infer<typeof publishModeSchema>;

export const defaultUruguayTargeting = {
  geoLocations: {countries: ['UY']},
  ageMin: 18,
  ageMax: 45,
} as const;

export type DraftInput = {
  renderId: string;
  /** Local file path to video or image */
  filePath: string;
  kind: 'video' | 'image' | 'carousel';
  name: string;
};

export type CampaignInput = DraftInput & {
  dailyBudgetUsd: number;
  confirm: true;
};
