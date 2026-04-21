import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';

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

    console.log('[TryOnService] Result URL:', resultUrl);
    return resultUrl;
  } catch (error) {
    console.error('[TryOnService] Generation error:', error);
    throw new Error('Failed to generate try-on image');
  }
}
