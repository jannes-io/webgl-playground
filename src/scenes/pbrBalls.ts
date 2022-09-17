import { PBRMaterial, SceneLoader, SceneObject } from './scene';
import { mat4, vec3 } from 'gl-matrix';
import { parse } from '../objParser';
import {
  createFlatNormalTexture,
  createSolidColorTexture,
  createSolidWhiteTexture,
  initObjectBuffers,
} from '../gl';
import sphereObj from './assets/sphere.obj';
import { orbitCamera } from '../cameras';

const loadScene: SceneLoader<PBRMaterial> = async (gl) => {
  const objectBuffers = initObjectBuffers(gl, parse(sphereObj));
  const red = createSolidColorTexture(gl, 128, 0, 0);
  const ao = createSolidWhiteTexture(gl);
  const normal = createFlatNormalTexture(gl);

  const modelMatrix = mat4.create();

  const count = 5;
  const spacing = 2.5;

  const spheres: SceneObject<PBRMaterial>[] = [];
  for (let i = 0; i < count; i++) {
    const metallicV = i / count * 255;
    const metallic = createSolidColorTexture(gl, metallicV, metallicV, metallicV);

    for (let j = 0; j < count; j++) {
      const x = (j - count / 2) * spacing;
      const y = (i - count / 2) * spacing;

      const roughnessT = Math.max(j / count * 255, 0.05);
      const roughness = createSolidColorTexture(gl, roughnessT, roughnessT, roughnessT);

      const transform = mat4.translate(mat4.create(), modelMatrix, [x, y, 0]);
      spheres.push({
        objectBuffers,
        transform,
        material: {
          albedo: red,
          normal,
          roughness,
          metallic,
          ao,
        },
      });
    }
  }

  const camera = orbitCamera(gl, {
    position: vec3.create(),
    target: vec3.create(),
  }, 20);

  return {
    objects: spheres,
    camera,
    lights: [
      vec3.fromValues(-10, 10, 10),
      vec3.fromValues(10, 10, 10),
      vec3.fromValues(-10, -10, 10),
      vec3.fromValues(10, -10, 10),
    ],
  };
};

export default loadScene;
