import { SceneLoader } from './scene';
import { parse } from '../objParser';
import boxObj from './assets/smollbox.obj';
import boxTex from './assets/box.png';
import { initObjectBuffers, loadTexture } from '../gl';
import { mat4, vec3 } from 'gl-matrix';

const loadScene: SceneLoader = (gl) => {
  const parsedBox = parse(boxObj);
  const boxTexture = loadTexture(gl, boxTex);

  const modelMatrix = mat4.create();

  const boxes = [];
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      for (let k = 0; k < 5; k++) {
        const boxMatrix = mat4.translate(mat4.create(), modelMatrix, [i * 3, j * -3, k * 3]);

        boxes.push({
          objectBuffers: initObjectBuffers(gl, parsedBox),
          texture: boxTexture,
          transform: boxMatrix,
        });
      }
    }
  }

  const camera = {
    position: vec3.fromValues(0, 0, 3),
    target: vec3.fromValues(0, 0, 0),
  };

  let time = 0;
  const animate = (dt: number) => {
    const r = 10;
    const camX = Math.sin(time) * r;
    const camZ = Math.cos(time) * r;

    camera.position = vec3.fromValues(camX, 3, camZ);

    time += dt / 1000;
  };

  return {
    objects: boxes,
    camera,
    animate,
  };
};

export default loadScene;
