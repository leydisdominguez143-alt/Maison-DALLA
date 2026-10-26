import { AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone, OnDestroy, Output, PLATFORM_ID, ViewChild, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { MannequinService } from '../../core/services/mannequin.service';
import { BodyMeasurements, BodyType } from '../../core/models/measurements.model';

type Pts = [number, number][];
type Kind = 'vestido' | 'top' | 'pantalon' | 'abrigo';
interface Garment { tex: THREE.CanvasTexture; aspect: number; profile: number[]; }

/** Dónde empieza y termina cada prenda (fracción de la estatura: 0 pies, 1 cabeza). */
const KINDS: { id: Kind; label: string; top: number; bot: number; ref: 'mix' | 'bust' | 'hips' }[] = [
  { id: 'vestido',  label: 'Vestido',         top: 0.80,  bot: 0.03, ref: 'mix' },
  { id: 'top',      label: 'Parte de arriba', top: 0.835, bot: 0.50, ref: 'bust' },
  { id: 'pantalon', label: 'Pantalón',        top: 0.57,  bot: 0.02, ref: 'hips' },
  { id: 'abrigo',   label: 'Abrigo',          top: 0.84,  bot: 0.24, ref: 'bust' }
];

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
    <canvas #canvas role="img" aria-label="Maniquí 3D con la prenda seleccionada. Arrastra para girarlo."></canvas>
    <div class="bar">
      @if (status() === 'loading') {
        <span class="tip">Cargando prenda…</span>
      } @else if (status() === 'error') {
        <span class="tip">No se pudo cargar esta prenda. Prueba con otra.</span>
      } @else if (garment()) {
        <div class="chips" role="group" aria-label="Tipo de prenda">
          @for (k of kinds; track k.id) {
            <button type="button" [class.on]="kind()===k.id" (click)="setKind(k.id)">{{ k.label }}</button>
          }
        </div>
        <label class="range">Tamaño <input type="range" min="50" max="150" [value]="scale()" (input)="scale.set(+$any($event.target).value)"></label>
        <label class="range">Altura <input type="range" min="-20" max="20" [value]="dy()" (input)="dy.set(+$any($event.target).value)"></label>
        <button type="button" class="ghost" (click)="clear()">Quitar prenda</button>
      } @else {
        <span class="tip">Elige una prenda del catálogo para verla puesta.</span>
      }
      <button type="button" class="ghost" [attr.aria-pressed]="auto()" (click)="toggleAuto()">{{ auto() ? 'Detener giro' : 'Girar solo' }}</button>
    </div>
    <span class="hint">Arrastra para girar</span>
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
  private loadId = 0;

  /** URL de la foto de la prenda (idealmente un PNG de la prenda sin fondo). */
  @Input() set src(url: string | null) { this.load(url); }
  /** Tipo de prenda: decide en qué parte del cuerpo se coloca. */
  @Input() set type(k: Kind | null) { if (k) { this.kind.set(k); this.dy.set(0); } }
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
    effect(() => this.build(this.svc.measurements(), this.svc.bodyType(), this.garment(), this.kind(), this.scale(), this.dy()));
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

    this.build(this.svc.measurements(), this.svc.bodyType(), this.garment(), this.kind(), this.scale(), this.dy());

    const tick = () => {
      this.raf = requestAnimationFrame(tick);
      if (!this.visible) return;
      controls.update();
      renderer.render(scene, camera);
    };
    tick();
  }

  // ---------------------------------------------------------------- figura
  private build(m: BodyMeasurements, type: BodyType, g: Garment | null, kind: Kind, scale: number, dy: number): void {
    const scene = this.scene;
    if (!scene || !this.camera || !this.controls) return;
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
    const arm = solid(([
      [0, 0], [0.008, 0.02], [0.021, 0.06], [0.026, 0.13], [0.021, 0.2], [0.027, 0.3],
      [0.036, 0.45], [0.033, 0.52], [0.04, 0.62], [0.045, 0.85], [0.043, 1]
    ] as Pts).map(([r, t]) => [r * u * thick, t * L] as [number, number]), 32);
    const swing = 0.1 + Math.max(0, hips - 0.18) * 1.2;
    for (const side of [1, -1]) {
      const pivot = new THREE.Group();
      pivot.position.set(side * sh * 0.97, Y(0.805), 0);
      pivot.rotation.z = side * swing;
      const a = mesh(arm, this.skin);
      a.position.y = -L;
      pivot.add(a, mesh(new THREE.SphereGeometry(0.05 * u * thick, 24, 18), this.skin));
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

    // Prenda: envoltura con la silueta de la foto, que mira al frente (y se repite por detrás)
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
    this.skin.dispose();
    this.hair.dispose();
    this.renderer?.dispose();
  }
}