import { Injectable, computed, signal } from '@angular/core';
import { BodyMeasurements, BodyType, MannequinConfiguration } from '../models/measurements.model';

@Injectable({ providedIn: 'root' })
export class MannequinService {
  private readonly _bodyType = signal<BodyType>('female');
  private readonly _measurements = signal<BodyMeasurements>({ bust: 92, waist: 72, hips: 96, height: 168 });
  private readonly _garmentColor = signal('#101b32');
  readonly bodyType = this._bodyType.asReadonly();
  readonly measurements = this._measurements.asReadonly();
  readonly garmentColor = this._garmentColor.asReadonly();

  readonly estimatedSize = computed(() => {
    const m = this._measurements();
    if (m.bust <= 0 || m.waist <= 0 || m.hips <= 0 || m.height <= 0) return 'Sin determinar';
    if (m.bust <= 82 && m.waist <= 66 && m.hips <= 90) return 'XS';
    if (m.bust <= 88 && m.waist <= 72 && m.hips <= 96) return 'S';
    if (m.bust <= 96 && m.waist <= 80 && m.hips <= 104) return 'M';
    if (m.bust <= 104 && m.waist <= 88 && m.hips <= 112) return 'L';
    if (m.bust <= 112 && m.waist <= 96 && m.hips <= 120) return 'XL';
    return 'XXL / a medida';
  });

  readonly configuration = computed<MannequinConfiguration>(() => ({
    bodyType: this._bodyType(),
    measurements: this._measurements(),
    estimatedSize: this.estimatedSize(),
    garmentColor: this._garmentColor()
  }));

  setBodyType(type: BodyType): void { this._bodyType.set(type); }
  updateMeasurement(key: keyof BodyMeasurements, value: number): void {
    if (Number.isFinite(value) && value > 0) this._measurements.update(m => ({ ...m, [key]: value }));
  }
  setGarmentColor(color: string): void { this._garmentColor.set(color); }
  reset(): void {
    this._bodyType.set('female');
    this._measurements.set({ bust: 92, waist: 72, hips: 96, height: 168 });
    this._garmentColor.set('#101b32');
  }
}
