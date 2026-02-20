import { IpcMain } from 'electron'
import nodemailer from 'nodemailer'
import { config } from 'dotenv'

// Load environment variables
config()

const GMAIL_USER = process.env.GMAIL_USER || ''
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || ''

interface SendEmailParams {
    to: string
    sessionId: string
    galleryUrl: string
    photoStripUrl?: string
    photoUrls?: string[]
}

export function registerEmailHandlers(ipcMain: IpcMain): void {
    ipcMain.handle('email:send', async (_event, params: SendEmailParams) => {
        if (!GMAIL_USER || !GMAIL_APP_PASSWORD || GMAIL_APP_PASSWORD === 'YOUR_GMAIL_APP_PASSWORD_HERE') {
            return {
                success: false,
                error: 'Gmail not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD in .env'
            }
        }

        try {
            // Create transporter with Gmail SMTP
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: GMAIL_USER,
                    pass: GMAIL_APP_PASSWORD
                }
            })

            // Build attachments from URLs
            const attachments: nodemailer.SendMailOptions['attachments'] = []

            // Add photo strip
            if (params.photoStripUrl) {
                attachments.push({
                    filename: 'photo_strip.jpg',
                    path: params.photoStripUrl
                })
            }

            // Add individual photos
            if (params.photoUrls && params.photoUrls.length > 0) {
                for (let i = 0; i < params.photoUrls.length; i++) {
                    attachments.push({
                        filename: `photo_${i + 1}.jpg`,
                        path: params.photoUrls[i]
                    })
                }
            }

            // Email HTML content
            const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1a1a2e;
            color: white;
            padding: 40px;
            text-align: center;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: linear-gradient(135deg, #16213e 0%, #1a1a2e 100%);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 { 
            font-size: 28px;
            margin-bottom: 10px;
        }
        p {
            color: rgba(255,255,255,0.7);
            font-size: 16px;
            line-height: 1.6;
        }
        .gallery-btn {
            display: inline-block;
            padding: 16px 32px;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: white;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid rgba(255,255,255,0.1);
            font-size: 12px;
            color: rgba(255,255,255,0.4);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📸 Your Sebooth Photos!</h1>
        <p>Thank you for using Sebooth! Your photos are attached to this email.</p>
        
        <p>You can also view your photos online, including the Live Photo and GIF preview:</p>
        
        <a href="${params.galleryUrl}" class="gallery-btn">🖼️ View Gallery Online</a>
        
        <p style="font-size: 14px; margin-top: 20px;">
            <strong>Attached Files:</strong><br>
            ${params.photoStripUrl ? '• Photo Strip (photo_strip.jpg)<br>' : ''}
            ${params.photoUrls ? `• ${params.photoUrls.length} Individual Photo(s)<br>` : ''}
        </p>
        
        <div class="footer">
            <p>Session ID: ${params.sessionId}</p>
            <p>Powered by Sebooth 📷</p>
        </div>
    </div>
</body>
</html>
`

            // Send email
            const info = await transporter.sendMail({
                from: `"Sebooth Photos" <${GMAIL_USER}>`,
                to: params.to,
                subject: '📸 Your Sebooth Photos Are Ready!',
                html: htmlContent,
                attachments: attachments.length > 0 ? attachments : undefined
            })

            console.log('Email sent:', info.messageId)
            return { success: true, messageId: info.messageId }
        } catch (err) {
            const error = err as Error
            console.error('Email send error:', error)
            return { success: false, error: error.message }
        }
    })

    // Check if email is configured
    ipcMain.handle('email:is-configured', () => {
        return Boolean(GMAIL_USER && GMAIL_APP_PASSWORD && GMAIL_APP_PASSWORD !== 'YOUR_GMAIL_APP_PASSWORD_HERE')
    })
}
