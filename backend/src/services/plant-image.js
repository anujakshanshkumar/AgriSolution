const sharp = require('sharp');
const AppError = require('../errors/app-error');

function imageFormat(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg';
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'png';
  if (bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}

function isAnimated(bytes, format) {
  if (format === 'png') {
    // APNG may otherwise be decoded as only its first PNG frame by libvips.
    for (let offset = 8; offset + 12 <= bytes.length;) {
      const length = bytes.readUInt32BE(offset);
      if (length > bytes.length - offset - 12) break;
      if (bytes.toString('ascii', offset + 4, offset + 8) === 'acTL') return true;
      offset += length + 12;
    }
  }
  if (format === 'webp') {
    for (let offset = 12; offset + 8 <= bytes.length;) {
      const length = bytes.readUInt32LE(offset + 4);
      if (length > bytes.length - offset - 8) break;
      const chunk = bytes.toString('ascii', offset, offset + 4);
      if (chunk === 'ANIM' || (chunk === 'VP8X' && length > 0 && (bytes[offset + 8] & 2))) return true;
      offset += length + 8 + (length % 2);
    }
  }
  return false;
}

async function validateImage(file, { maxFileSizeBytes = 10 * 1024 * 1024, maxPixels = 25000000 } = {}) {
  if (!file || !Buffer.isBuffer(file.buffer) || !file.buffer.length) throw new AppError(400, 'Choose a JPEG, PNG, or WebP plant photo.');
  if (file.buffer.length > maxFileSizeBytes) throw new AppError(413, 'The image exceeds the configured upload size limit.');
  const format = imageFormat(file.buffer);
  if (!format || file.mimetype !== `image/${format}`) throw new AppError(415, 'The file content must match its JPEG, PNG, or WebP image type.');
  if (isAnimated(file.buffer, format)) throw new AppError(415, 'Animated images are not supported. Choose a single still photo.');
  try {
    const source = sharp(file.buffer, { failOn: 'warning', limitInputPixels: maxPixels, animated: true });
    const metadata = await source.metadata();
    if (metadata.format !== format || !metadata.width || !metadata.height || metadata.width * metadata.height > maxPixels) throw new AppError(400, 'The image is invalid or has too many pixels. Maximum: 25 million pixels.');
    if ((metadata.pages || 1) !== 1) throw new AppError(415, 'Animated images are not supported. Choose a single still photo.');
    // Decode every pixel before resizing; reject truncated/corrupt files. No files are written.
    const { data, info } = await source.rotate().raw().toBuffer({ resolveWithObject: true });
    const buffer = await sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
      .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' }).jpeg({ quality: 90 }).toBuffer();
    // Sharp omits EXIF/location and other metadata unless explicitly requested.
    return { buffer, mimeType: 'image/jpeg' };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(400, 'This image could not be decoded. Choose a clear, undamaged JPEG, PNG, or WebP photo under 25 million pixels.');
  }
}

module.exports = { imageFormat, validateImage };
