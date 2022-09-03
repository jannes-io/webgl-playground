import { GLObject } from './objParser';

export const textureAtlas: WebGLTexture[] = [];

export const loadShader = (
  gl: WebGLRenderingContext,
  type: GLenum,
  source: string,
): WebGLShader | null => {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);

  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Error compiling shader', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);

    return null;
  }

  return shader;
};

export const initShaderProgram = (gl: WebGLRenderingContext, vecSrc: string, fragSrc: string) => {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vecSrc);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fragSrc);

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error('Unable to initialize shader program', gl.getProgramInfoLog(shaderProgram));

    return null;
  }

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return shaderProgram;
};

export const bindArrayBuffer = (gl: WebGLRenderingContext, buffer: WebGLBuffer, dataPtr: number) => {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(dataPtr, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(dataPtr);
};

export const bindTexture = (
  gl: WebGLRenderingContext,
  texture: number,
  sampler: WebGLUniformLocation,
) => {
  gl.bindTexture(gl.TEXTURE_2D, textureAtlas[texture]);
  gl.uniform1i(sampler, 0);
};

export interface GLObjectBuffers {
  position: WebGLBuffer;
  normal: WebGLBuffer;
  texture: WebGLBuffer;
  vertexCount: number;
}

export const initObjectBuffers = (gl: WebGLRenderingContext, obj: GLObject): GLObjectBuffers => {
  const position = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, position);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.positions), gl.STATIC_DRAW);

  const normal = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normal);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.normals), gl.STATIC_DRAW);

  const texture = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texture);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.texCoords), gl.STATIC_DRAW);

  const { vertexCount } = obj;
  return { position, normal, texture, vertexCount };
};

export const createSolidColorTexture = (
  gl: WebGLRenderingContext,
  r: number, g: number, b: number, a: number = 255,
) => {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  const color = new Uint8Array([r, g, b, a]);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, color);

  textureAtlas.push(texture);
  return textureAtlas.length - 1;
};

export const loadTexture = (gl: WebGLRenderingContext, url: string) => {
  const textureId = createSolidColorTexture(gl, 0, 255, 255);
  const texture = textureAtlas[textureId];

  const image = new Image();
  image.onload = () => {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    gl.generateMipmap(gl.TEXTURE_2D);
  };
  image.src = url;

  return textureId;
};
