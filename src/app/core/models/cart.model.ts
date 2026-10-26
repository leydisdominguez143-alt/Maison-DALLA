import { BodyMeasurements } from './measurements.model';
export interface CartItem {
  lineId: string;
  productId: number;
  name: string;
  unitPrice: number;
  quantity: number;
  color: string;
  size: string;
  madeToMeasure: boolean;
  measurements?: BodyMeasurements;
}
export interface Promotion { code: string; discountPercent: number; }
