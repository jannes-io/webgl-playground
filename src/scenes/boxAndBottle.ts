import { parse } from '../objParser';
import boxObj from './assets/box.obj';
import boxTex from './assets/box.png';
import { mat4 } from 'gl-matrix';
import bottleObj from './assets/bottle.obj';
import bottleTex from './assets/bottle.png';
import { SceneLoader } from './scene';
import { initObjectBuffers, loadTexture } from '../gl';

const loadScene: SceneLoader = (gl) => {
  const boxTranslate = new Float32Array([-30, -50, -200.0]);
  const box = {
    objectBuffers: initObjectBuffers(gl, parse(boxObj)),
    texture: loadTexture(gl, boxTex),
    transform: mat4.translate(mat4.create(), mat4.create(), boxTranslate),
  };

  const bottleTranslate = new Float32Array([30, -35, -100.0]);
  const bottle = {
    objectBuffers: initObjectBuffers(gl, parse(bottleObj)),
    texture: loadTexture(gl, bottleTex),
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
