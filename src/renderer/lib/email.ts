// Email service - uses IPC to send via main process (Gmail SMTP)

export interface SendPhotoEmailParams {
    to: string
    sessionId: string
    galleryUrl: string
    photoStripUrl?: string
    photoUrls?: string[]
}

/**
 * Check if email is configured (Gmail App Password set)
 */
export async function isEmailConfigured(): Promise<boolean> {
    try {
        return await window.api.email.isConfigured()
    } catch {
        return false
    }
}

/**
 * Send photo email with attachments via Gmail SMTP
 */
export async function sendPhotoEmail(params: SendPhotoEmailParams): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
        const result = await window.api.email.send(params)
        return result
    } catch (err) {
        const error = err as Error
        console.error('Email send error:', error)
        return { success: false, error: error.message }
    }
}
