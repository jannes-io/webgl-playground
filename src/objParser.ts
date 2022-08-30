const filterByType = (lines: string[]) => (type: string) => lines
  .filter((ln) => ln.startsWith(type))
  .map((ln) => ln.substring(type.length));

export interface GLObject {
  positions: number[],
  normals: number[],
  texCoords: number[],
  vertexCount: number,
}

export const parse = (obj: string): GLObject => {
  const lines = obj
    .replaceAll('\r', '')
    .split('\n')
    .filter((ln) => !ln.startsWith('#') && ln !== '');

  const getLinesByType = filterByType(lines);

  const vertices = getLinesByType('v  ').map((ln) => ln.trim().split(' ').map(parseFloat));
  const texCoords = getLinesByType('vt ').map((ln) => ln.trim().split(' ').map(parseFloat));
  const normals = getLinesByType('vn ').map((ln) => ln.trim().split(' ').map(parseFloat));

  const objData = [vertices, texCoords, normals];
  const glData: number[][][] = [[], [], []];

  // face is defined as v/vt/vn
  const faces = getLinesByType('f ');
  for (const face of faces) {
    const triangle = face.trim().split(' ').map((t) => t.split('/').map((i) => parseInt(i)));
    for (const v of triangle) {
      for (const i of [0, 1, 2]) {
        glData[i].push(objData[i][v[i] - 1]);
      }
    }
  }

  const flatten = (arr: number[][]) => arr.flatMap((n) => n);

  return {
    positions: flatten(glData[0]),
    texCoords: flatten(glData[1]),
    normals: flatten(glData[2]),
    vertexCount: glData[0].length,
  };
};
