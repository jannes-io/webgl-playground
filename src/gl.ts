import { GLObject } from './objParser';

export type TextureID = number;

export const textureAtlas: WebGLTexture[] = [];

// IDE seems to not understand that WebGL2RenderingContext also contains everything from WebGLRenderingContext
export type WebGLContext = WebGLRenderingContext & WebGL2RenderingContext;

export const initGl = (canvas: HTMLCanvasElement): WebGLContext => {
  const gl = canvas.getContext('webgl2');

  // Depth test
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  // Transparency blend
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ZERO);

  return gl;
};

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

export const bindArrayBuffer = (gl: WebGLRenderingContext, bindLocation: number, buffer: WebGLBuffer) => {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(bindLocation, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(bindLocation);
};

export const bindTexture = (gl: WebGLRenderingContext, bindLocation: WebGLUniformLocation, textureId: TextureID) => {
  gl.activeTexture(gl.TEXTURE0 + textureId);
  gl.bindTexture(gl.TEXTURE_2D, textureAtlas[textureId]);
  gl.uniform1i(bindLocation, textureId);
};

export interface GLObjectBuffers {
  position: WebGLBuffer;
  normal: WebGLBuffer;
  tangent: WebGLBuffer;
  bitangent: WebGLBuffer;
  texture: WebGLBuffer;
  vertexCount: number;
}

export const initObjectBuffers = (gl: WebGLRenderingContext, obj: GLObject): GLObjectBuffers => {
  const position = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, position);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.vertices), gl.STATIC_DRAW);

  const normal = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normal);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.normals), gl.STATIC_DRAW);

  const tangent = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tangent);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.tangents), gl.STATIC_DRAW);

  const bitangent = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bitangent);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.bitangents), gl.STATIC_DRAW);

  const texture = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texture);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.uvs), gl.STATIC_DRAW);

  const { vertexCount } = obj;
  return { position, normal, tangent, bitangent, texture, vertexCount };
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

export const createSolidWhiteTexture = (
  gl: WebGLRenderingContext,
) => createSolidColorTexture(gl, 255, 255, 255);

export const createSolidBlackTexture = (
  gl: WebGLRenderingContext,
) => createSolidColorTexture(gl, 0, 0, 0);

export const createFlatNormalTexture = (
  gl: WebGLRenderingContext,
) => createSolidColorTexture(gl, 127, 127, 255);

export const loadTexture = (gl: WebGLRenderingContext, url: string): Promise<number> => {
  const texture = gl.createTexture();

  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

      gl.generateMipmap(gl.TEXTURE_2D);

      textureAtlas.push(texture);
      resolve(textureAtlas.length - 1);
    };
    image.src = url;
  });
};
