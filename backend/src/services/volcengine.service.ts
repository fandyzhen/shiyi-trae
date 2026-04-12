import axios from 'axios';
import fs from 'fs';
import sharp from 'sharp';
import dotenv from 'dotenv';

dotenv.config();

export class VolcEngineService {
  private volcengineApiKey: string;

  constructor() {
    this.volcengineApiKey = process.env.VOLCENGINE_API_KEY || '';
  }

  private async getImageAspectRatio(imagePath: string): Promise<number> {
    const metadata = await sharp(imagePath).metadata();
    if (!metadata.width || !metadata.height) {
      return 1;
    }
    return metadata.width / metadata.height;
  }

  private getSizeByAspectRatio(aspectRatio: number): string {
    if (aspectRatio >= 1.5) {
      return '2K';
    } else if (aspectRatio <= 0.67) {
      return '2K';
    }
    return '2K';
  }

  private imageToBase64(imagePath: string): string {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64 = imageBuffer.toString('base64');
    const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
    return `data:${mimeType};base64,${base64}`;
  }

  async arkImageGeneration(personImagePath: string, clothingImagePath: string): Promise<string> {
    console.log('[ARK] Starting image generation');
    console.log('[ARK] Person image:', personImagePath);
    console.log('[ARK] Clothing image:', clothingImagePath);

    if (!this.volcengineApiKey) {
      throw new Error('VolcEngine API Key not configured');
    }

    const aspectRatio = await this.getImageAspectRatio(personImagePath);
    console.log('[ARK] Person image aspect ratio:', aspectRatio);

    const personImageBase64 = this.imageToBase64(personImagePath);
    const clothingImageBase64 = this.imageToBase64(clothingImagePath);

    const requestBody = {
      model: 'doubao-seedream-5-0-260128',
      prompt: '将图1的服装换为图2的服装，保持原图人物的面部特征、体型和图片比例，自然真实',
      image: [personImageBase64, clothingImageBase64],
      sequential_image_generation: 'disabled',
      response_format: 'url',
      size: '2K',
      stream: false,
      watermark: true,
    };

    console.log('[ARK] Request body prepared (images in base64)');
    console.log('[ARK] Request body:', JSON.stringify({ ...requestBody, image: ['[base64]', '[base64]'] }, null, 2));

    try {
      const response = await axios.post(
        'https://ark.cn-beijing.volces.com/api/v3/images/generations',
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.volcengineApiKey}`,
          },
        }
      );

      console.log('[ARK] Response status:', response.status);
      console.log('[ARK] Response data:', JSON.stringify(response.data, null, 2));

      if (response.data.data && response.data.data.length > 0) {
        const resultUrl = response.data.data[0].url;
        console.log('[ARK] Generated image URL:', resultUrl);
        return resultUrl;
      }

      throw new Error('No image URL in response');
    } catch (error: any) {
      console.error('[ARK] API error:');
      console.error('[ARK] Error status:', error.response?.status);
      console.error('[ARK] Error data:', JSON.stringify(error.response?.data, null, 2));
      console.error('[ARK] Error message:', error.message);
      
      if (error.response?.data?.error?.message) {
        throw new Error(`ARK API error: ${error.response.data.error.message}`);
      }
      throw new Error(`ARK API error: ${error.message}`);
    }
  }

  async generateTryOn(personImagePath: string, clothingImagePath: string): Promise<string> {
    console.log('========================================');
    console.log('[TryOn] Starting virtual try-on generation');
    console.log('[TryOn] Person image:', personImagePath);
    console.log('[TryOn] Clothing image:', clothingImagePath);
    console.log('========================================');

    try {
      console.log('[TryOn] Calling ARK API for image generation...');
      const resultImageUrl = await this.arkImageGeneration(personImagePath, clothingImagePath);

      console.log('[TryOn] Downloading result image...');
      const imageResponse = await fetch(resultImageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();

      console.log('========================================');
      console.log('[TryOn] Generation complete!');
      console.log('========================================');

      return Buffer.from(imageBuffer).toString('base64');
    } catch (error: any) {
      console.error('========================================');
      console.error('[TryOn] Generation failed!');
      console.error('[TryOn] Error:', error.message);
      console.error('========================================');
      throw error;
    }
  }
}
