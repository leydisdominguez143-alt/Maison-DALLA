import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, effect, inject } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MannequinService } from '../../core/services/mannequin.service';

@Component({
  selector: 'app-mannequin-canvas',
  standalone: true,
  template: `<div #viewport class="viewport"><span class="canvas-label">MAISON DALLA / 3D STUDIO</span><span class="canvas-hint">Arrastra para rotar · Scroll para acercar</span></div>`,
  styles: [`
    :host{display:block;width:100%}.viewport{height:100%;min-height:460px;position:relative;overflow:hidden;background:transparent}.viewport canvas{display:block;width:100%;height:100%}.canvas-label,.canvas-hint{position:absolute;z-index:1;font-size:9px;letter-spacing:.16em;pointer-events:none}.canvas-label{top:18px;left:18px;color:var(--dalla-gold-light)}.canvas-hint{bottom:18px;left:18px;color:#c5bcae}@media(max-width:600px){.viewport{height:520px;min-height:0}}
  `]
})
export class MannequinCanvasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('viewport', { static: true }) private viewportRef!: ElementRef<HTMLDivElement>;
  private readonly mannequin = inject(MannequinService);
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private model!: THREE.Group;
  private garment!: THREE.Mesh;
  private animationId = 0;
  private resizeObserver?: ResizeObserver;
  private loadedModel?: THREE.Object3D;
  private readonly colorEffect = effect(() => {
    const color = this.mannequin.garmentColor();
    if (this.garment) (this.garment.material as THREE.MeshStandardMaterial).color.set(color);
    this.loadedModel?.traverse(o => {
      if (o instanceof THREE.Mesh) {
        const materials = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of materials) if (m instanceof THREE.MeshStandardMaterial && m.name.toLowerCase().includes('garment')) m.color.set(color);
      }
    });
  });
  private readonly anatomyEffect = effect(() => {
    const type = this.mannequin.bodyType();
    const m = this.mannequin.measurements();
    if (this.model) this.updateModel(type, m.bust, m.waist, m.hips, m.height);
  });

  ngAfterViewInit(): void {
    try {
      this.initializeScene();
      this.createMannequin();
      this.observeResize();
      this.loadOptionalModel();
      this.animate();
    } catch (error) {
      console.error('No fue posible iniciar WebGL.', error);
      this.viewportRef.nativeElement.innerHTML = '<p style="padding:24px;color:#f0d28a">No se pudo iniciar el visor 3D en este dispositivo. Prueba con un navegador actualizado y aceleración gráfica habilitada.</p>';
    }
  }
  private initializeScene(): void {
    const host = this.viewportRef.nativeElement;
    this.scene = new THREE.Scene();
    this.scene.background = null;
    this.camera = new THREE.PerspectiveCamera(35, host.clientWidth / host.clientHeight, 0.1, 100);
    this.camera.position.set(0, 1.4, 6.5);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(host.clientWidth, host.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    host.appendChild(this.renderer.domElement);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = .06;
    this.controls.target.set(0, 1.2, 0);
    this.controls.minDistance = 3.5;
    this.controls.maxDistance = 9;
    this.controls.maxPolarAngle = Math.PI * .85;
    this.scene.add(new THREE.HemisphereLight('#fff8e9', '#65513b', 2));
    const key = new THREE.DirectionalLight('#ffe7b3', 3.2); key.position.set(3, 5, 4); this.scene.add(key);
    const rim = new THREE.DirectionalLight('#c5d8ff', 2); rim.position.set(-4, 3, -2); this.scene.add(rim);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({color:'#151a20', roughness:1}));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -.04; this.scene.add(ground);
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(1.05,1.05,.08,80), new THREE.MeshStandardMaterial({color:'#090c11',metalness:.65,roughness:.24}));
    ring.position.y = .02; ring.scale.set(1,.7,1); this.scene.add(ring);
    const goldRing = new THREE.Mesh(new THREE.TorusGeometry(1.04,.018,8,96), new THREE.MeshStandardMaterial({color:'#d4af37',metalness:.7,roughness:.25,emissive:'#6c4712',emissiveIntensity:.3}));
    goldRing.rotation.x = Math.PI/2; goldRing.position.y = .045; this.scene.add(goldRing);
  }
  private createMannequin(): void {
    this.model = new THREE.Group();
    const skin = new THREE.MeshStandardMaterial({color:'#c8a98b',roughness:.78});
    const cloth = new THREE.MeshStandardMaterial({color:this.mannequin.garmentColor(),roughness:.38,metalness:.03});
    const sphere = (r:number,p:[number,number,number],mat:THREE.Material,s:[number,number,number]=[1,1,1]) => {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(r,32,24),mat);
      mesh.position.set(...p); mesh.scale.set(...s); this.model.add(mesh); return mesh;
    };
    const head = sphere(.25,[0,2.45,0],skin,[.82,1.18,.85]); head.name = 'body-head';
    sphere(.105,[0,2.12,0],skin,[.9,1.25,.9]);
    const torso = sphere(.43,[0,1.68,0],skin,[1.1,1.25,.65]); torso.name = 'body-torso';
    const hip = sphere(.4,[0,1.03,0],skin,[1.1,.65,.7]); hip.name = 'body-hips';
    this.garment = new THREE.Mesh(new THREE.CylinderGeometry(.31,.57,1.35,40,8,false),cloth);
    this.garment.name = 'garment-preview'; this.garment.position.set(0,1.43,0); this.garment.scale.set(1,1,.76); this.model.add(this.garment);
    const legs = new THREE.Group(); legs.name = 'body-legs'; this.model.add(legs); for (const x of [-.19,.19]) { const leg = new THREE.Mesh(new THREE.SphereGeometry(.14,32,24), skin); leg.position.set(x,.48,0); leg.scale.set(.85,1.8,.9); legs.add(leg); }
    for (const x of [-.49,.49]) sphere(.12,[x,1.55,0],skin,[.75,2.1,.8]);
    this.scene.add(this.model);
  }
  private updateModel(type:'female'|'male', bust:number, waist:number, hips:number, height:number): void {
    if (!this.model) return;
    // Los meshes se guardan por nombre para que el ajuste no dependa del orden children[].
    const torso = this.model.getObjectByName('body-torso') as THREE.Mesh | undefined;
    const hip = this.model.getObjectByName('body-hips') as THREE.Mesh | undefined;
    const head = this.model.getObjectByName('body-head') as THREE.Mesh | undefined;
    const legs = this.model.getObjectByName('body-legs') as THREE.Group | undefined;
    const bustScale = THREE.MathUtils.clamp(bust / 92, .78, 1.28);
    const waistScale = THREE.MathUtils.clamp(waist / 72, .72, 1.32);
    const hipScale = THREE.MathUtils.clamp(hips / 96, .75, 1.3);
    const heightScale = THREE.MathUtils.clamp(height / 168, .82, 1.18);
    if (torso) torso.scale.set((type === 'female' ? 1.1 : 1.3) * bustScale, 1.25 * heightScale, .65 * bustScale);
    if (hip) hip.scale.set(1.1 * hipScale, .65, .7 * hipScale);
    if (head) head.scale.set(type === 'female' ? .82 : .9, 1.18, .85);
    if (legs) legs.scale.y = heightScale;
    if (this.garment) {
      this.garment.scale.set(waistScale, heightScale, .76 * hipScale);
      this.garment.position.y = 1.43 * heightScale;
    }
  }
  private loadOptionalModel(): void {
    const loader = new GLTFLoader();
    loader.load('/assets/models/mannequin-female.glb', gltf => {
      this.loadedModel = gltf.scene;
      this.loadedModel.position.set(0,0,0);
      this.loadedModel.scale.setScalar(1);
      this.scene.add(this.loadedModel);
      this.model.visible = false;
    }, undefined, () => {
      // El GLB es opcional: la escena procedural permanece visible si no existe.
    });
  }
  private observeResize(): void {
    const host = this.viewportRef.nativeElement;
    this.resizeObserver = new ResizeObserver(() => {
      if (!this.renderer) return;
      const width = host.clientWidth, height = host.clientHeight;
      if (!width || !height) return;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width,height);
    });
    this.resizeObserver.observe(host);
  }
  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    this.controls?.update();
    this.renderer?.render(this.scene,this.camera);
  };
  ngOnDestroy(): void {
    cancelAnimationFrame(this.animationId);
    this.resizeObserver?.disconnect();
    this.controls?.dispose();
    this.scene?.traverse(o => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach(m => m.dispose());
      }
    });
    this.renderer?.dispose();
    this.renderer?.domElement.remove();
    this.colorEffect.destroy();
    this.anatomyEffect.destroy();
  }
}
