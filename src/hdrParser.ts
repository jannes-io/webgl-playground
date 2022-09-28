// Modified by jannes-io
// Code ported by Marcin Ignac (2014)
// Based on Java implementation from
// https://code.google.com/r/cys12345-research/source/browse/hdr/image_processor/RGBE.java?r=7d84e9fd866b24079dbe61fa0a966ce8365f5726
const radiancePattern = '#\\?RADIANCE';
const commentPattern = '#.*';
const exposurePattern = 'EXPOSURE=\\s*([0-9]*[.][0-9]*)';
const formatPattern = 'FORMAT=32-bit_rle_rgbe';
const widthHeightPattern = '-Y ([0-9]+) \\+X ([0-9]+)';

function readPixelsRawRLE(
  buffer: Uint8Array,
  data: Uint8Array,
  offset: number,
  fileOffset: number,
  scanlineWidth: number,
  numScanlines: number,
) {
  let rgbe = new Uint8Array(4);
  let scanlineBuffer = null;
  let ptr;
  let ptrEnd;
  let count;
  let buf = new Uint8Array(2);
  let bufferLength = buffer.length;

  // eslint-disable-next-line @typescript-eslint/no-shadow
  function readBuf(buf: Uint8Array) {
    let bytesRead = 0;
    do {
      buf[bytesRead++] = buffer[fileOffset];
    } while (++fileOffset < bufferLength && bytesRead < buf.length);
    return bytesRead;
  }

  // eslint-disable-next-line @typescript-eslint/no-shadow
  function readBufOffset(buf: Uint8Array, offset: number, length: number) {
    let bytesRead = 0;
    do {
      buf[offset + bytesRead++] = buffer[fileOffset];
    } while (++fileOffset < bufferLength && bytesRead < length);
    return bytesRead;
  }

  // eslint-disable-next-line @typescript-eslint/no-shadow
  function readPixelsRaw(data: Uint8Array, offset: number, numpixels: number) {
    const numExpected = 4 * numpixels;
    const numRead = readBufOffset(data, offset, numExpected);
    if (numRead < numExpected) {
      throw new Error('Error reading raw pixels: got ' + numRead + ' bytes, expected ' + numExpected);
    }
  }

  for (let i = 0; i < numScanlines; i++) {
    if (readBuf(rgbe) < rgbe.length) {
      throw new Error('Error reading bytes: expected ' + rgbe.length);
    }

    if ((rgbe[0] != 2) || (rgbe[1] != 2) || ((rgbe[2] & 0x80) != 0)) {
      //this file is not run length encoded
      data[offset++] = rgbe[0];
      data[offset++] = rgbe[1];
      data[offset++] = rgbe[2];
      data[offset++] = rgbe[3];
      readPixelsRaw(data, offset, scanlineWidth * i);
      return;
    }

    if ((((rgbe[2] & 0xFF) << 8) | (rgbe[3] & 0xFF)) != scanlineWidth) {
      throw new Error('Wrong scanline width ' + (((rgbe[2] & 0xFF) << 8) | (rgbe[3] & 0xFF)) + ', expected ' + scanlineWidth);
    }

    if (scanlineBuffer == null) {
      scanlineBuffer = new Uint8Array(4 * scanlineWidth);
    }

    ptr = 0;
    /* read each of the four channels for the scanline into the buffer */
    for (let j = 0; j < 4; j++) {
      ptrEnd = (j + 1) * scanlineWidth;
      while (ptr < ptrEnd) {
        if (readBuf(buf) < buf.length) {
          throw new Error('Error reading 2-byte buffer');
        }
        if ((buf[0] & 0xFF) > 128) {
          /* a run of the same value */
          count = (buf[0] & 0xFF) - 128;
          if ((count == 0) || (count > ptrEnd - ptr)) {
            throw new Error('Bad scanline data');
          }
          while (count-- > 0) {
            scanlineBuffer[ptr++] = buf[1];
          }
        } else {
          /* a non-run */
          count = buf[0] & 0xFF;
          if ((count == 0) || (count > ptrEnd - ptr)) {
            throw new Error('Bad scanline data');
          }
          scanlineBuffer[ptr++] = buf[1];
          if (--count > 0) {
            if (readBufOffset(scanlineBuffer, ptr, count) < count) {
              throw new Error('Error reading non-run data');
            }
            ptr += count;
          }
        }
      }
    }

    /* copy byte data to output */
    for (let j = 0; j < scanlineWidth; j++) {
      data[offset] = scanlineBuffer[j];
      data[offset + 1] = scanlineBuffer[j + scanlineWidth];
      data[offset + 2] = scanlineBuffer[j + 2 * scanlineWidth];
      data[offset + 3] = scanlineBuffer[j + 3 * scanlineWidth];
      offset += 4;
    }
  }
}

//Returns data as floats and flipped along Y by default
function parseHdrExt(buffer: Uint8Array) {
  let fileOffset = 0;
  const bufferLength = buffer.length;

  const NEW_LINE = 10;
  function readLine() {
    let buf = '';
    do {
      const b = buffer[fileOffset];
      if (b == NEW_LINE) {
        ++fileOffset;
        break;
      }
      buf += String.fromCharCode(b);
    } while (++fileOffset < bufferLength);
    return buf;
  }

  let width = 0;
  let height = 0;
  let exposure = 1;
  const gamma = 1;
  let rle = false;

  for (let i = 0; i < 20; i++) {
    const line = readLine();
    let match;
    if (match = line.match(radiancePattern)) {
    } else if (match = line.match(formatPattern)) {
      rle = true;
    } else if (match = line.match(exposurePattern)) {
      exposure = Number(match[1]);
    } else if (match = line.match(commentPattern)) {
    } else if (match = line.match(widthHeightPattern)) {
      height = Number(match[1]);
      width = Number(match[2]);
      break;
    }
  }

  if (!rle) {
    throw new Error('File is not run length encoded!');
  }

  const data = new Uint8Array(width * height * 4);
  readPixelsRawRLE(buffer, data, 0, fileOffset, width, height);

  for (let offset = 0; offset < data.length; offset += 4) {
    let r = data[offset] / 255;
    let g = data[offset + 1] / 255;
    let b = data[offset + 2] / 255;
    const e = data[offset + 3];
    const f = Math.pow(2.0, e - 128.0);

    r *= f;
    g *= f;
    b *= f;

    data[offset] = Math.round(r * 255);
    data[offset + 1] = Math.round(g * 255);
    data[offset + 2] = Math.round(b * 255);
    data[offset + 3] = 1.0;
  }

  return {
    shape: [width, height],
    exposure: exposure,
    gamma: gamma,
    data,
  };
}

const readFileStream = async (file: string) => {
  const response = await fetch(file);
  const reader = response.body.getReader();

  let fullBuffer = new Uint8Array(0);
  const addBuffer = (buffer: Uint8Array) => {
    const size = fullBuffer.length + buffer.length;
    const newBuffer = new Uint8Array(size);
    newBuffer.set(fullBuffer);
    newBuffer.set(buffer, fullBuffer.length);
    fullBuffer = newBuffer;
  };

  return new Promise<Uint8Array>((resolve) => {
    new ReadableStream({
      start: (controller) => {
        const pump = (): Promise<void> => reader.read().then(({ done, value }) => {
          if (done) {
            controller.close();
            resolve(fullBuffer);
            return;
          }
          controller.enqueue(value);
          addBuffer(value);

          return pump();
        });
        pump();
      },
    });
  });
};

export interface Hdr {
  width: number;
  height: number;
  data: Uint8Array;
}

export const parseHdr = async (file: string): Promise<Hdr> => {
  const buffer = await readFileStream(file);
  const hdr = parseHdrExt(buffer);
  return {
    width: hdr.shape[0],
    height: hdr.shape[1],
    data: hdr.data,
  };
};
