import { SceneLoader, SceneObject } from './scene';
import { parse } from '../objParser';
import boxObj from './assets/smollbox_more_faces.obj';
import containerDiffTex from './assets/box_low_diff.png';
import containerSpecTex from './assets/box_low_spec.png';
import containerNormalTex from './assets/box_low_normals.png';
import { initObjectBuffers, loadTexture } from '../gl';
import { mat4, vec3 } from 'gl-matrix';
import { orbitCamera } from '../cameras';

const loadScene: SceneLoader = async (gl) => {
  const parsedBox = parse(boxObj);
  const diffuse = await loadTexture(gl, containerDiffTex);
  const specular = await loadTexture(gl, containerSpecTex);
  const normals = await loadTexture(gl, containerNormalTex);

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
            normals,
            shininess: 128,
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
    lights: [
      vec3.fromValues(2, 0.9, 3),
      vec3.fromValues(1, 3, -1),
      vec3.fromValues(5, -2, 0),
      vec3.fromValues(-4, 1, 3),
    ],
  };
};

export default loadScene;
