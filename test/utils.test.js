import fs from 'fs';
import os from 'os';
import path from 'path';

import { readFile } from '../src/utils/file-utils.js';
import ImageUtils from '../src/utils/image-utils.js';
import StringUtils from '../src/utils/string-utils.js';
import TimeUtils from '../src/utils/time-utils.js';

describe('File Utils', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bubble-tools-utils-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('reads a utf8 file by default', () => {
    const filename = path.join(tempDir, 'plain.txt');
    fs.writeFileSync(filename, 'hello');

    expect(readFile(filename)).toBe('hello');
  });

  it('parses json when requested', () => {
    const filename = path.join(tempDir, 'data.json');
    fs.writeFileSync(filename, JSON.stringify({ ok: true, count: 2 }));

    expect(readFile(filename, 'fixture', { json: true })).toEqual({ ok: true, count: 2 });
  });

  it('throws when the file does not exist', () => {
    expect(() => {
      readFile(path.join(tempDir, 'missing.txt'), 'fixture');
    }).toThrow('fixture does not exist');
  });

  it('throws when json parsing fails', () => {
    const filename = path.join(tempDir, 'bad.json');
    fs.writeFileSync(filename, '{bad json');

    expect(() => {
      readFile(filename, 'fixture', { json: true });
    }).toThrow('fixture is not valid json');
  });
});

describe('Image Utils', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bubble-tools-image-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('encodes an image file as a data uri', async () => {
    const filename = path.join(tempDir, 'pixel.png');
    fs.writeFileSync(filename, Buffer.from([0x89, 0x50, 0x4e, 0x47]));

    await expect(ImageUtils.imageFileToBase64(filename)).resolves.toBe('data:image/png;base64,iVBORw==');
  });

});

describe('String Utils', () => {
  it('capitalises the first letter of a string', () => {
    expect(StringUtils.capitalise('bubble')).toBe('Bubble');
  });

  it('capitalises all words in a string', () => {
    expect(StringUtils.capitaliseAllWords('bubble protocol tools')).toBe('Bubble Protocol Tools');
  });

  it('pluralises with and without the numeric prefix', () => {
    expect(StringUtils.pluralise('file', 1)).toBe('file');
    expect(StringUtils.pluralise('file', 2)).toBe('files');
    expect(StringUtils.pluralise('file', 2, true)).toBe('2 files');
  });

  it('detects mime types from file extensions', () => {
    expect(StringUtils.getMimeType('photo.jpeg')).toBe('image/jpeg');
    expect(StringUtils.getMimeType('clip.mp4')).toBe('video/mp4');
    expect(StringUtils.getMimeType('archive.bin')).toBe('unknown');
  });

  it('converts text to a zero-left-padded uint8 array', () => {
    expect(Array.from(StringUtils.textToUint8Array('AB', 4))).toEqual([0, 0, 65, 66]);
  });

  it('converts hex strings to uint8 arrays with left padding', () => {
    expect(Array.from(StringUtils.hexToUint8Array('0x0a0b', 4))).toEqual([0, 0, 10, 11]);
    expect(Array.from(StringUtils.hexToUint8Array('0a0b'))).toEqual([10, 11]);
  });

  it('converts uint8 arrays to hex', () => {
    expect(StringUtils.uint8ArrayToHex(new Uint8Array([10, 11, 255]))).toBe('0a0bff');
  });

  it('rejects non-uint8 arrays when converting to hex', () => {
    expect(() => {
      StringUtils.uint8ArrayToHex([10, 11]);
    }).toThrow('uint8ArrayToHex: value is not a uint8Array');
  });

  it('converts unsigned integers to fixed-length uint8 arrays', () => {
    expect(Array.from(StringUtils.uintToUint8Array(513, 4))).toEqual([0, 0, 2, 1]);
  });

  it('round-trips base58 helpers', () => {
    const encodedString = StringUtils.stringToBase58('bubble');
    expect(StringUtils.base58ToString(encodedString)).toBe('bubble');

    const encodedUint = StringUtils.uintToBase58(513);
    expect(StringUtils.base58ToUint(encodedUint)).toBe(513);

    const encodedHex = StringUtils.hexToBase58('0x0a0b');
    expect(StringUtils.base58ToHex(encodedHex)).toBe('0x0a0b');
  });

  it('returns undefined for undefined base58 inputs', () => {
    expect(StringUtils.stringToBase58(undefined)).toBeUndefined();
    expect(StringUtils.base58ToString(undefined)).toBeUndefined();
    expect(StringUtils.uintToBase58(undefined)).toBeUndefined();
    expect(StringUtils.base58ToUint(undefined)).toBeUndefined();
    expect(StringUtils.hexToBase58(undefined)).toBeUndefined();
    expect(StringUtils.base58ToHex(undefined)).toBeUndefined();
  });

  it('formats integers and hex strings as fixed-length hex values', () => {
    expect(StringUtils.uintToHex(45, 4)).toBe('0x0000002d');
    expect(StringUtils.uintToHex('0x2d', 4)).toBe('0x0000002d');
  });

  it('returns undefined for falsy or invalid uintToHex inputs', () => {
    expect(StringUtils.uintToHex(0, 4)).toBeUndefined();
    expect(StringUtils.uintToHex('not-a-number', 4)).toBeUndefined();
  });
});

describe('Time Utils', () => {
  it('parses hour, day, and week duration strings to milliseconds', () => {
    expect(TimeUtils.parseDuration('1h')).toBe(3600000);
    expect(TimeUtils.parseDuration('1d')).toBe(86400000);
    expect(TimeUtils.parseDuration('1w')).toBe(604800000);
    expect(TimeUtils.parseDuration('2w3d4h')).toBe(1483200000);
  });

  it('returns undefined for invalid durations', () => {
    expect(TimeUtils.parseDuration('0h')).toBeUndefined();
    expect(TimeUtils.parseDuration('5m')).toBeUndefined();
    expect(TimeUtils.parseDuration('1h2')).toBeUndefined();
  });
});
