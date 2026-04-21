import { NextRequest } from 'next/server';
import { getDataSource } from '@/lib/config/database';
import { History } from '@/lib/entities/History';
import { verifyToken } from '@/lib/services/auth.service';
import { deductUsage } from '@/lib/services/usage.service';
import { generateTryOn } from '@/lib/services/tryon.service';
import path from 'path';
import fs from 'fs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.split(' ')[1];
    const { userId } = verifyToken(token);

    const formData = await request.formData();
    const personImage = formData.get('personImage') as File | null;
    const clothingImage = formData.get('clothingImage') as File | null;
    const keepOriginalClothing = formData.get('keepOriginalClothing') === 'true';
    const stylePreference = formData.get('stylePreference') as string | null;

    if (!personImage || !clothingImage) {
      return new Response(JSON.stringify({ error: 'Both images are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const sendProgress = (progress: number, message: string) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ progress, message })}\n\n`));
          };

          sendProgress(5, '准备文件...');

          const uploadDir = path.join(process.cwd(), 'public', 'uploads');
          const personsDir = path.join(uploadDir, 'persons');
          const clothingsDir = path.join(uploadDir, 'clothings');
          const resultsDir = path.join(uploadDir, 'results');

          [personsDir, clothingsDir, resultsDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }
          });

          sendProgress(10, '保存人物照片...');
          const personImageBuffer = Buffer.from(await personImage.arrayBuffer());
          const personExt = personImage.name.split('.').pop() || 'jpg';
          const personFilename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${personExt}`;
          const personPath = path.join(personsDir, personFilename);
          fs.writeFileSync(personPath, personImageBuffer);

          sendProgress(20, '保存衣服照片...');
          const clothingImageBuffer = Buffer.from(await clothingImage.arrayBuffer());
          const clothingExt = clothingImage.name.split('.').pop() || 'jpg';
          const clothingFilename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${clothingExt}`;
          const clothingPath = path.join(clothingsDir, clothingFilename);
          fs.writeFileSync(clothingPath, clothingImageBuffer);

          sendProgress(30, '验证使用次数...');
          await deductUsage(userId);

          sendProgress(40, '开始AI试衣生成...');

          sendProgress(50, '处理图片...');
          const resultPath = await generateTryOn(
            personPath,
            clothingPath,
            keepOriginalClothing,
            stylePreference
          );

          sendProgress(80, '生成完成，保存结果...');

          const resultFilename = path.basename(resultPath);
          const resultImageUrl = `/uploads/results/${resultFilename}`;

          const personImageUrl = `/uploads/persons/${personFilename}`;
          const clothingImageUrl = `/uploads/clothings/${clothingFilename}`;

          sendProgress(90, '保存历史记录...');
          const dataSource = await getDataSource();
          const historyRepository = dataSource.getRepository(History);
          const history = historyRepository.create({
            userId,
            personImagePath: personImageUrl,
            clothingImagePath: clothingImageUrl,
            resultImagePath: resultImageUrl,
            keepOriginalClothing,
            stylePreference: stylePreference || undefined,
            createdAt: new Date(),
          });
          await historyRepository.save(history);

          sendProgress(100, '完成！');
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            result: {
              historyId: history.id,
              resultImageUrl: resultImageUrl
            }
          })}\n\n`));
          controller.close();

        } catch (error: any) {
          console.error('Try-on generation error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: error.message || '生成失败' })}\n\n`));
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('Try-on API error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
