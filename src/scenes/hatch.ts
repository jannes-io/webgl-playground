import { PBRMaterial, SceneLoader, SceneObject } from './scene';
import { glMatrix, mat4, vec3 } from 'gl-matrix';
import { parseObj } from '../objParser';
import gridObj from './assets/grid.obj';

import { initObjectBuffers, loadTexture } from '../gl';
import hatchAlbedo from './assets/hatch_albedo.png';
import hatchNormal from './assets/hatch_normal.png';
import hatchMetallic from './assets/hatch_metallic.png';
import hatchRoughness from './assets/hatch_roughness.png';
import hatchAO from './assets/hatch_ao.png';
import { orbitCamera } from '../cameras';

const loadScene: SceneLoader<PBRMaterial> = async (gl) => {
  const objectBuffers = initObjectBuffers(gl, parseObj(gridObj));
  const albedo = await loadTexture(gl, hatchAlbedo);
  const normal = await loadTexture(gl, hatchNormal);
  const metallic = await loadTexture(gl, hatchMetallic);
  const roughness = await loadTexture(gl, hatchRoughness);
  const ao = await loadTexture(gl, hatchAO);

  const transform = mat4.create();
  mat4.rotate(transform, transform, glMatrix.toRadian(90), [1, 0, 0]);
  mat4.rotate(transform, transform, glMatrix.toRadian(90), [0, -1, 0]);

  const hatch: SceneObject<PBRMaterial> = {
    objectBuffers,
    transform,
    material: {
      albedo,
      normal,
      metallic,
      roughness,
      ao,
    },
  };

  const camera = orbitCamera(gl, {
    position: vec3.create(),
    target: vec3.create(),
  }, 30);

  return {
    objects: [hatch],
    camera,
    lights: [
      vec3.fromValues(-10, 10, 5),
      vec3.fromValues(10, 10, 10),
      vec3.fromValues(-10, -10, 10),
      vec3.fromValues(10, -10, 10),
    ],
  };
};

export default loadScene;
