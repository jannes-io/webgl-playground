import { PBRMaterial, SceneLoader, SceneObject } from './scene';
import { mat4, vec3 } from 'gl-matrix';
import { parseObj } from '../objParser';
import {
  createFlatNormalTexture,
  createSolidColorTexture,
  createSolidWhiteTexture,
  initObjectBuffers,
  TextureID,
} from '../gl';
import sphereObj from './assets/sphere.obj';
import { orbitCamera } from '../cameras';

const loadScene: SceneLoader<PBRMaterial> = async (gl) => {
  const objectBuffers = initObjectBuffers(gl, parseObj(sphereObj));
  const red = createSolidColorTexture(gl, 128, 0, 0);
  const ao = createSolidWhiteTexture(gl);
  const normal = createFlatNormalTexture(gl);

  const modelMatrix = mat4.create();

  const textures: TextureID[] = [];
  const count = 5;
  for (let i = 0; i < count; i++) {
    const v = i / count * 255;
    textures.push(createSolidColorTexture(gl, v, v, v));
  }

  const spacing = 2.5;
  const spheres: SceneObject<PBRMaterial>[] = [];
  for (let i = 0; i < count; i++) {
    for (let j = 0; j < count; j++) {
      const x = (j - count / 2) * spacing;
      const y = (i - count / 2) * spacing;

      const transform = mat4.translate(mat4.create(), modelMatrix, [x, y, 0]);
      spheres.push({
        objectBuffers,
        transform,
        material: {
          albedo: red,
          normal,
          roughness: textures[j],
          metallic: textures[i],
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
