import { mat4, vec3 } from 'gl-matrix';
import { GLObjectBuffers, TextureID } from '../gl';

export interface SceneObject {
  objectBuffers: GLObjectBuffers;
  material: {
    diffuse: TextureID;
    specular: TextureID;
    shininess: number;
  };
  transform: mat4;
}

export interface Camera {
  position: vec3;
  target: vec3;
}

export interface Scene {
  objects: SceneObject[];
  lights?: vec3[];
  camera?: Camera;
  animate?: (dt: number) => void;
}

export type SceneLoader = (gl: WebGLRenderingContext) => Promise<Scene>;
