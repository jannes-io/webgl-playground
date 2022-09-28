import { mat4, vec3 } from 'gl-matrix';
import { GLObjectBuffers, TextureID } from '../gl';

export interface PhongMaterial {
  diffuse: TextureID;
  specular: TextureID;
  normals: TextureID;
  shininess: number;
}

export interface PBRMaterial {
  albedo: TextureID;
  normal: TextureID;
  metallic: TextureID;
  roughness: TextureID;
  ao: TextureID;
}

type Material = PhongMaterial | PBRMaterial;

export interface SceneObject<Mat extends Material> {
  objectBuffers: GLObjectBuffers;
  material: Mat;
  transform: mat4;
}

export interface Camera {
  position: vec3;
  target: vec3;
}

export interface Scene<Mat extends Material> {
  objects: SceneObject<Mat>[];
  lights?: vec3[];
  camera?: Camera;
  animate?: (dt: number) => void;
  hdr?: TextureID;
}

export type SceneLoader<Mat extends Material> = (gl: WebGLRenderingContext) => Promise<Scene<Mat>>;
