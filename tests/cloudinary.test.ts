import { describe, it, expect } from 'vitest';
import {
  validateImageUpload,
  uploadComplaintEvidence,
  generateSignedDeliveryUrl,
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_SIZE_BYTES,
} from '@/lib/media/cloudinary';

describe('Cloudinary Secure Asset Management', () => {
  it('validates allowed image formats (JPEG, PNG, WebP) and blocks unsupported ones', () => {
    const validSample = Buffer.from('fake-image-bytes').toString('base64');
    expect(validateImageUpload(validSample, 'image/jpeg').valid).toBe(true);
    expect(validateImageUpload(validSample, 'image/png').valid).toBe(true);
    expect(validateImageUpload(validSample, 'image/webp').valid).toBe(true);

    // Unsupported types
    expect(validateImageUpload(validSample, 'image/gif').valid).toBe(false);
    expect(validateImageUpload(validSample, 'application/pdf').valid).toBe(false);
    expect(validateImageUpload(validSample, 'image/svg+xml').valid).toBe(false);
  });

  it('enforces maximum 5MB image file size threshold', () => {
    // 6 MB buffer
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024);
    const largeBase64 = largeBuffer.toString('base64');
    const result = validateImageUpload(largeBase64, 'image/jpeg');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('5 MB limit');
  });

  it('generates random asset identifiers and stores authenticated metadata', async () => {
    const sampleBytes = Buffer.from('test-complaint-photo-data').toString('base64');
    const metadata = await uploadComplaintEvidence(sampleBytes, 'image/jpeg');

    expect(metadata.publicId).toBeDefined();
    expect(metadata.publicId).toContain('civicresolve_evidence/evidence_');
    expect(metadata.resourceType).toBe('image');
    expect(metadata.format).toBe('jpeg');
    expect(metadata.uploadedAt).toBeDefined();
    expect(metadata.bytes).toBeGreaterThan(0);
  });

  it('generates a signed delivery URL for authenticated access', () => {
    const signedUrl = generateSignedDeliveryUrl('civicresolve_evidence/evidence_sample_123', 'jpg');
    expect(signedUrl).toBeDefined();
    expect(typeof signedUrl).toBe('string');
    expect(signedUrl.length).toBeGreaterThan(10);
  });
});
