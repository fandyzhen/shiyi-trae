import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

const FROM_EMAIL = 'hello@dzqjiaju.com';
const FROM_NAME = '试衣助手';

export async function sendWelcomeEmail(email: string, username: string): Promise<boolean> {
  if (!resendApiKey) {
    console.warn('[Email] RESEND_API_KEY not configured, skipping email send');
    return false;
  }

  if (!email) {
    console.warn('[Email] Email is empty, skipping email send');
    return false;
  }

  try {
    const resend = new Resend(resendApiKey);

    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [email],
      subject: '欢迎加入 LUXE TRYON！',
      html: `
        <!DOCTYPE html>
        <html>
          <body>
            <h1>欢迎你的加入！</h1>
            <p>你好，<strong>${username}</strong>！</p>
            <p>感谢注册 LUXE TRYON，现在可以开始你的试衣体验了。</p>
            <p>
              <a href="http://test.dzqjiaju.com" style="background-color: #f59e0b; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">
                👉 点击这里开始试衣
              </a>
            </p>
            <br>
            <hr>
            <p style="color: #666; font-size: 14px;">LUXE TRYON</p>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('[Email] Failed to send welcome email:', error);
      return false;
    }

    console.log('[Email] Welcome email sent successfully to', email, data?.id);
    return true;
  } catch (error) {
    console.error('[Email] Exception when sending welcome email:', error);
    return false;
  }
}
