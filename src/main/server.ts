import express from 'express'
import cors from 'cors'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, readdirSync } from 'fs'
import { networkInterfaces } from 'os'

let serverInstance: any = null

export function startLocalServer(port = 5050) {
    if (serverInstance) return

    const server = express()
    server.use(cors())

    const documentsPath = app.getPath('documents')
    const sessionsDir = join(documentsPath, 'Sebooth', 'Sessions')

    // Serve static files directly from the Sessions folder
    // E.g., http://<ip>:5050/Session_uuid/photo_1.jpg
    server.use(express.static(sessionsDir))

    // Dynamic Gallery Route
    server.get('/gallery/:sessionId', (req, res) => {
        const { sessionId } = req.params
        const sessionPath = join(sessionsDir, `Session_${sessionId}`)

        if (!existsSync(sessionPath)) {
            return res.status(404).send('Gallery not found or session does not exist.')
        }

        try {
            const files = readdirSync(sessionPath)

            const photoStrip = files.find(f => f.startsWith('strip_'))
            const gif = files.find(f => f.startsWith('gif_'))
            const video = files.find(f => f.startsWith('live_video_'))
            const photos = files.filter(f => f.startsWith('photo_'))

            // Generate beautifully styled mobile-first HTML Gallery
            const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Photobooth Gallery</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background-color: #f3f4f6; 
            color: #1f2937;
            text-align: center;
        }
        .container { max-width: 500px; margin: 0 auto; }
        h1 { font-size: 24px; margin-bottom: 24px; font-weight: 700; }
        .card { 
            background: white; 
            border-radius: 16px; 
            padding: 16px; 
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); 
            margin-bottom: 24px;
        }
        img, video { 
            width: 100%; 
            border-radius: 8px; 
            background: #e5e7eb;
            display: block; 
            margin-bottom: 12px;
        }
        .btn { 
            display: block; 
            width: 100%; 
            padding: 12px; 
            background: #000; 
            color: white; 
            border: none; 
            border-radius: 8px; 
            font-size: 16px; 
            font-weight: 600;
            text-decoration: none;
            box-sizing: border-box;
            cursor: pointer;
        }
        .header-text { margin-bottom: 10px; font-weight: 600; text-align: left; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📸 Your Memories</h1>
        
        ${video ? `
        <div class="card">
            <div class="header-text">Live Photo Strip</div>
            <video src="/Session_${sessionId}/${video}" autoplay loop muted playsinline controls></video>
            <a href="/Session_${sessionId}/${video}" download="${video}" class="btn">Download Video</a>
        </div>
        ` : ''}

        ${photoStrip ? `
        <div class="card">
            <div class="header-text">Photo Strip</div>
            <img src="/Session_${sessionId}/${photoStrip}" alt="Photo Strip" />
            <a href="/Session_${sessionId}/${photoStrip}" download="${photoStrip}" class="btn">Download Strip</a>
        </div>
        ` : ''}

        ${gif ? `
        <div class="card">
            <div class="header-text">Animated GIF</div>
            <img src="/Session_${sessionId}/${gif}" alt="GIF" />
            <a href="/Session_${sessionId}/${gif}" download="${gif}" class="btn">Download GIF</a>
        </div>
        ` : ''}

        ${photos.length > 0 ? `
        <div class="card">
            <div class="header-text">Individual Shots</div>
            <div class="grid">
                ${photos.map(p => `
                <div>
                    <img src="/Session_${sessionId}/${p}" alt="Photo" />
                    <a href="/Session_${sessionId}/${p}" download="${p}" class="btn" style="font-size: 14px; padding: 8px;">Download</a>
                </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Thank you for using Sebooth!
        </p>
    </div>
</body>
</html>`

            res.send(html)

        } catch (err) {
            console.error('Error reading session directory:', err)
            res.status(500).send('Internal Server Error')
        }
    })

    serverInstance = server.listen(port, () => {
        console.log(`Local Sharing Server running on port ${port}`)
    })
}

export function getLocalIpAddress(): string | null {
    const nets = networkInterfaces()
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]!) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                return net.address
            }
        }
    }
    return null
}
