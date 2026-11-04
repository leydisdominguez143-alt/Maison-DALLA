import { AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone, OnDestroy, Output, PLATFORM_ID, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { MannequinService } from '../../core/services/mannequin.service';
import { BodyMeasurements, BodyType } from '../../core/models/measurements.model';
import { I18nService } from '../../core/services/i18n.service';

type Pts = [number, number][];
type Kind = 'vestido' | 'top' | 'pantalon' | 'abrigo';
interface Garment { tex: THREE.CanvasTexture; aspect: number; profile: number[]; }
type Variant = 'noche' | 'xv' | 'tipico' | 'camisa' | 'blusa' | 'otro';
/** Estado de la prenda "armada" por código (sin foto). */
interface WearState { on: boolean; variant: Variant; color: string; size: string; }
interface GMats { vc: THREE.MeshPhysicalMaterial; plain: THREE.MeshPhysicalMaterial; }
interface GRow { y: number; a: number; bf: number; bb: number; f: number; sk: boolean; }
interface Ctx {
  m: BodyMeasurements; male: boolean; u: number; H: number;
  Y: (f: number) => number; semi: (c: number, r: number) => number;
  bust: number; waist: number; hips: number;
  A: (f: number) => number; R: (f: number) => number; Bi: (f: number) => number;
  solid: (p: Pts, seg?: number) => THREE.BufferGeometry;
  mesh: (g: THREE.BufferGeometry, m: THREE.Material) => THREE.Mesh;
}

/** Dónde empieza y termina cada prenda (fracción de la estatura: 0 pies, 1 cabeza). */
const KINDS: { id: Kind; label: string; top: number; bot: number; ref: 'mix' | 'bust' | 'hips' }[] = [
  { id: 'vestido',  label: 'Vestido',         top: 0.80,  bot: 0.03, ref: 'mix' },
  { id: 'top',      label: 'Parte de arriba', top: 0.835, bot: 0.50, ref: 'bust' },
  { id: 'pantalon', label: 'Pantalón',        top: 0.57,  bot: 0.02, ref: 'hips' },
  { id: 'abrigo',   label: 'Abrigo',          top: 0.84,  bot: 0.24, ref: 'bust' }
];

/** Medidas máximas (cm) de cada talla: busto, cintura y cadera. Coinciden con la talla estimada del servicio. */
const SIZE_TABLE: Record<string, [number, number, number]> = {
  XS: [82, 66, 90], S: [88, 72, 96], M: [96, 80, 104], L: [104, 88, 112], XL: [112, 96, 120], 'XXL / a medida': [124, 108, 132]
};
/** Holgura (cm de contorno) que cada prenda agrega sobre la medida de su talla. */
const EASE_CM: Record<Kind, number> = { vestido: 6, top: 8, pantalon: 5, abrigo: 14 };
/** Falda de cada vestido: dónde termina, qué tan redonda es, cuánto cae en pliegues y cómo se abre ([altura, ancho/cadera]). */
const SKIRTS: Record<string, { bot: number; ratio: number; fold: number; k: number; keys: Pts }> = {
  noche:  { bot: 0.03, ratio: 0.82, fold: 0.016, k: 12, keys: [[0.03, 1.38], [0.12, 1.1], [0.28, 0.94], [0.4, 1.0], [0.52, 1.0]] },
  xv:     { bot: 0.03, ratio: 0.95, fold: 0.045, k: 16, keys: [[0.03, 3.0], [0.15, 2.55], [0.3, 2.0], [0.42, 1.4], [0.52, 1.0]] },
  tipico: { bot: 0.2,  ratio: 0.93, fold: 0.04,  k: 14, keys: [[0.2, 2.4], [0.3, 2.1], [0.42, 1.45], [0.52, 1.0]] }
};
const mix = (a: number, b: number, t: number) => a + (b - a) * Math.min(1, Math.max(0, t));
const foldPhase = (t: number, f: number) => 0.6 * Math.sin(11 * t + 7 * f) + 0.4 * Math.sin(19 * t - 11 * f + 1.3);

/** Trama de tejido fina generada por código: da textura a la tela sin cargar imágenes. */
let weave: THREE.CanvasTexture | undefined;
const fabricBump = (): THREE.CanvasTexture | undefined => {
  if (typeof document === 'undefined') return undefined;
  if (!weave) {
    const n = 64, cv = document.createElement('canvas');
    cv.width = cv.height = n;
    const ctx = cv.getContext('2d');
    if (!ctx) return undefined;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const v = (((x >> 2) + (y >> 2)) & 1 ? 150 : 108) + Math.floor(Math.random() * 24 - 12);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(x, y, 1, 1);
    }
    weave = new THREE.CanvasTexture(cv);
    weave.wrapS = weave.wrapT = THREE.RepeatWrapping;
    weave.repeat.set(24, 18);
  }
  return weave;
};

/** Interpolación suave (Hermite) de una curva definida por puntos [x, valor]. */
const interp = (ks: Pts) => (f: number): number => {
  let i = 0;
  while (i < ks.length - 2 && f > ks[i + 1][0]) i++;
  const p0 = ks[Math.max(i - 1, 0)], p1 = ks[i], p2 = ks[i + 1], p3 = ks[Math.min(i + 2, ks.length - 1)];
  const h = p2[0] - p1[0], t = Math.min(1, Math.max(0, (f - p1[0]) / h));
  const m1 = ((p2[1] - p0[1]) / (p2[0] - p0[0])) * h, m2 = ((p3[1] - p1[1]) / (p3[0] - p1[0])) * h;
  const t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * p1[1] + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * p2[1] + (t3 - t2) * m2;
};

/**
 * Probador 3D: maniquí que gira, cambia con las medidas y el tipo de anatomía,
 * y sobre el que se pone la foto de una prenda. Uso: <app-mannequin-fitting />
 */
@Component({
  standalone: true,
  selector: 'app-mannequin-fitting',
  template: `
    <canvas #canvas role="img" [attr.aria-label]="t('fitting.canvas')"></canvas>
    <div class="bar">
      @if (status() === 'loading') {
        <span class="tip">{{ t('fitting.loading') }}</span>
      } @else if (status() === 'error') {
        <span class="tip">{{ t('fitting.error') }}</span>
      } @else if (garment() || wearing()) {
        <div class="chips" role="group" [attr.aria-label]="t('fitting.kind.label')">
          @for (k of kinds; track k.id) {
            <button type="button" [class.on]="kind()===k.id" (click)="setKind(k.id)">{{ t('fitting.kind.' + k.id) }}</button>
          }
        </div>
        @if (garment()) {
          <label class="range">{{ t('fitting.size') }} <input type="range" min="50" max="150" [value]="scale()" (input)="scale.set(+$any($event.target).value)"></label>
          <label class="range">{{ t('fitting.height') }} <input type="range" min="-20" max="20" [value]="dy()" (input)="dy.set(+$any($event.target).value)"></label>
        }
        <button type="button" class="ghost" (click)="clear()">{{ t('fitting.remove') }}</button>
      } @else {
        <span class="tip">{{ t('fitting.choose') }}</span>
      }
      <button type="button" class="ghost" [attr.aria-pressed]="auto()" (click)="toggleAuto()">{{ t(auto() ? 'fitting.stop' : 'fitting.rotate') }}</button>
    </div>
    <span class="hint">{{ t('fitting.drag') }}</span>
  `,
  styles: [`
    :host{display:block;position:relative;width:100%;height:100%;z-index:1}
    canvas{width:100%;height:100%;display:block;cursor:grab}
    canvas:active{cursor:grabbing}
    .bar{position:absolute;left:50%;bottom:44px;transform:translateX(-50%);display:flex;flex-wrap:wrap;gap:10px 14px;align-items:center;justify-content:center;
      width:max-content;max-width:calc(100% - 24px);padding:10px 14px;border:1px solid rgba(218,177,94,.3);border-radius:18px;
      background:rgba(5,8,13,.8);backdrop-filter:blur(10px);font-size:13px;color:#e8e0d4}
    .btn,.chips button,.ghost{font:inherit;font-size:13px;padding:8px 14px;border-radius:20px;border:1px solid #c99b35;background:transparent;color:#efc66d;cursor:pointer;transition:background .4s,color .4s}
    .btn{background:#d9b86a;color:#080b10;font-weight:600}
    .btn:hover{background:transparent;color:#efc66d}
    .chips{display:flex;gap:6px;flex-wrap:wrap}
    .chips button{border-color:rgba(218,177,94,.3);color:#cfc8bb}
    .chips button.on{border-color:#c99b35;color:#efc66d;background:rgba(212,175,55,.1)}
    .ghost{border-color:rgba(234,213,174,.4);color:#e8e0d4}
    .range,.check{display:flex;align-items:center;gap:8px}
    .range input{width:100px;accent-color:#d9b86a}
    .tip{color:#bdb5a9;max-width:280px;line-height:1.4}
    .hint{position:absolute;left:0;right:0;bottom:12px;text-align:center;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#bdb5a9;pointer-events:none}
    button:focus-visible,.btn:focus-within,input:focus-visible{outline:2px solid #d9b86a;outline-offset:3px}
  `]
})
export class MannequinFittingComponent implements AfterViewInit, OnDestroy {
  private readonly tr = inject(I18nService);
  t = (key: string) => this.tr.t(key);
  @ViewChild('canvas', { static: true }) private canvasRef!: ElementRef<HTMLCanvasElement>;
  private readonly svc = inject(MannequinService);
  private readonly zone = inject(NgZone);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly kinds = KINDS;
  readonly garment = signal<Garment | null>(null);
  readonly kind = signal<Kind>('vestido');
  readonly scale = signal(100);
  readonly dy = signal(0);            // desplazamiento vertical de la prenda (cm)
  readonly auto = signal(true);
  readonly status = signal<'idle' | 'loading' | 'error'>('idle');
  readonly wearing = signal(false);                 // hay una prenda puesta (armada por código)
  private readonly wVariant = signal<Variant>('otro');
  private readonly wColor = signal('#101b32');
  private readonly wSize = signal('M');
  private readonly wearState = computed<WearState>(() => ({ on: this.wearing(), variant: this.wVariant(), color: this.wColor(), size: this.wSize() }));
  private garmentMats: THREE.Material[] = [];
  private loadId = 0;

  /** Estilo del vestido: noche, xv, tipico (pollera) o, para tops, camisa o blusa. */
  @Input() set variant(v: Variant | null) { this.wVariant.set(v ?? 'otro'); }
  /** Color de la prenda (hex). */
  @Input() set color(c: string | null) { if (c) this.wColor.set(c); }
  /** Talla de la prenda (XS, S, M, L, XL): decide qué tan ajustada o holgada queda. */
  @Input() set size(s: string | null) { if (s) this.wSize.set(s); }
  /** URL de una foto de la prenda YA RECORTADA (PNG sin fondo). Con fotos de modelos no se usa. */
  @Input() set src(url: string | null) { this.load(url); }
  /** Tipo de prenda: decide en qué parte del cuerpo se coloca. */
  @Input() set type(k: Kind | null) {
    if (k) { this.kind.set(k); this.dy.set(0); this.wearing.set(true); } else { this.wearing.set(false); }
  }
  /** Se emite cuando el usuario pulsa "Quitar prenda". */
  @Output() cleared = new EventEmitter<void>();

  private renderer?: THREE.WebGLRenderer;
  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private controls?: OrbitControls;
  private figure?: THREE.Group;
  private shellMat?: THREE.Material;
  private raf = 0;
  private visible = true;
  private ro?: ResizeObserver;
  private io?: IntersectionObserver;

  private readonly skin = new THREE.MeshPhysicalMaterial({ color: '#e6ddd0', roughness: 0.5, clearcoat: 0.2, clearcoatRoughness: 0.5 });
  private readonly hair = new THREE.MeshStandardMaterial({ color: '#17110d', roughness: 0.4 });

  constructor() {
    effect(() => this.build(this.svc.measurements(), this.svc.bodyType(), this.garment(), this.kind(), this.scale(), this.dy(), this.wearState()));
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    this.zone.runOutsideAngular(() => this.init());
  }

  // ---------------------------------------------------------------- escena
  private init(): void {
    const canvas = this.canvasRef.nativeElement;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch { return; }
    this.renderer = renderer;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    this.scene = scene;
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    (scene as any).environmentIntensity = 0.4;
    pmrem.dispose();

    const key = new THREE.SpotLight(0xfff1dc, 170, 0, 0.5, 0.8, 2);
    key.position.set(1.5, 3, 2.4);
    key.target.position.set(0, 1, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.bias = -0.0004;
    scene.add(key, key.target);
    const rim = new THREE.DirectionalLight(0xd9b86a, 1.8);
    rim.position.set(-2, 2.2, -2);
    scene.add(rim, new THREE.HemisphereLight(0x9fb4d6, 0x05080d, 0.35));

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.ShadowMaterial({ opacity: 0.45 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(0.62, 0.64, 0.06, 96),
      new THREE.MeshPhysicalMaterial({ color: '#06080c', roughness: 0.22, metalness: 0.7, clearcoat: 1 })
    );
    plinth.position.y = 0.03;
    plinth.castShadow = plinth.receiveShadow = true;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.62, 0.006, 16, 128),
      new THREE.MeshStandardMaterial({ color: '#d9b86a', emissive: '#b88a2e', emissiveIntensity: 1.4, metalness: 0.6, roughness: 0.35 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.058;
    scene.add(floor, plinth, ring);

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
    camera.position.set(0, 1.25, 4);
    this.camera = camera;
    const controls = new OrbitControls(camera, canvas);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = true;
    controls.minPolarAngle = Math.PI * 0.35;
    controls.maxPolarAngle = Math.PI * 0.55;
    controls.autoRotate = this.auto() && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    controls.autoRotateSpeed = 1.4;
    controls.addEventListener('start', () => {            // al tomar el control manual se detiene el giro
      controls.autoRotate = false;
      this.zone.run(() => this.auto.set(false));
    });
    canvas.style.touchAction = 'pan-y';
    this.controls = controls;

    const host = canvas.parentElement as HTMLElement;
    const resize = () => {
      const w = host.clientWidth, h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = camera.aspect < 0.8 ? 42 : 32;
      camera.updateProjectionMatrix();
    };
    this.ro = new ResizeObserver(resize);
    this.ro.observe(host);
    this.io = new IntersectionObserver(([e]) => (this.visible = e.isIntersecting));
    this.io.observe(host);
    resize();

    this.build(this.svc.measurements(), this.svc.bodyType(), this.garment(), this.kind(), this.scale(), this.dy(), this.wearState());

    const tick = () => {
      this.raf = requestAnimationFrame(tick);
      if (!this.visible) return;
      controls.update();
      renderer.render(scene, camera);
    };
    tick();
  }

  // ---------------------------------------------------------------- figura
  private build(m: BodyMeasurements, type: BodyType, g: Garment | null, kind: Kind, scale: number, dy: number, w: WearState): void {
    const scene = this.scene;
    if (!scene || !this.camera || !this.controls) return;
    this.garmentMats.forEach(x => x.dispose());
    this.garmentMats = [];
    if (this.figure) {
      scene.remove(this.figure);
      this.figure.traverse(o => (o as THREE.Mesh).geometry?.dispose());
    }
    this.shellMat?.dispose();

    const male = (type as string) === 'male';
    const H = m.height / 100, u = H / 1.68, BASE = 0.06;
    const Y = (f: number) => BASE + f * H;                       // f: 0 pies, 1 cabeza
    const semi = (c: number, r: number) => c / (2 * Math.PI * Math.sqrt((1 + r * r) / 2)) / 100;
    const bust = semi(m.bust, 0.68), waist = semi(m.waist, 0.72), hips = semi(m.hips, 0.74);
    const sh = Math.max(0.5 * (male ? 0.265 : 0.235) * H, bust * (male ? 1.12 : 1.08));
    const nk = male ? 0.06 : 0.05;
    const thick = male ? 1.15 : 1;

    // Perfiles del torso: semi-ancho, relación profundidad/ancho y desplazamiento frente/espalda
    const A = interp([
      [0.47, hips * 0.62], [0.49, hips * 0.95], [0.52, hips], [0.572, (hips + waist) / 2 + 0.004], [0.62, waist],
      [0.685, bust * 0.93], [0.725, bust], [0.77, (bust + sh) / 2 + 0.01], [0.812, sh], [0.832, sh * 0.62],
      [0.846, nk * 1.8], [0.862, nk * 1.1], [0.885, nk]
    ]);
    const R = interp([
      [0.47, 0.75], [0.52, 0.74], [0.62, 0.72], [0.685, 0.7], [0.725, male ? 0.62 : 0.66], [0.77, 0.5],
      [0.812, 0.36], [0.832, 0.4], [0.846, 0.75], [0.862, 0.9], [0.885, 0.9]
    ]);
    const Bi = interp([
      [0.47, male ? -0.04 : -0.1], [0.52, male ? -0.04 : -0.1], [0.572, -0.03], [0.62, 0], [0.685, male ? 0.02 : 0.06],
      [0.725, male ? 0.05 : 0.15], [0.77, 0.02], [0.812, -0.05], [0.846, 0], [0.885, 0]
    ]);

    type Row = { y: number; a: number; bf: number; bb: number };
    const loft = (rows: Row[], seg = 56, uv?: (x: number, y: number) => [number, number]) => {
      const pos: number[] = [], uvs: number[] = [], idx: number[] = [];
      for (const r of rows) {
        for (let j = 0; j <= seg; j++) {
          const t = (j / seg) * Math.PI * 2, s = Math.sin(t), x = r.a * Math.cos(t);
          pos.push(x, r.y, s >= 0 ? r.bf * s : r.bb * s);
          if (uv) uvs.push(...uv(x, r.y));
        }
      }
      for (let i = 0; i < rows.length - 1; i++) {
        for (let j = 0; j < seg; j++) {
          const a = i * (seg + 1) + j, b = a + seg + 1;
          idx.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      if (uv) geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      this.fixSeam(geo, rows.length, seg);
      return geo;
    };
    const curve = (p: Pts) => new THREE.SplineCurve(p.map(([r, y]) => new THREE.Vector2(r, y))).getPoints(p.length * 14);
    const solid = (p: Pts, seg = 40) =>
      new THREE.LatheGeometry([new THREE.Vector2(0, p[0][1]), ...curve(p), new THREE.Vector2(0, p[p.length - 1][1])], seg);
    const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material) => { const o = new THREE.Mesh(geo, mat); o.castShadow = true; return o; };

    const fig = new THREE.Group();

    // Torso y cuello (secciones elípticas con frente y espalda distintos)
    const rows: Row[] = [];
    for (let i = 0; i <= 70; i++) {
      const f = 0.47 + (0.885 - 0.47) * (i / 70), a = A(f), b = a * R(f), bi = Bi(f);
      rows.push({ y: Y(f), a, bf: b * (1 + bi), bb: b * (1 - bi) });
    }
    fig.add(mesh(loft(rows), this.skin));

    // Cabeza abstracta: mujer con moño, hombre con pelo corto y mandíbula más marcada
    const headPts: Pts = male
      ? [[0.026, -0.104], [0.052, -0.092], [0.07, -0.064], [0.078, -0.025], [0.079, 0.012], [0.074, 0.05], [0.063, 0.082], [0.041, 0.102]]
      : [[0.022, -0.104], [0.045, -0.09], [0.063, -0.062], [0.073, -0.025], [0.075, 0.012], [0.072, 0.05], [0.062, 0.082], [0.04, 0.102]];
    const head = mesh(solid(headPts.map(([r, y]) => [r * u, y * u] as [number, number]), 48), this.skin);
    head.scale.z = 1.18;
    head.position.y = Y(0.935);
    const cap = mesh(new THREE.SphereGeometry(1, 40, 28), this.hair);
    cap.scale.set(0.082 * u, (male ? 0.075 : 0.088) * u, 0.1 * u);
    cap.position.set(0, Y(0.935) + (male ? 0.03 : 0.024) * u, -0.012 * u);
    fig.add(head, cap);
    if (!male) {
      const bun = mesh(new THREE.SphereGeometry(0.038 * u, 28, 20), this.hair);
      bun.position.set(0, Y(0.935) + 0.01 * u, -0.1 * u);
      fig.add(bun);
    }

    // Brazos (más separados si la cadera es ancha)
    const L = 0.44 * H;
    const dressed = !g && w.on;
    const nomS = SIZE_TABLE[w.size] ?? SIZE_TABLE['M'];
    const sleeveCover = !dressed ? 0 : kind === 'top' ? (w.variant === 'camisa' ? 0.3 : 0.2) : kind === 'abrigo' ? 0.93 : 0;
    const sleeveEase = Math.min(0.022, Math.max(0.008, semi(nomS[0] + EASE_CM[kind], 0.68) - bust) * 0.8) + 0.006;
    const gm = dressed ? this.garmentMaterials(w.color) : null;
    const armPts = ([
      [0, 0], [0.008, 0.02], [0.021, 0.06], [0.026, 0.13], [0.021, 0.2], [0.027, 0.3],
      [0.036, 0.45], [0.033, 0.52], [0.04, 0.62], [0.045, 0.85], [0.043, 1]
    ] as Pts).map(([r, t]) => [r * u * thick, t * L] as [number, number]);
    const arm = solid(armPts, 32);
    const swing = 0.1 + Math.max(0, hips - 0.18) * 1.2;
    for (const side of [1, -1]) {
      const pivot = new THREE.Group();
      pivot.position.set(side * sh * 0.97, Y(0.805), 0);
      pivot.rotation.z = side * swing;
      const a = mesh(arm, this.skin);
      a.position.y = -L;
      pivot.add(a, mesh(new THREE.SphereGeometry(0.05 * u * thick, 24, 18), this.skin));
      if (gm && sleeveCover > 0) {
        const s = this.sleeve(armPts, L, sleeveCover, sleeveEase, gm.plain);
        s.position.y = -L;
        pivot.add(s, mesh(new THREE.SphereGeometry(0.05 * u * thick + sleeveEase, 24, 18), gm.plain));
      }
      fig.add(pivot);
    }

    // Piernas y zapatos
    const leg = solid(([[0.03, 0.02], [0.046, 0.15], [0.042, 0.28], [0.065, 0.38], [0.085, 0.5]] as Pts)
      .map(([r, f]) => [r * u * (male ? 1.12 : 1), Y(f)] as [number, number]));
    for (const side of [1, -1]) {
      const l = mesh(leg, this.skin);
      l.position.x = side * hips * 0.5;
      const shoe = mesh(new THREE.SphereGeometry(1, 24, 16), this.hair);
      shoe.scale.set(0.045 * u * (male ? 1.1 : 1), 0.026 * u, 0.115 * u * (male ? 1.1 : 1));
      shoe.position.set(side * hips * 0.5, BASE + 0.02, 0.035);
      fig.add(l, shoe);
    }

    // Prenda armada por código: sigue la silueta del cuerpo y cambia con la talla.
    if (gm) this.addGarment(fig, { m, male, u, H, Y, semi, bust, waist, hips, A, R, Bi, solid, mesh }, kind, w, gm);

    // Prenda con foto (solo si es un PNG ya recortado): envoltura con la silueta de la foto
    if (g) {
      const k = KINDS.find(x => x.id === kind)!;
      const s = scale / 100;
      const stretch = k.ref === 'bust' ? m.bust / 92 : k.ref === 'hips' ? m.hips / 96 : (m.bust + m.hips) / 2 / 94;
      const hS = (k.top - k.bot) * H * s, wS = hS * g.aspect * stretch;
      const yTop = Y(k.top) + dy / 100, yBot = yTop - hS, N = g.profile.length;
      const shell: Row[] = [];
      for (let i = N - 1; i >= 0; i--) {                         // de abajo hacia arriba
        const y = yTop - (i / (N - 1)) * hS, f = (y - BASE) / H;
        const inTorso = f >= 0.47 && f <= 0.885;
        const a = inTorso ? A(f) : hips * 0.5 + 0.09 * u * (male ? 1.12 : 1);
        const b = inTorso ? a * R(f) : 0.085, bi = inTorso ? Bi(f) : 0;
        const r = Math.max(g.profile[i] * wS, a + 0.008);
        const ratio = f >= 0.5 ? R(Math.min(f, 0.885)) : 0.82;
        const bias = f >= 0.5 && f <= 0.885 ? Bi(f) : 0;
        shell.push({
          y, a: r,
          bf: Math.max(b * (1 + bi) + 0.008, r * ratio * (1 + bias)),
          bb: Math.max(b * (1 - bi) + 0.008, r * ratio * (1 - bias))
        });
      }
      this.shellMat = new THREE.MeshStandardMaterial({
        map: g.tex, alphaTest: 0.5, transparent: true, side: THREE.DoubleSide, roughness: 0.65,
        emissive: 0xffffff, emissiveMap: g.tex, emissiveIntensity: 0.22
      });
      fig.add(mesh(loft(shell, 64, (x, y) => [x / wS + 0.5, (y - yBot) / hS]), this.shellMat));
    }

    this.figure = fig;
    scene.add(fig);

    // Encuadre según la estatura, sin perder el ángulo de giro actual
    const dir = this.camera.position.clone().sub(this.controls.target).normalize();
    this.controls.target.set(0, BASE + H * 0.5, 0);
    this.camera.position.copy(this.controls.target).addScaledVector(dir, 2.2 + H * 1.1);
  }

  // ---------------------------------------------------------------- prendas por código
  private garmentMaterials(color: string): GMats {
    const base: THREE.MeshPhysicalMaterialParameters = {
      color, roughness: 0.82, sheen: 1, sheenRoughness: 0.5,
      sheenColor: new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.4), side: THREE.DoubleSide
    };
    const vc = new THREE.MeshPhysicalMaterial({ ...base, vertexColors: true });
    const plain = new THREE.MeshPhysicalMaterial(base);
    const bump = fabricBump();
    if (bump) { vc.bumpMap = plain.bumpMap = bump; vc.bumpScale = plain.bumpScale = 0.5; }
    this.garmentMats.push(vc, plain);
    return { vc, plain };
  }

  /** Manga: tubo abierto que copia el brazo (de 0 en la mano a L en el hombro) en el tramo cercano al hombro. */
  private sleeve(armPts: Pts, L: number, cover: number, ease: number, mat: THREE.Material): THREE.Mesh {
    const y0 = L * (1 - cover);
    const at = (y: number) => {
      for (let i = 0; i < armPts.length - 1; i++) {
        const [r1, y1] = armPts[i], [r2, y2] = armPts[i + 1];
        if (y >= y1 && y <= y2) return r1 + ((y - y1) / (y2 - y1 || 1)) * (r2 - r1);
      }
      return armPts[armPts.length - 1][0];
    };
    const pts: THREE.Vector2[] = [new THREE.Vector2(at(y0) + ease, y0)];
    for (const [r, y] of armPts) if (y > y0 + 1e-4) pts.push(new THREE.Vector2(r + ease, y));
    const curved = new THREE.SplineCurve(pts).getPoints(pts.length * 8);
    const mesh = new THREE.Mesh(new THREE.LatheGeometry(curved, 32), mat);
    mesh.castShadow = mesh.receiveShadow = true;
    return mesh;
  }

  /** Al calcular normales, la costura de la revolución queda con dos juegos de vértices: se promedian. */
  private fixSeam(geo: THREE.BufferGeometry, rows: number, seg: number): void {
    const n = geo.getAttribute('normal') as THREE.BufferAttribute;
    const v = new THREE.Vector3(), w = new THREE.Vector3();
    for (let i = 0; i < rows; i++) {
      const a = i * (seg + 1), b = a + seg;
      v.fromBufferAttribute(n, a); w.fromBufferAttribute(n, b); v.add(w).normalize();
      n.setXYZ(a, v.x, v.y, v.z); n.setXYZ(b, v.x, v.y, v.z);
    }
  }

  /**
   * Arma la prenda a partir del propio cuerpo: en cada altura toma el ancho del torso y le suma la holgura de la talla.
   * Talla justa = tela lisa y pegada; talla grande = más vuelo y pliegues.
   */
  private addGarment(fig: THREE.Group, c: Ctx, kind: Kind, w: WearState, gm: GMats): void {
    const { male, u, Y, semi, bust, waist, hips, A, R, Bi } = c;
    const nom = SIZE_TABLE[w.size] ?? SIZE_TABLE['M'];
    const cm = EASE_CM[kind];
    const eB = Math.max(0.008, semi(nom[0] + cm, 0.68) - bust);
    const eW = Math.max(0.008, semi(nom[1] + cm, 0.72) - waist);
    const eH = Math.max(0.008, semi(nom[2] + cm, 0.74) - hips);
    const gH = hips + eH;
    const shoulder = Math.min(eB, 0.02) + 0.004;
    const ease = (f: number) => f >= 0.77 ? shoulder : f >= 0.725 ? mix(eB, shoulder, (f - 0.725) / 0.045)
      : f >= 0.62 ? mix(eW, eB, (f - 0.62) / 0.105) : f >= 0.52 ? mix(eH, eW, (f - 0.52) / 0.1) : eH;
    const looseAmp = (f: number) => f > 0.7 ? 0 : Math.min(0.016, Math.max(0, ease(f) - 0.02) * 0.5) * Math.min(1, (0.7 - f) / 0.08);

    const v = w.variant;
    const dress = kind === 'vestido';
    const sk = dress ? (SKIRTS[v] ?? SKIRTS['noche']) : kind === 'abrigo' ? { bot: 0.24, ratio: 0.8, fold: 0.01, k: 10, keys: [[0.24, 1.12], [0.52, 1.0]] as Pts } : null;
    const top = dress ? (v === 'tipico' ? 0.79 : v === 'xv' ? 0.795 : 0.8) : kind === 'top' ? 0.845 : kind === 'abrigo' ? 0.85 : 0.575;
    const torsoBot = kind === 'top' ? 0.5 : kind === 'pantalon' ? 0.47 : 0.52;
    const minA = hips * 0.5 + 0.1 * u * (male ? 1.12 : 1) + 0.01;
    const skMult = sk ? (sk.keys.length > 2 ? interp(sk.keys) : (f: number) => mix(sk.keys[0][1], sk.keys[1][1], (f - sk.keys[0][0]) / (sk.keys[1][0] - sk.keys[0][0]))) : null;
    const skA = (f: number) => Math.max(gH * skMult!(f), minA);
    const skFold = (f: number) => sk ? sk.fold * Math.pow(Math.min(1, Math.max(0, (0.52 - f) / (0.52 - sk.bot))), 2) : 0;

    const rows: GRow[] = [];                                       // de abajo hacia arriba
    if (sk && skMult) {
      const n = 26;
      for (let i = 0; i < n; i++) {
        const f = sk.bot + (0.52 - sk.bot) * (i / n), a = skA(f), rr = mix(0.74, sk.ratio, (0.52 - f) / 0.12);
        rows.push({ y: Y(f), a, bf: a * rr, bb: a * rr, f, sk: true });
      }
    }
    const nT = 56;
    for (let i = 0; i <= nT; i++) {
      const f = torsoBot + (top - torsoBot) * (i / nT), a = A(f) + ease(f), bi = Bi(f), base = A(f) * R(f);
      rows.push({
        y: Y(f), a, f, sk: false,
        bf: Math.max(a * R(f) * (1 + bi), base * (1 + bi) + 0.007),
        bb: Math.max(a * R(f) * (1 - bi), base * (1 - bi) + 0.007)
      });
    }

    // Geometría con relieve de pliegues y sombra en su fondo (vertex colors) + coordenadas para la trama
    const seg = 64, pos: number[] = [], col: number[] = [], uv: number[] = [], idx: number[] = [];
    rows.forEach((r, i) => {
      for (let j = 0; j <= seg; j++) {
        const t = (j / seg) * Math.PI * 2, s = Math.sin(t);
        let wf = 1, shade = 1;
        if (r.sk && sk) {
          const q = Math.sin(sk.k * t + 3 * r.f);
          wf = 1 + skFold(r.f) * q;
          shade = 1 - 0.3 * Math.max(0, -q) * Math.min(1, skFold(r.f) / sk.fold);
        } else {
          const ph = foldPhase(t, r.f), amp = looseAmp(r.f);
          wf = 1 + (amp * ph) / r.a;
          shade = 1 - 0.28 * Math.max(0, -ph) * Math.min(1, amp / 0.01);
        }
        pos.push(r.a * Math.cos(t) * wf, r.y, (s >= 0 ? r.bf : r.bb) * s * wf);
        col.push(shade, shade, shade);
        uv.push(j / seg, i / (rows.length - 1));
      }
    });
    for (let i = 0; i < rows.length - 1; i++) for (let j = 0; j < seg; j++) {
      const a = i * (seg + 1) + j, b = a + seg + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    this.fixSeam(geo, rows.length, seg);
    const body = c.mesh(geo, gm.vc);
    body.receiveShadow = true;
    fig.add(body);

    // Pantalón: dos perneras que siguen las piernas del maniquí
    if (kind === 'pantalon') {
      const leg: Pts = [[0.03, 0.02], [0.046, 0.15], [0.042, 0.28], [0.065, 0.38], [0.085, 0.5]];
      const off = Math.max(0.01, eH * 0.9);
      for (const side of [1, -1]) {
        const l = c.mesh(c.solid(leg.map(([r, f]) => [r * u * (male ? 1.12 : 1) + off + (f < 0.1 ? 0.012 : 0), Y(f)] as [number, number])), gm.plain);
        l.position.x = side * hips * 0.5;
        fig.add(l);
      }
      const band = new THREE.Mesh(new THREE.TorusGeometry(A(0.575) + ease(0.575) + 0.003, 0.008, 12, 64), gm.plain);
      band.rotation.x = Math.PI / 2; band.position.y = Y(0.575); band.scale.set(1, R(0.575) * 1.05, 1);
      band.castShadow = true; fig.add(band);
    }

    // Cuello y botones (camisa y abrigo)
    if ((kind === 'top' && v === 'camisa') || kind === 'abrigo') {
      const collar = new THREE.Mesh(new THREE.TorusGeometry(A(0.862) + 0.016, 0.011, 12, 48), gm.plain);
      collar.rotation.x = Math.PI / 2; collar.position.y = Y(0.862); collar.scale.set(1, 0.9, 1);
      collar.castShadow = true; fig.add(collar);
      const btn = new THREE.MeshStandardMaterial({ color: '#efe4d2', roughness: 0.4 });
      this.garmentMats.push(btn);
      const bot = kind === 'top' ? 0.52 : 0.3;
      for (let f = top - 0.03; f > bot; f -= 0.05) {
        const z = (A(f) + ease(f)) * R(f) * (1 + Bi(f)) + 0.004;
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.0065 * u, 12, 10), btn);
        b.position.set(0, Y(f), z);
        fig.add(b);
      }
    }

    // Vestido típico: volante en los hombros y bandas de adorno
    if (dress && v === 'tipico') {
      for (const [dr, dy, tube] of [[0.04, 0.012, 0.017], [0.058, -0.022, 0.015]] as [number, number, number][]) {
        const ruffle = new THREE.Mesh(new THREE.TorusGeometry(A(0.8) + dr, tube * u, 12, 72), gm.plain);
        ruffle.rotation.x = Math.PI / 2; ruffle.position.y = Y(0.8) + dy; ruffle.scale.set(1, 0.74, 1);
        ruffle.castShadow = true; fig.add(ruffle);
      }
      const trim = new THREE.MeshStandardMaterial({ color: '#f3ecdf', roughness: 0.6 });
      this.garmentMats.push(trim);
      for (const f of [0.3, 0.23]) {
        const band = new THREE.Mesh(new THREE.TorusGeometry(skA(f) * (1 + skFold(f) * 0.2) + 0.002, 0.011, 10, 80), trim);
        band.rotation.x = Math.PI / 2; band.position.y = Y(f); band.scale.set(1, sk!.ratio, 1);
        band.castShadow = true; fig.add(band);
      }
    }
  }

  // ---------------------------------------------------------------- controles
  setKind(k: Kind): void { this.kind.set(k); this.dy.set(0); }
  toggleAuto(): void {
    this.auto.set(!this.auto());
    if (this.controls) this.controls.autoRotate = this.auto();
  }
  clear(): void { this.dropGarment(); this.cleared.emit(); }
  private dropGarment(): void {
    this.loadId++;
    this.garment()?.tex.dispose();
    this.garment.set(null);
    this.scale.set(100);
    this.dy.set(0);
    this.status.set('idle');
  }

  // ---------------------------------------------------------------- imagen de la prenda
  private async load(url: string | null): Promise<void> {
    if (!url) { this.dropGarment(); return; }
    const id = ++this.loadId;
    this.status.set('loading');
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) throw new Error('http ' + res.status);
      const bmp = await createImageBitmap(await res.blob());
      if (id !== this.loadId) return;
      this.process(bmp, id);
    } catch {
      if (id === this.loadId) this.status.set('error');
    }
  }

  private process(bmp: ImageBitmap, id: number): void {
    const k = Math.min(1, 1200 / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * k), h = Math.round(bmp.height * k);
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(bmp, 0, 0, w, h);

    {
      const img = ctx.getImageData(0, 0, w, h), d = img.data;
      const corners = [0, w - 1, (h - 1) * w, h * w - 1].map(i => i * 4);
      if (corners.every(i => d[i + 3] > 200)) {                  // si ya es transparente no se toca
        const bg = [0, 1, 2].map(c => corners.reduce((s, i) => s + d[i + c], 0) / 4);
        const dist = (i: number) => Math.hypot(d[i] - bg[0], d[i + 1] - bg[1], d[i + 2] - bg[2]);
        const TOL = 38, seen = new Uint8Array(w * h), stack: number[] = [];
        const push = (p: number) => { if (!seen[p] && dist(p * 4) < TOL) { seen[p] = 1; stack.push(p); } };
        for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
        for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
        while (stack.length) {
          const p = stack.pop()!, x = p % w, y = (p / w) | 0;
          if (x > 0) push(p - 1);
          if (x < w - 1) push(p + 1);
          if (y > 0) push(p - w);
          if (y < h - 1) push(p + w);
        }
        for (let p = 0; p < w * h; p++) {
          if (seen[p]) { d[p * 4 + 3] = 0; continue; }
          const x = p % w, y = (p / w) | 0;
          if ((x > 0 && seen[p - 1]) || (x < w - 1 && seen[p + 1]) || (y > 0 && seen[p - w]) || (y < h - 1 && seen[p + w])) {
            const t = (dist(p * 4) - TOL) / (TOL * 0.6);          // borde suave: sin halos blancos
            d[p * 4 + 3] = Math.round(255 * Math.min(1, Math.max(0, t)));
          }
        }
        ctx.putImageData(img, 0, 0);
      }
    }

    // Recortar a la prenda y medir su silueta fila por fila
    const px = ctx.getImageData(0, 0, w, h).data;
    let x0 = w, x1 = -1, y0 = h, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (px[(y * w + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    if (x1 < 0) { this.status.set('error'); return; }
    const PAD = 2, bw = x1 - x0 + 1, bh = y1 - y0 + 1, cw = bw + PAD * 2, ch = bh + PAD * 2;
    const out = document.createElement('canvas');
    out.width = cw; out.height = ch;
    const octx = out.getContext('2d', { willReadFrequently: true })!;
    octx.drawImage(cv, x0, y0, bw, bh, PAD, PAD, bw, bh);
    const od = octx.getImageData(0, 0, cw, ch).data;
    const N = 80, raw: number[] = [];
    for (let i = 0; i < N; i++) {
      const y = Math.round((i / (N - 1)) * (ch - 1));
      let mn = cw, mx = -1;
      for (let x = 0; x < cw; x++) if (od[(y * cw + x) * 4 + 3] > 40) { if (x < mn) mn = x; mx = x; }
      raw.push(mx < 0 ? 0 : Math.max(cw / 2 - mn, mx + 1 - cw / 2) / cw);
    }
    const profile = raw.map((v, i) => Math.max(v, (raw[Math.max(0, i - 1)] + v + raw[Math.min(N - 1, i + 1)]) / 3));

    const tex = new THREE.CanvasTexture(out);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    if (id !== this.loadId) { tex.dispose(); return; }
    this.garment()?.tex.dispose();
    this.scale.set(100);
    this.dy.set(0);
    this.garment.set({ tex, aspect: cw / ch, profile });
    this.status.set('idle');
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.raf);
    this.ro?.disconnect();
    this.io?.disconnect();
    this.controls?.dispose();
    this.scene?.traverse(o => (o as THREE.Mesh).geometry?.dispose());
    this.garment()?.tex.dispose();
    this.shellMat?.dispose();
    this.garmentMats.forEach(x => x.dispose());
    this.skin.dispose();
    this.hair.dispose();
    this.renderer?.dispose();
  }
}