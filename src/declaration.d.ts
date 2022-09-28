declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.hdr' {
  const content: string;
  export default content;
}

declare module '*.vert' {
  const content: string;
  export default content;
}

declare module '*.frag' {
  const content: string;
  export default content;
}

declare module '*.obj' {
  const content: string;
  export default content;
}

declare module 'parse-hdr' {
  export interface Hdr {
    shape: [number, number],
    exposure: number,
    gamma: number,
    data: Float32Array,
  }

  function parseHdr(buffer: Uint8Array): Hdr;
  export default parseHdr;
}
