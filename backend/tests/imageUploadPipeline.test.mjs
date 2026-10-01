import assert from 'node:assert/strict';
import sharp from 'sharp';
import { validateImageUpload, compressImageForCloudinary } from '../src/services/imageUploadService.js';

const largeImageBuffer = await sharp({
  create: {
    width: 4200,
    height: 2800,
    channels: 3,
    background: { r: 255, g: 245, b: 230 },
  },
})
  .jpeg({ quality: 95 })
  .toBuffer();

const metadata = await validateImageUpload({
  buffer: largeImageBuffer,
  mimetype: 'image/jpeg',
  originalname: 'large-photo.jpg',
});

assert.equal(metadata.format, 'jpeg');

const compressed = await compressImageForCloudinary(largeImageBuffer, 'large-photo.jpg');
assert.ok(compressed.sizeBytes > 0, 'Compressed output should not be empty');
assert.ok(compressed.sizeBytes <= 1024 * 1024, `Compressed output exceeded 1 MB: ${compressed.sizeBytes} bytes`);

await assert.rejects(
  () => validateImageUpload({ buffer: Buffer.from('not an image'), mimetype: 'image/jpeg', originalname: 'invalid.jpg' }),
  /not a valid image|corrupted/i,
);

console.log(`Validation OK. Original size: ${largeImageBuffer.length} bytes; compressed size: ${compressed.sizeBytes} bytes.`);
