import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';
import { CloudinaryImageMetadata } from '@/types';

// Ensure Cloudinary is configured with server-only environment variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

export const isCloudinaryConfigured = Boolean(
  cloudName &&
  apiKey &&
  apiSecret &&
  cloudName.trim() !== '' &&
  apiKey.trim() !== '' &&
  apiSecret.trim() !== ''
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName?.trim(),
    api_key: apiKey?.trim(),
    api_secret: apiSecret?.trim(),
    secure: true,
  });
}

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validates uploaded image format and file size.
 */
export function validateImageUpload(base64Data: string, mimeType: string = 'image/jpeg'): {
  valid: boolean;
  error?: string;
  buffer?: Buffer;
} {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(mimeType.toLowerCase())) {
    return {
      valid: false,
      error: 'Invalid image type. Only JPEG, PNG, and WebP images are permitted.',
    };
  }

  // Strip prefix if present
  const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(cleanBase64, 'base64');

  if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'Image file size exceeds the 5 MB limit.',
    };
  }

  return { valid: true, buffer };
}

/**
 * Uploads citizen complaint evidence to Cloudinary using an authenticated asset delivery scheme.
 * - Random asset identifiers prevent predictable URLs
 * - type: 'authenticated' restricts access so images are never publicly browsable without a signed delivery URL
 */
export async function uploadComplaintEvidence(
  base64Data: string,
  mimeType: string = 'image/jpeg'
): Promise<CloudinaryImageMetadata> {
  const validation = validateImageUpload(base64Data, mimeType);
  if (!validation.valid || !validation.buffer) {
    throw new Error(validation.error || 'Invalid image upload data.');
  }

  const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
  const dataUri = `data:${mimeType};base64,${cleanBase64}`;

  if (!isCloudinaryConfigured) {
    // Demonstration fallback metadata when Cloudinary credentials are not yet configured in local test
    const randomId = `evidence_${crypto.randomUUID()}`;
    const format = mimeType.split('/')[1] || 'jpg';
    return {
      publicId: `civicresolve_evidence/${randomId}`,
      assetId: `demo_asset_${randomId.substring(0, 8)}`,
      resourceType: 'image',
      format,
      uploadedAt: new Date().toISOString(),
      bytes: validation.buffer.length,
    };
  }

  // Generate a cryptographically random asset identifier
  const randomIdentifier = `evidence_${crypto.randomUUID()}`;

  const uploadResult = await cloudinary.uploader.upload(dataUri, {
    folder: 'civicresolve_evidence',
    public_id: randomIdentifier,
    resource_type: 'image',
    type: 'authenticated', // Authenticated delivery: strictly prevents public access
    overwrite: false,
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  });

  return {
    publicId: uploadResult.public_id,
    assetId: uploadResult.asset_id,
    resourceType: uploadResult.resource_type,
    format: uploadResult.format,
    uploadedAt: uploadResult.created_at || new Date().toISOString(),
    bytes: uploadResult.bytes,
  };
}

/**
 * Generates a temporary cryptographically signed delivery URL for an authenticated Cloudinary asset.
 * MUST only be invoked after verifying that the requesting user owns the complaint or is an authorized admin.
 */
export function generateSignedDeliveryUrl(
  publicId: string,
  format?: string,
  expiresInSeconds: number = 3600
): string {
  if (!publicId) return '';

  if (!isCloudinaryConfigured) {
    // Return sample image in demo offline mode
    return 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80';
  }

  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

  // Cloudinary signed authenticated URL
  return cloudinary.url(publicId, {
    type: 'authenticated',
    sign_url: true,
    secure: true,
    expires_at: expiresAt,
    format,
  });
}
