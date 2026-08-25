export interface MapObstacle {
  type: 'box' | 'cylinder' | 'wall';
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  name?: string;
}

export interface MapData {
  id: string;
  name: string;
  description: string;
  groundColor: string;
  fogColor: string;
  bounds: { width: number; height: number };
  spawnPoints: [number, number, number][];
  obstacles: MapObstacle[];
}
