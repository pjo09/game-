import * as THREE from 'three';
import { MapData } from './types';

export class MapManager {
  private scene: THREE.Scene;
  private currentMeshes: THREE.Mesh[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public loadMap(mapData: MapData) {
    this.clearMap();

    this.scene.background = new THREE.Color(mapData.fogColor);
    this.scene.fog = new THREE.FogExp2(mapData.fogColor, 0.025);

    const groundGeo = new THREE.PlaneGeometry(mapData.bounds.width, mapData.bounds.height);
    const groundMat = new THREE.MeshStandardMaterial({
      color: mapData.groundColor,
      roughness: 0.8,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.currentMeshes.push(ground);

    const grid = new THREE.GridHelper(mapData.bounds.width, 20, 0x6366f1, 0x334155);
    grid.position.y = 0.01;
    this.scene.add(grid);
    this.currentMeshes.push(grid as unknown as THREE.Mesh);

    for (const obs of mapData.obstacles) {
      let geo: THREE.BufferGeometry;
      if (obs.type === 'cylinder') {
        geo = new THREE.CylinderGeometry(obs.size[0], obs.size[0], obs.size[1], obs.size[2] || 16);
      } else {
        geo = new THREE.BoxGeometry(obs.size[0], obs.size[1], obs.size[2]);
      }

      const mat = new THREE.MeshStandardMaterial({
        color: obs.color,
        roughness: 0.6,
        metalness: 0.3,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(obs.position[0], obs.position[1], obs.position[2]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.currentMeshes.push(mesh);
    }
  }

  public clearMap() {
    for (const mesh of this.currentMeshes) {
      this.scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose());
      } else if (mesh.material) {
        mesh.material.dispose();
      }
    }
    this.currentMeshes = [];
  }
}
