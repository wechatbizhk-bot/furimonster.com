/* =========================================================================
 * tools/zip.js — a minimal ZIP writer (stored, no compression).
 *
 * Used by tools/build.js for the sticker packs and by
 * _extract/tools/make-deploy-bundle.js for the deploy archive. It lives on its
 * own because the site ships with zero dependencies and the build has no install
 * step, so reaching for archiver or jszip would put a package in the deploy path
 * for no reason. PNG and ZIP contents are already compressed, so storing is the
 * right method and no deflate code is needed.
 * ========================================================================= */
'use strict';

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

/* entries: [{ name: 'path/in/zip', data: Buffer }] */
function zipStore(entries) {
  const parts = [];
  const central = [];
  let offset = 0;

  entries.forEach(e => {
    const name = Buffer.from(e.name, 'utf8');
    const crc = crc32(e.data);
    const len = e.data.length;

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);           // version needed
    local.writeUInt16LE(0x0800, 6);       // flag: names are UTF-8
    local.writeUInt16LE(0, 8);            // method 0 = stored
    local.writeUInt16LE(0, 10);           // mod time
    local.writeUInt16LE(0x21, 12);        // mod date, fixed so rebuilds match
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(len, 18);
    local.writeUInt32LE(len, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    parts.push(local, name, e.data);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0x0800, 8);
    cd.writeUInt16LE(0, 10);
    cd.writeUInt16LE(0, 12);
    cd.writeUInt16LE(0x21, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(len, 20);
    cd.writeUInt32LE(len, 24);
    cd.writeUInt16LE(name.length, 28);
    cd.writeUInt16LE(0, 30);
    cd.writeUInt16LE(0, 32);
    cd.writeUInt16LE(0, 34);
    cd.writeUInt16LE(0, 36);
    cd.writeUInt32LE(0, 38);
    cd.writeUInt32LE(offset, 42);
    central.push(cd, name);

    offset += 30 + name.length + len;
  });

  const cdBuf = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(cdBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat(parts.concat([cdBuf, eocd]));
}

module.exports = { zipStore, crc32 };
