import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import { uploadToR2, generateR2Key } from './r2.service';

export function getClothingImageHash(imagePath: string): string {
  const fileBuffer = fs.readFileSync(imagePath);
  return createHash('md5').update(fileBuffer).digest('hex');
}

export function detectClothingType(clothingImagePath: string): Promise<string> {
  return Promise.resolve('上衣');
}

export async function generateTryOn(
  personImagePath: string,
  clothingImagePath: string,
  keepOriginalClothing: boolean,
  userId: string | null,
  stylePreference?: string
): Promise<string> {
  console.log('[TryOnService] Starting generation with ARK API');
  console.log('[TryOnService] Keep original clothing:', keepOriginalClothing);
  console.log('[TryOnService] Style preference:', stylePreference);

  try {
    const { generateTryOn } = await import('./volcengine.service');
    const resultUrl = await generateTryOn(
      personImagePath,
      clothingImagePath
    );

    console.log('[TryOnService] Result URL from Volcengine:', resultUrl);
    
    console.log('[TryOnService] Downloading image from Volcengine...');
    const response = await fetch(resultUrl);
    if (!response.ok) {
      throw new Error('Failed to download image from Volcengine');
    }
    const imageBuffer = Buffer.from(await response.arrayBuffer());
    
    console.log('[TryOnService] Uploading to R2...');
    const r2Key = generateR2Key(userId);
    const r2Url = await uploadToR2(imageBuffer, r2Key);

    console.log('[TryOnService] Final R2 URL:', r2Url);
    return r2Url;
  } catch (error) {
    console.error('[TryOnService] Generation error:', error);
    throw new Error('Failed to generate try-on image');
  }
}
