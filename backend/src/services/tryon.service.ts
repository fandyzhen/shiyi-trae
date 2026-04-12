import { VolcEngineService } from './volcengine.service';
import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';

export class TryOnService {
  private volcEngineService: VolcEngineService;
  private uploadDir: string;

  constructor() {
    this.volcEngineService = new VolcEngineService();
    this.uploadDir = process.env.UPLOAD_DIR || './uploads';
    this.ensureUploadDir();
  }

  private ensureUploadDir() {
    const dirs = ['persons', 'clothings', 'results'];
    dirs.forEach(dir => {
      const fullPath = path.join(this.uploadDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  private getImageHash(imagePath: string): string {
    const fileBuffer = fs.readFileSync(imagePath);
    return createHash('md5').update(fileBuffer).digest('hex');
  }

  async generateTryOn(
    personImagePath: string,
    clothingImagePath: string,
    keepOriginalClothing: boolean,
    stylePreference?: string
  ): Promise<string> {
    console.log('[TryOnService] Starting generation with ARK API');
    console.log('[TryOnService] Keep original clothing:', keepOriginalClothing);
    console.log('[TryOnService] Style preference:', stylePreference);

    try {
      const resultBase64 = await this.volcEngineService.generateTryOn(
        personImagePath,
        clothingImagePath
      );

      const resultFilename = `result_${Date.now()}.jpg`;
      const resultPath = path.join(this.uploadDir, 'results', resultFilename);

      fs.writeFileSync(resultPath, resultBase64, 'base64');

      console.log('[TryOnService] Result saved to:', resultPath);
      return resultPath;
    } catch (error) {
      console.error('[TryOnService] Generation error:', error);
      throw new Error('Failed to generate try-on image');
    }
  }

  async detectClothingType(clothingImagePath: string): Promise<string> {
    return '上衣';
  }

  getClothingImageHash(clothingImagePath: string): string {
    return this.getImageHash(clothingImagePath);
  }
}
