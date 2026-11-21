import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

if (!cloudName || !apiKey || !apiSecret) {
  console.error('Missing Cloudinary credentials in environment.');
  process.exit(1);
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

async function runSecurityAudit() {
  console.log('=== SECTION 2: CLOUDINARY IMAGE SECURITY VERIFICATION ===\n');

  // 1. Establish the URL delivery mechanism type
  console.log('1. Analyzing Cloudinary Asset & URL Delivery Mechanism:');
  console.log('   - Uploader delivery type: "authenticated" (Restricted delivery)');
  console.log('   - URL generator options: { type: "authenticated", sign_url: true, secure: true, expires_at: <timestamp> }');
  console.log('   - Exact mechanism classification: "Time-Limited Authenticated Delivery URL" (SHA-based signature with expiration timestamp and authenticated storage access control).\n');

  // 2. Upload a genuine test asset
  console.log('2. Uploading Genuine Test Photograph to Authenticated Storage...');
  const heroBuffer = fs.readFileSync('public/hero.png');
  const dataUri = 'data:image/png;base64,' + heroBuffer.toString('base64');
  const testPublicId = `sec_test_${Date.now()}`;

  const uploadRes = await cloudinary.uploader.upload(dataUri, {
    folder: 'civicresolve_evidence',
    public_id: testPublicId,
    resource_type: 'image',
    type: 'authenticated', // Crucial: authenticated delivery prevents public access
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  });

  const fullPublicId = uploadRes.public_id;
  console.log('   -> Asset created in Cloudinary storage.');
  console.log(`   -> Delivery type confirmed: "${uploadRes.type}"`);
  console.log(`   -> Resource type: "${uploadRes.resource_type}", Format: "${uploadRes.format}", Size: ${uploadRes.bytes} bytes\n`);

  // 3. Test: Unauthenticated public access attempt (trying standard /image/upload/... URL)
  console.log('3. Test: Attempting Public Unauthenticated Retrieval without Signature:');
  const unsignedPublicUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${fullPublicId}.${uploadRes.format}`;
  const unauthRes = await fetch(unsignedPublicUrl);
  console.log(`   -> HTTP Status: ${unauthRes.status} (Expected: 401 or 404 - Access Denied)`);
  const isPublicBlocked = unauthRes.status === 401 || unauthRes.status === 404 || unauthRes.status === 400;
  console.log(`   -> Public access blocked: ${isPublicBlocked ? 'PASS (Protected)' : 'FAIL (Unprotected)'}\n`);

  // 4. Test: Valid Time-Limited Authenticated URL (1-hour expiry)
  console.log('4. Test: Valid Signed Authenticated Delivery URL (1-Hour Validity):');
  const validExpiresAt = Math.floor(Date.now() / 1000) + 3600;
  const validSignedUrl = cloudinary.url(fullPublicId, {
    type: 'authenticated',
    sign_url: true,
    secure: true,
    expires_at: validExpiresAt,
    format: uploadRes.format,
  });

  const validRes = await fetch(validSignedUrl);
  const contentType = validRes.headers.get('content-type');
  const contentLength = validRes.headers.get('content-length');
  const arrayBuffer = await validRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Check magic bytes for PNG: 89 50 4E 47 (0x89, 'P', 'N', 'G')
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;

  console.log(`   -> HTTP Status: ${validRes.status} (Expected: 200 OK)`);
  console.log(`   -> Content-Type: ${contentType} (Expected: image/png)`);
  console.log(`   -> Byte Length: ${buffer.length} bytes (Matches uploaded size: ${buffer.length === uploadRes.bytes})`);
  console.log(`   -> Header Magic Bytes Check: ${isPng ? 'PASS (Genuine PNG file)' : 'FAIL (Not genuine image)'}\n`);

  // 5. Test: Expired Signed URL (Simulating timestamp in the past)
  console.log('5. Test: Expired Signed URL Behavior (Timestamp expired 120 seconds ago):');
  const expiredTimestamp = Math.floor(Date.now() / 1000) - 120;
  const expiredSignedUrl = cloudinary.url(fullPublicId, {
    type: 'authenticated',
    sign_url: true,
    secure: true,
    expires_at: expiredTimestamp,
    format: uploadRes.format,
  });

  const expiredRes = await fetch(expiredSignedUrl);
  console.log(`   -> HTTP Status: ${expiredRes.status} (Expected: 400 or 401 or 403 - URL Expired)`);
  const isExpiredBlocked = expiredRes.status >= 400;
  console.log(`   -> Expired delivery blocked: ${isExpiredBlocked ? 'PASS (Expired URLs cannot be retrieved)' : 'FAIL'}\n`);

  // 6. Test: URL Transformation vs Signature Invalidation
  console.log('6. Test: Image Transformations with vs without Re-signing:');
  // Attempting to append transformation to signed URL without recalculating signature
  const tamperedTransformedUrl = validSignedUrl.replace('/image/authenticated/', '/image/authenticated/w_300,h_300,c_fill/');
  const tamperedRes = await fetch(tamperedTransformedUrl);
  console.log(`   -> Tampered / transformed without re-signing HTTP Status: ${tamperedRes.status} (Expected: 400 or 401 - Signature Mismatch)`);
  const isTamperPrevented = tamperedRes.status >= 400;
  console.log(`   -> Tamper-resistance confirmed: ${isTamperPrevented ? 'PASS (Signatures are tamper-proof)' : 'FAIL'}`);

  // Correct transformed delivery with signature generated on server:
  const legitimatelyTransformedUrl = cloudinary.url(fullPublicId, {
    type: 'authenticated',
    sign_url: true,
    secure: true,
    expires_at: validExpiresAt,
    format: uploadRes.format,
    transformation: [{ width: 300, height: 300, crop: 'fill' }],
  });
  const legitimateRes = await fetch(legitimatelyTransformedUrl);
  console.log(`   -> Server-signed transformed delivery HTTP Status: ${legitimateRes.status} (Expected: 200 OK)`);
  console.log(`   -> Valid server transformation: ${legitimateRes.status === 200 ? 'PASS' : 'FAIL'}\n`);

  // Clean up test asset
  await cloudinary.uploader.destroy(fullPublicId, { type: 'authenticated' });
  console.log('7. Cleanup: Ephemeral security audit test asset destroyed.');
  console.log('\n=== CLOUDINARY SECURITY AUDIT COMPLETE ===');
}

runSecurityAudit().catch(console.error);
