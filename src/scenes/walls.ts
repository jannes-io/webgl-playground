import { SceneLoader } from './scene';
import { parse } from '../objParser';
import gridObj from './assets/grid.obj';
import gridDiffTex from './assets/brick_diffuse.png';
import gridNormTex from './assets/brick_normals.png';
import { createSolidColorTexture, initObjectBuffers, loadTexture } from '../gl';
import { glMatrix, mat4, vec3 } from 'gl-matrix';
import { orbitCamera } from '../cameras';

const walls: SceneLoader = async (gl) => {
  const plane = parse(gridObj);
  const diffuse = await loadTexture(gl, gridDiffTex);
  const normals = await loadTexture(gl, gridNormTex);

  const light = vec3.fromValues(0, 2, 0);
  const light2 = vec3.fromValues(0, 2, 0);

  const transform = mat4.create();
  mat4.rotate(transform, transform, glMatrix.toRadian(90), [1, 0, 0]);

  let time = 0;
  const { sin, cos } = Math;
  const animate = (dt: DOMHighResTimeStamp) => {
    time += dt / 1000;
    const x = sin(time) * 5;
    const z = cos(time) * 5;

    vec3.set(light, x, z, 1.5);
    vec3.set(light2, z, x, 1.5);
  };

  return {
    objects: [{
      objectBuffers: initObjectBuffers(gl, plane),
      transform,
      material: {
        diffuse,
        specular: createSolidColorTexture(gl, 200, 200, 200),
        normals,
        shininess: 32,
      },
    }],
    lights: [light, light2],
    camera: orbitCamera(gl, {
      position: vec3.create(),
      target: vec3.create(),
    }, 40),
    animate,
  };
};

export default walls;
