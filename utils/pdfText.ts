import zlib from 'zlib';

/**
 * Reads the visible text out of a PDF without a parsing library.
 *
 * The PDFs the app prints embed subset fonts with Identity-H encoding, so the content stream
 * holds glyph ids rather than characters - "Cleaning" is written as <001500160006...>. Each
 * font carries a ToUnicode CMap that maps those ids back to characters, and the mapping is
 * per font: the same id is a different character in the bold and the regular subset. Text is
 * therefore decoded through the CMap of whichever font was last selected with Tf.
 */

type CharMap = Record<number, string>;

/** Splits the file into its indirect objects, keyed by object number. */
function readObjects(pdf: Buffer): Record<string, string> {
  const raw = pdf.toString('latin1');
  const objects: Record<string, string> = {};

  const objectPattern = /(\d+)\s+0\s+obj([\s\S]*?)endobj/g;
  let match: RegExpExecArray | null;
  while ((match = objectPattern.exec(raw))) {
    objects[match[1]] = match[2];
  }
  return objects;
}

/** Returns an object's stream, inflated when it is stored compressed. */
function readStream(object: string): string {
  const start = object.indexOf('stream');
  if (start < 0) return '';

  let from = start + 'stream'.length;
  if (object[from] === '\r') from++;
  if (object[from] === '\n') from++;

  const body = Buffer.from(object.slice(from, object.lastIndexOf('endstream')), 'latin1');
  if (!/FlateDecode/.test(object)) return body.toString('latin1');

  try {
    return zlib.inflateSync(body).toString('latin1');
  } catch {
    try {
      return zlib.inflateRawSync(body).toString('latin1');
    } catch {
      return '';
    }
  }
}

/** Turns a ToUnicode CMap into a glyph id -> character lookup. */
function readCharMap(cmap: string): CharMap {
  const map: CharMap = {};

  const singlesPattern = /beginbfchar([\s\S]*?)endbfchar/g;
  let block: RegExpExecArray | null;
  while ((block = singlesPattern.exec(cmap))) {
    const pairPattern = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g;
    let pair: RegExpExecArray | null;
    while ((pair = pairPattern.exec(block[1]))) {
      let character = '';
      for (let i = 0; i < pair[2].length; i += 4) {
        character += String.fromCharCode(parseInt(pair[2].substr(i, 4), 16));
      }
      map[parseInt(pair[1], 16)] = character;
    }
  }

  const rangesPattern = /beginbfrange([\s\S]*?)endbfrange/g;
  while ((block = rangesPattern.exec(cmap))) {
    const rangePattern = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g;
    let range: RegExpExecArray | null;
    while ((range = rangePattern.exec(block[1]))) {
      const first = parseInt(range[1], 16);
      const last = parseInt(range[2], 16);
      const target = parseInt(range[3], 16);
      for (let id = first; id <= last; id++) {
        map[id] = String.fromCharCode(target + (id - first));
      }
    }
  }
  return map;
}

/** Maps each font resource name used by the page - /F2, /F3 - to its character lookup. */
function readFontMaps(objects: Record<string, string>): Record<string, CharMap> {
  const fontMaps: Record<string, CharMap> = {};

  for (const object of Object.values(objects)) {
    const fontResources = /\/Font\s*<<([\s\S]*?)>>/.exec(object);
    if (!fontResources) continue;

    const referencePattern = /\/(\w+)\s+(\d+)\s+0\s+R/g;
    let reference: RegExpExecArray | null;
    while ((reference = referencePattern.exec(fontResources[1]))) {
      const toUnicode = /\/ToUnicode\s+(\d+)\s+0\s+R/.exec(objects[reference[2]] || '');
      if (toUnicode && objects[toUnicode[1]]) {
        fontMaps[reference[1]] = readCharMap(readStream(objects[toUnicode[1]]));
      }
    }
  }
  return fontMaps;
}

function decodeGlyphs(hex: string, map: CharMap | undefined): string {
  let text = '';
  for (let i = 0; i < hex.length; i += 4) {
    const glyphId = parseInt(hex.substr(i, 4), 16);
    text += map?.[glyphId] ?? '';
  }
  return text;
}

/**
 * Returns the PDF's text, one line per BT/ET text block - which is how the generator lays out
 * each label, cell and heading, so a line here is a value on the printed page.
 *
 * Text blocks are read rather than the stream as a whole because a content stream also holds
 * bracketed dash arrays for its table rules; scanning for brackets across the whole stream
 * runs straight through the Tf operators between them and decodes text with the wrong font.
 */
export function extractPdfText(pdf: Buffer): string[] {
  const objects = readObjects(pdf);
  const fontMaps = readFontMaps(objects);
  const lines: string[] = [];

  for (const object of Object.values(objects)) {
    const stream = readStream(object);
    if (!stream.includes('BT')) continue;

    const blockPattern = /BT([\s\S]*?)ET/g;
    let block: RegExpExecArray | null;
    while ((block = blockPattern.exec(stream))) {
      let map: CharMap | undefined;
      let line = '';

      const tokenPattern = /\/(\w+)\s+[\d.]+\s+Tf|<([0-9a-fA-F]*)>/g;
      let token: RegExpExecArray | null;
      while ((token = tokenPattern.exec(block[1]))) {
        if (token[1] !== undefined) {
          map = fontMaps[token[1]];
        } else {
          line += decodeGlyphs(token[2], map);
        }
      }

      if (line.trim()) lines.push(line.trim());
    }
  }

  if (lines.length === 0) {
    throw new Error('No text could be read from the PDF');
  }
  return lines;
}
