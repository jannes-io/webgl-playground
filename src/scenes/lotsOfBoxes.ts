import { SceneLoader } from './scene';
import { parse } from '../objParser';
import boxObj from './assets/smollbox.obj';
import { createSolidColorTexture, initObjectBuffers } from '../gl';
import { mat4, vec3 } from 'gl-matrix';
import { orbitCamera } from '../cameras';

const loadScene: SceneLoader = (gl) => {
  const parsedBox = parse(boxObj);

  const modelMatrix = mat4.create();

  const boxes = [];
  const count = 5;
  for (let i = 0; i < count; i++) {
    for (let j = 0; j < count; j++) {
      for (let k = 0; k < count; k++) {
        // boxes in all directions around 0, 0
        const spacing = 2.5;
        const x = (i - count / 2) * spacing;
        const y = (j - count / 2) * spacing;
        const z = (k - count / 2) * spacing;

        const boxMatrix = mat4.translate(mat4.create(), modelMatrix, [x, y, z]);

        // funky colors
        const r = 255 / (count - 1) * i;
        const g = 255 / (count - 1) * j;
        const b = 255 / (count - 1) * k;

        const texture = createSolidColorTexture(gl, r, g, b);

        boxes.push({
          objectBuffers: initObjectBuffers(gl, parsedBox),
          texture,
          transform: boxMatrix,
        });
      }
    }
  }

  const camera = orbitCamera(gl, {
    position: vec3.fromValues(0, 0, 0),
    target: vec3.fromValues(0, 0, 0),
  }, 20);

  return {
    objects: boxes,
    camera,
  };
};

export default loadScene;
