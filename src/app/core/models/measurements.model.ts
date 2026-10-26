export type BodyType = 'female' | 'male';
export interface BodyMeasurements { bust: number; waist: number; hips: number; height: number; }
export interface MannequinConfiguration {
  bodyType: BodyType;
  measurements: BodyMeasurements;
  estimatedSize: string;
  garmentColor: string;
}
