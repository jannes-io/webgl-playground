import { mat4 } from 'gl-matrix';
import { GLObjectBuffers } from '../gl';

export interface SceneObject {
  objectBuffers: GLObjectBuffers;
  texture: WebGLTexture;
  transform: mat4;
}

export interface Scene {
  objects: SceneObject[];
  animate?: (dt: number) => void;
}

export type SceneLoader = (gl: WebGLRenderingContext) => Scene;
