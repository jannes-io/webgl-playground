import { mat4, vec3 } from 'gl-matrix';
import { GLObjectBuffers } from '../gl';

export interface SceneObject {
  objectBuffers: GLObjectBuffers;
  texture: number;
  transform: mat4;
}

export interface Camera {
  position: vec3;
  target: vec3;
}

export interface Scene {
  objects: SceneObject[];
  camera?: Camera;
  animate?: (dt: number) => void;
}

export type SceneLoader = (gl: WebGLRenderingContext) => Scene;
