import { SceneLoader, SceneObject } from './scene';
import { parse } from '../objParser';
import boxObj from './assets/smollbox.obj';
import containerDiffTex from './assets/container_diff.png';
import containerSpecTex from './assets/container_spec.png';
import { initObjectBuffers, loadTexture } from '../gl';
import { mat4, vec3 } from 'gl-matrix';
import { orbitCamera } from '../cameras';

const loadScene: SceneLoader = async (gl) => {
  const parsedBox = parse(boxObj);
  const diffuse = await loadTexture(gl, containerDiffTex);
  const specular = await loadTexture(gl, containerSpecTex);

  const modelMatrix = mat4.create();

  const boxes: SceneObject[] = [];
  const count = 3;
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
        // const r = 255 / (count - 1) * i;
        // const g = 255 / (count - 1) * j;
        // const b = 255 / (count - 1) * k;
        //
        // const texture = createSolidColorTexture(gl, r, g, b);

        boxes.push({
          objectBuffers: initObjectBuffers(gl, parsedBox),
          material: {
            diffuse,
            specular,
            shininess: 32,
          },
          transform: boxMatrix,
        });
      }
    }
  }

  const camera = orbitCamera(gl, {
    position: vec3.fromValues(0, 0, 0),
    target: vec3.fromValues(-1, -0.75, -1.25),
  }, 20);

  return {
    objects: boxes,
    camera,
    lights: [vec3.fromValues(-0.2, -1, -0.3)],
  };
};

export default loadScene;
