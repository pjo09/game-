import * as THREE from 'three';
import { Player, Vector3D } from '../types';
import { MapManager } from '../maps/MapManager';
import { MAPS } from '../maps/maps';
import { audioManager } from '../utils/AudioManager';

export class GameScene {
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private mapManager: MapManager;
  private playerMeshes: Map<string, THREE.Group> = new Map();
  private nameTags: Map<string, HTMLDivElement> = new Map();
  private overlayContainer: HTMLDivElement;

  private localPlayerId: string;
  private moveVector = { x: 0, z: 0 };
  private keysPressed: Record<string, boolean> = {};
  private onMoveCallback?: (pos: Vector3D, rotY: number) => void;
  private onCatchCallback?: (targetId: string) => void;

  private stepTimer = 0;
  private animFrameId: number | null = null;
  private isDestroyed = false;

  constructor(container: HTMLDivElement, localPlayerId: string) {
    this.container = container;
    this.localPlayerId = localPlayerId;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 100);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    this.overlayContainer = document.createElement('div');
    this.overlayContainer.className = 'absolute inset-0 pointer-events-none overflow-hidden z-20';
    this.container.appendChild(this.overlayContainer);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(15, 30, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    this.scene.add(dirLight);

    this.mapManager = new MapManager(this.scene);

    this.setupInputs();
    window.addEventListener('resize', this.onWindowResize);

    this.animate();
  }

  public setMap(mapId: string) {
    const mapData = MAPS[mapId] || MAPS['school'];
    this.mapManager.loadMap(mapData);
  }

  public setOnMove(cb: (pos: Vector3D, rotY: number) => void) {
    this.onMoveCallback = cb;
  }

  public setOnCatch(cb: (targetId: string) => void) {
    this.onCatchCallback = cb;
  }

  public setTouchMove(vector: { x: number; y: number }) {
    this.moveVector.x = vector.x;
    this.moveVector.z = vector.y;
  }

  private setupInputs() {
    window.addEventListener('keydown', (e) => {
      this.keysPressed[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keysPressed[e.code] = false;
    });

    this.container.addEventListener('click', (e) => {
      if (!this.onCatchCallback) return;
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
      raycaster.setFromCamera(mouse, this.camera);

      for (const [id, group] of this.playerMeshes.entries()) {
        if (id === this.localPlayerId) continue;
        const intersects = raycaster.intersectObjects(group.children, true);
        if (intersects.length > 0) {
          this.onCatchCallback(id);
          break;
        }
      }
    });
  }

  public updatePlayers(players: Record<string, Player>) {
    const activeIds = new Set(Object.keys(players));

    for (const [id, mesh] of this.playerMeshes.entries()) {
      if (!activeIds.has(id)) {
        this.scene.remove(mesh);
        this.playerMeshes.delete(id);
        if (this.nameTags.has(id)) {
          this.nameTags.get(id)?.remove();
          this.nameTags.delete(id);
        }
      }
    }

    for (const p of Object.values(players)) {
      let group = this.playerMeshes.get(p.id);

      if (!group) {
        group = this.createPlayerMesh(p);
        this.scene.add(group);
        this.playerMeshes.set(p.id, group);

        const tag = document.createElement('div');
        tag.className = 'absolute px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide shadow-lg transition-transform pointer-events-none whitespace-nowrap border border-white/20';
        this.overlayContainer.appendChild(tag);
        this.nameTags.set(p.id, tag);
      }

      group.position.lerp(new THREE.Vector3(p.position.x, p.position.y, p.position.z), 0.3);
      group.rotation.y = p.rotationY;

      const aura = group.getObjectByName('seekerAura');
      if (aura) {
        aura.visible = p.role === 'SEEKER';
      }

      const tagEl = this.nameTags.get(p.id);
      if (tagEl) {
        tagEl.innerText = `${p.username} [${p.role}]`;
        tagEl.style.backgroundColor = p.role === 'SEEKER' ? '#ef4444' : p.color;
        tagEl.style.color = '#ffffff';
      }
    }
  }

  private createPlayerMesh(p: Player): THREE.Group {
    const group = new THREE.Group();

    const bodyGeo = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: p.color,
      roughness: 0.4,
      metalness: 0.2,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1;
    body.castShadow = true;
    group.add(body);

    const eyeGeo = new THREE.BoxGeometry(0.15, 0.15, 0.2);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.2, 1.3, 0.4);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.2, 1.3, 0.4);
    group.add(eyeL, eyeR);

    const auraGeo = new THREE.RingGeometry(0.8, 1.1, 32);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const aura = new THREE.Mesh(auraGeo, auraMat);
    aura.name = 'seekerAura';
    aura.rotation.x = -Math.PI / 2;
    aura.position.y = 0.05;
    aura.visible = p.role === 'SEEKER';
    group.add(aura);

    group.position.set(p.position.x, p.position.y, p.position.z);
    return group;
  }

  private animate = () => {
    if (this.isDestroyed) return;

    this.animFrameId = requestAnimationFrame(this.animate);

    let dx = 0;
    let dz = 0;

    if (this.keysPressed['KeyW'] || this.keysPressed['ArrowUp']) dz -= 1;
    if (this.keysPressed['KeyS'] || this.keysPressed['ArrowDown']) dz += 1;
    if (this.keysPressed['KeyA'] || this.keysPressed['ArrowLeft']) dx -= 1;
    if (this.keysPressed['KeyD'] || this.keysPressed['ArrowRight']) dx += 1;

    dx += this.moveVector.x;
    dz += this.moveVector.z;

    const localGroup = this.playerMeshes.get(this.localPlayerId);
    if (localGroup && (Math.abs(dx) > 0.05 || Math.abs(dz) > 0.05)) {
      const speed = 0.18;
      const angle = Math.atan2(dx, dz);
      localGroup.position.x += Math.sin(angle) * speed;
      localGroup.position.z += Math.cos(angle) * speed;
      localGroup.rotation.y = angle;

      this.stepTimer += 0.016;
      if (this.stepTimer > 0.35) {
        audioManager.playFootstep();
        this.stepTimer = 0;
      }

      if (this.onMoveCallback) {
        this.onMoveCallback(
          { x: localGroup.position.x, y: localGroup.position.y, z: localGroup.position.z },
          localGroup.rotation.y
        );
      }
    }

    if (localGroup) {
      this.camera.position.set(
        localGroup.position.x,
        localGroup.position.y + 12,
        localGroup.position.z + 14
      );
      this.camera.lookAt(localGroup.position.x, localGroup.position.y + 1, localGroup.position.z);
    }

    for (const [id, tagEl] of this.nameTags.entries()) {
      const g = this.playerMeshes.get(id);
      if (g) {
        const tempVec = new THREE.Vector3(g.position.x, g.position.y + 2.2, g.position.z);
        tempVec.project(this.camera);

        const x = (tempVec.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-(tempVec.y * 0.5) + 0.5) * window.innerHeight;

        tagEl.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
      }
    }

    this.renderer.render(this.scene, this.camera);
  };

  private onWindowResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  public destroy() {
    this.isDestroyed = true;
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('resize', this.onWindowResize);
    this.mapManager.clearMap();
    this.renderer.dispose();
    this.container.innerHTML = '';
  }
}
