import { crc32, deflateSync } from "node:zlib";
import { encode, renderSVG } from "uqr";

/** High ECC + ISO quiet zone so shop-floor prints still scan when scuffed. */
export const REVIEW_QR_ENCODE_OPTIONS = {
  ecc: "H",
  border: 4,
} as const;

export const REVIEW_QR_PIXEL_SIZE = 16;
export const REVIEW_QR_PNG_SCALE = 24;

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function pngChunk(type: string, data: Buffer): Buffer {
  const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(typeAndData) >>> 0);
  return Buffer.concat([length, typeAndData, checksum]);
}

export function encodeReviewQr(url: string) {
  return encode(url, REVIEW_QR_ENCODE_OPTIONS);
}

export function buildReviewQrSvg(url: string): string {
  const svg = renderSVG(url, {
    ...REVIEW_QR_ENCODE_OPTIONS,
    pixelSize: REVIEW_QR_PIXEL_SIZE,
    whiteColor: "#ffffff",
    blackColor: "#000000",
  });

  return (
    `<!-- Encodes ${url} at ECC H. Retarget the /review redirect without reprinting. -->\n` +
    svg.replace("<svg ", '<svg shape-rendering="crispEdges" ') +
    "\n"
  );
}

export function buildReviewQrPng(url: string): Buffer {
  const { data, size } = encodeReviewQr(url);
  const scale = REVIEW_QR_PNG_SCALE;
  const width = size * scale;
  const rows: Buffer[] = [];

  for (let y = 0; y < size; y++) {
    for (let sy = 0; sy < scale; sy++) {
      const row = Buffer.alloc(1 + width * 3);
      for (let x = 0; x < size; x++) {
        const value = data[y][x] ? 0 : 255;
        const start = 1 + x * scale * 3;
        for (let sx = 0; sx < scale; sx++) {
          const i = start + sx * 3;
          row[i] = value;
          row[i + 1] = value;
          row[i + 2] = value;
        }
      }
      rows.push(row);
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(width, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;

  return Buffer.concat([
    PNG_SIGNATURE,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(Buffer.concat(rows), { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}
