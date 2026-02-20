import { exec } from 'child_process'
import { promisify } from 'util'
import { existsSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { CameraHandler } from './CameraHandler'
import { CameraDevice, CaptureResult } from '@shared/types'

const execAsync = promisify(exec)

/**
 * DigiCamControl Camera Handler
 * Uses digiCamControl CLI for PTP communication on Windows
 * Download: http://digicamcontrol.com/download
 */
export class DigiCamControlCamera extends CameraHandler {
    private digiCamPath: string

    constructor(digiCamPath?: string) {
        super()
        this.digiCamPath = digiCamPath ||
            process.env.DIGICAM_PATH ||
            'C:\\Program Files (x86)\\digiCamControl\\CameraControlCmd.exe'
    }

    private async runCommand(args: string): Promise<string> {
        try {
            const { stdout, stderr } = await execAsync(`"${this.digiCamPath}" ${args}`)
            if (stderr && !stdout) {
                throw new Error(stderr)
            }
            return stdout.trim()
        } catch (error) {
            const err = error as Error
            throw new Error(`DigiCamControl error: ${err.message}`)
        }
    }

    async listCameras(): Promise<CameraDevice[]> {
        try {
            // Check if digiCamControl is available
            const result = await this.runCommand('/c list cameras')
            const lines = result.split('\n').filter(line => line.trim())

            const cameras: CameraDevice[] = lines.map((line, index) => ({
                id: `camera_${index}`,
                name: line.trim(),
                port: 'USB',
                connected: false
            }))

            return cameras
        } catch (error) {
            console.error('Failed to list cameras:', error)
            // Return empty array if digiCamControl is not available or no cameras
            return []
        }
    }

    async connect(cameraId: string): Promise<boolean> {
        try {
            // digiCamControl auto-connects to the first available camera
            const cameras = await this.listCameras()
            const camera = cameras.find(c => c.id === cameraId)

            if (camera) {
                this.currentCamera = { ...camera, connected: true }
                this.connected = true
                return true
            }
            return false
        } catch (error) {
            console.error('Failed to connect to camera:', error)
            return false
        }
    }

    async disconnect(): Promise<void> {
        this.connected = false
        this.currentCamera = null
    }

    async capture(outputPath: string): Promise<CaptureResult> {
        if (!this.connected) {
            return {
                success: false,
                error: 'Camera not connected',
                timestamp: Date.now()
            }
        }

        try {
            // Ensure output directory exists
            const dir = dirname(outputPath)
            if (!existsSync(dir)) {
                mkdirSync(dir, { recursive: true })
            }

            // Trigger capture and save to path
            await this.runCommand(`/c capture /filename "${outputPath}"`)

            // Verify the file was created
            if (existsSync(outputPath)) {
                return {
                    success: true,
                    imagePath: outputPath,
                    timestamp: Date.now()
                }
            } else {
                return {
                    success: false,
                    error: 'Capture completed but file not found',
                    timestamp: Date.now()
                }
            }
        } catch (error) {
            const err = error as Error
            return {
                success: false,
                error: err.message,
                timestamp: Date.now()
            }
        }
    }

    /**
     * Set camera property (ISO, aperture, shutter speed, etc.)
     */
    async setProperty(property: string, value: string): Promise<boolean> {
        try {
            await this.runCommand(`/c set ${property} ${value}`)
            return true
        } catch (error) {
            console.error(`Failed to set ${property}:`, error)
            return false
        }
    }

    /**
     * Get camera property value
     */
    async getProperty(property: string): Promise<string | null> {
        try {
            const result = await this.runCommand(`/c get ${property}`)
            return result
        } catch (error) {
            console.error(`Failed to get ${property}:`, error)
            return null
        }
    }
}
