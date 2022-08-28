const getLinesByType = (lines: string[], type: string) => lines
  .filter((ln) => ln.startsWith(type))
  .map((ln) => ln.substring(type.length));

const createVec3Extractor = (lines: string[]) => (type: string) => getLinesByType(lines, type)
  .reduce((acc, ln) => acc.concat(...ln
    .split(' ')
    .map((v) => parseFloat(v))), []);

export const parse = (objFile: string) => {
  const lines = objFile
    .split('\r\n')
    .filter((ln) => ln !== '' || !ln.startsWith('#'));

  const extractVec3 = createVec3Extractor(lines);

  const vertices = extractVec3('v  ');
  const normals = extractVec3('vn ');
  const textureCoordinates = extractVec3('vt ');

  const indices = getLinesByType(lines, 'f ')
    .reduce((acc, ln) => {
      const faceLn = ln.split(' ')
        .filter((fl) => fl !== '')
        .map((fl) => parseInt(fl.split('/')[0]) - 1);

      return acc.concat(...faceLn);
    }, []);

  return {
    vertices,
    normals,
    textureCoordinates,
    indices,
  };
};
