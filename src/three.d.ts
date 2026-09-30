declare module 'three' {
  export class Material {
    dispose(): void;
  }
  export class MeshBasicMaterial extends Material {
    constructor(params?: object);
  }
  export class BufferGeometry {
    dispose(): void;
  }
  export class SphereGeometry extends BufferGeometry {
    constructor(radius?: number, widthSegments?: number, heightSegments?: number, phiStart?: number, phiLength?: number, thetaStart?: number, thetaLength?: number);
  }
  export class RingGeometry extends BufferGeometry {
    constructor(innerRadius?: number, outerRadius?: number, thetaSegments?: number);
  }
  export class Mesh {
    constructor(geometry?: BufferGeometry, material?: Material);
    geometry: BufferGeometry;
    material: Material;
    rotation: { x: number; y: number };
  }
  export class Group {
    add(...objects: object[]): void;
    rotation: { y: number };
  }
  export const DoubleSide: number;
}
