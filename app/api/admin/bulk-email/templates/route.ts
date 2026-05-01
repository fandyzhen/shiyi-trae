import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/middleware/auth';
import { getDataSource } from '@/lib/config/database';
import { EmailTemplate } from '@/lib/entities/EmailTemplate';

export async function GET(request: NextRequest) {
  try {
    await verifyAdmin(request.headers);
    const ds = await getDataSource();
    const repo = ds.getRepository(EmailTemplate);
    const templates = await repo.find({ order: { createdAt: 'DESC' } });
    return NextResponse.json({ templates });
  } catch (error: any) {
    console.error('[Templates GET] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await verifyAdmin(request.headers);
    const ds = await getDataSource();
    const repo = ds.getRepository(EmailTemplate);
    const { name, fromEmail, fromName, subject, content } = await request.json();
    if (!name || !subject || !content) {
      return NextResponse.json({ error: '模板名称、标题和内容不能为空' }, { status: 400 });
    }
    const template = repo.create({ name, fromEmail: fromEmail || 'hello@dzqjiaju.com', fromName: fromName || '试衣助手', subject, content });
    await repo.save(template);
    return NextResponse.json({ template });
  } catch (error: any) {
    console.error('[Templates POST] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await verifyAdmin(request.headers);
    const ds = await getDataSource();
    const repo = ds.getRepository(EmailTemplate);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: '缺少模板ID' }, { status: 400 });
    }
    await repo.delete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Templates DELETE] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
