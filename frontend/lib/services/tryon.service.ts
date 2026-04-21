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
    const resultBase64 = await generateTryOn(
      personImagePath,
      clothingImagePath
    );

    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const resultsDir = path.join(uploadDir, 'results');
    
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const resultFilename = `result_${Date.now()}.jpg`;
    const resultPath = path.join(resultsDir, resultFilename);

    fs.writeFileSync(resultPath, resultBase64, 'base64');

    console.log('[TryOnService] Result saved to:', resultPath);
    return resultPath;
  } catch (error) {
    console.error('[TryOnService] Generation error:', error);
    throw new Error('Failed to generate try-on image');
  }
}
