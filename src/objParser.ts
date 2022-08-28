import { vec3 } from 'gl-matrix';

const createVec3Extractor = (lines: string[]) => (type: string) => lines
  .filter((ln) => ln.startsWith(type))
  .map((ln) => {
    const locations = ln
      .substring(type.length)
      .split(' ')
      .map((v) => parseFloat(v));
    return vec3.fromValues(locations[0], locations[1], locations[2]);
  });

export const parse = (objFile: string) => {
  const lines = objFile
    .split('\r\n')
    .filter((ln) => ln !== '' || !ln.startsWith('#'));

  const extractVec3 = createVec3Extractor(lines);

  const vertices = extractVec3('v  ');
  const normals = extractVec3('vn ');
  const textureCoordinates = extractVec3('vt ');

  return {
    vertices,
    normals,
    textureCoordinates,
  };
};
