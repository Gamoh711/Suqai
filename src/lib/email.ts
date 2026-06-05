/**
 * Email abstraction layer
 *
 * Provides an interface for sending emails that can be swapped
 * between providers (ConsoleEmailProvider for dev, SMTP/Mailgun/SendGrid etc. for prod).
 *
 * Usage in code:
 *   import { sendPasswordResetEmail } from "@/lib/email"
 *   await sendPasswordResetEmail(userEmail, resetUrl)
 *
 * To set a custom provider at startup:
 *   import { setEmailProvider, SmtpEmailProvider } from "@/lib/email"
 *   setEmailProvider(new SmtpEmailProvider({ host, port, auth }))
 */

export interface EmailProvider {
  send(to: string, subject: string, body: string): Promise<void>
}

export class ConsoleEmailProvider implements EmailProvider {
  async send(to: string, subject: string, body: string): Promise<void> {
    console.log(`[Email] To: ${to}`)
    console.log(`[Email] Subject: ${subject}`)
    console.log(`[Email] Body:\n${body}`)
  }
}

let provider: EmailProvider | null = null

export function getEmailProvider(): EmailProvider {
  if (!provider) {
    provider = new ConsoleEmailProvider()
  }
  return provider
}

export function setEmailProvider(p: EmailProvider): void {
  provider = p
}

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  const p = getEmailProvider()
  await p.send(
    email,
    "إعادة تعيين كلمة المرور - سوقي",
    `مرحباً،

لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك.

رابط إعادة التعيين (صالحة لمدة 30 دقيقة):
${resetUrl}

إذا لم تطلب ذلك، يرجى تجاهل هذه الرسالة.

شكراً،
فريق سوقي`,
  )
}
