import { vec2, vec3 } from 'gl-matrix';

const filterByType = (lines: string[]) => (type: string) => lines
  .filter((ln) => ln.startsWith(type))
  .map((ln) => ln.substring(type.length));

export interface GLObject {
  vertices: number[],
  uvs: number[],
  normals: number[],
  tangents: number[],
  bitangents: number[],
  vertexCount: number,
}

interface PreTangentObject {
  vertices: number[][],
  uvs: number[][],
}

const flatten = (arr: number[][]) => arr.flatMap((n) => n);

const multiplyWithScalar = (v: vec3, s: number) => vec3.multiply(vec3.create(), v, vec3.fromValues(s, s, s));

const calculateTangents = ({ vertices, uvs }: PreTangentObject) => {
  const tangents: number[][] = [];
  const bitangents: number[][] = [];

  for (let i = 0; i < vertices.length; i += 3) {
    const v0 = vertices[i];
    const v1 = vertices[i + 1];
    const v2 = vertices[i + 2];

    const uv0 = uvs[i];
    const uv1 = uvs[i + 1];
    const uv2 = uvs[i + 2];

    const deltaPos1 = vec3.sub(
      vec3.create(),
      vec3.fromValues(v1[0], v1[1], v1[2]),
      vec3.fromValues(v0[0], v0[1], v0[2]),
    );
    const deltaPos2 = vec3.sub(
      vec3.create(),
      vec3.fromValues(v2[0], v2[1], v2[2]),
      vec3.fromValues(v0[0], v0[1], v0[2]),
    );

    const deltaUV1 = vec2.sub(
      vec2.create(),
      vec2.fromValues(uv1[0], uv1[1]),
      vec2.fromValues(uv0[0], uv0[1]),
    );
    const deltaUV2 = vec2.sub(
      vec2.create(),
      vec2.fromValues(uv2[0], uv2[1]),
      vec2.fromValues(uv0[0], uv0[1]),
    );

    const r = 1.0 / (deltaUV1[0] * deltaUV2[1] - deltaUV1[1] * deltaUV2[0]);

    const tangent = multiplyWithScalar(
      vec3.subtract(
        vec3.create(),
        multiplyWithScalar(deltaPos1, deltaUV2[1]),
        multiplyWithScalar(deltaPos2, deltaUV1[1])),
      r,
    );
    tangents.push([...tangent]);
    tangents.push([...tangent]);
    tangents.push([...tangent]);

    const bitangent = multiplyWithScalar(
      vec3.subtract(
        vec3.create(),
        multiplyWithScalar(deltaPos2, deltaUV1[0]),
        multiplyWithScalar(deltaPos1, deltaUV2[0])),
      r,
    );
    bitangents.push([...bitangent]);
    bitangents.push([...bitangent]);
    bitangents.push([...bitangent]);
  }

  return { tangents, bitangents };
};

export const parseObj = (obj: string): GLObject => {
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

  const { tangents, bitangents } = calculateTangents({
    vertices: glData[0],
    uvs: glData[1],
  });

  return {
    vertices: flatten(glData[0]),
    uvs: flatten(glData[1]),
    normals: flatten(glData[2]),
    tangents: flatten(tangents),
    bitangents: flatten(bitangents),
    vertexCount: glData[0].length,
  };
};
