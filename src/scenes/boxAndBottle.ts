import { parseObj } from '../objParser';
import boxObj from './assets/box.obj';
import { mat4 } from 'gl-matrix';
import bottleObj from './assets/bottle.obj';
import bottleTex from './assets/bottle.png';
import { PhongMaterial, SceneLoader, SceneObject } from './scene';
import {
  createFlatNormalTexture,
  createSolidColorTexture,
  createSolidWhiteTexture,
  initObjectBuffers,
  loadTexture,
} from '../gl';

const loadScene: SceneLoader<PhongMaterial> = async (gl) => {
  const boxTranslate = new Float32Array([-30, -50, -200.0]);
  const box: SceneObject<PhongMaterial> = {
    objectBuffers: initObjectBuffers(gl, parseObj(boxObj)),
    material: {
      diffuse: createSolidColorTexture(gl, 255, 0, 255),
      specular: createSolidWhiteTexture(gl),
      normals: createFlatNormalTexture(gl),
      shininess: 32,
    },
    transform: mat4.translate(mat4.create(), mat4.create(), boxTranslate),
  };

  const bottleTranslate = new Float32Array([30, -35, -100.0]);
  const bottle: SceneObject<PhongMaterial> = {
    objectBuffers: initObjectBuffers(gl, parseObj(bottleObj)),
    material: {
      diffuse: await loadTexture(gl, bottleTex),
      specular: createSolidWhiteTexture(gl),
      normals: createFlatNormalTexture(gl),
      shininess: 16,
    },
    transform: mat4.translate(mat4.create(), mat4.create(), bottleTranslate),
  };

  let rotation = 0;
  const animate = (dt: number) => {
    rotation += dt / 1000;

    const bottleMatrix = mat4.create();
    mat4.translate(bottleMatrix, bottleMatrix, bottleTranslate);
    mat4.rotate(bottle.transform, bottleMatrix, rotation, [0, 1, 0]);

    const boxMatrix = mat4.create();
    mat4.translate(boxMatrix, boxMatrix, boxTranslate);
    mat4.rotate(box.transform, boxMatrix, rotation, [0.5, 0.7, 0.3]);
  };

  return {
    objects: [
      box,
      bottle,
    ],
    animate,
  };
};

export default loadScene;
