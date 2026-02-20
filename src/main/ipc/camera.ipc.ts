import { IpcMain, app } from 'electron'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { CameraHandler } from '../handlers/CameraHandler'
import { DigiCamControlCamera } from '../handlers/DigiCamControlCamera'
import { MockCamera } from '../handlers/MockCamera'
import { CameraDevice, CaptureResult, APIResponse } from '@shared/types'

// Use DigiCamControl in production, Mock in development
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let cameraHandler: CameraHandler = isDev
    ? new MockCamera()
    : new DigiCamControlCamera()

/**
 * Switch camera handler implementation
 */
export function setCameraHandler(handler: CameraHandler): void {
    cameraHandler = handler
}

/**
 * Get temp folder path for captured images
 */
function getTempPath(): string {
    return join(app.getPath('userData'), 'temp')
}

/**
 * Register all camera-related IPC handlers
 */
export function registerCameraHandlers(ipcMain: IpcMain): void {

    // List available cameras
    ipcMain.handle('camera:list', async (): Promise<APIResponse<CameraDevice[]>> => {
        try {
            const cameras = await cameraHandler.listCameras()
            return { success: true, data: cameras }
        } catch (error) {
            const err = error as Error
            return { success: false, error: err.message }
        }
    })

    // Connect to a camera
    ipcMain.handle('camera:connect', async (_, cameraId: string): Promise<APIResponse<boolean>> => {
        try {
            const result = await cameraHandler.connect(cameraId)
            return { success: true, data: result }
        } catch (error) {
            const err = error as Error
            return { success: false, error: err.message }
        }
    })

    // Disconnect from current camera
    ipcMain.handle('camera:disconnect', async (): Promise<APIResponse<void>> => {
        try {
            await cameraHandler.disconnect()
            return { success: true }
        } catch (error) {
            const err = error as Error
            return { success: false, error: err.message }
        }
    })

    // Capture a photo
    ipcMain.handle('camera:capture', async (_, slotId?: string): Promise<APIResponse<CaptureResult>> => {
        try {
            const filename = `capture_${slotId || uuidv4()}_${Date.now()}.jpg`
            const outputPath = join(getTempPath(), filename)

            const result = await cameraHandler.capture(outputPath)
            return { success: result.success, data: result, error: result.error }
        } catch (error) {
            const err = error as Error
            return { success: false, error: err.message }
        }
    })

    // Get camera connection status
    ipcMain.handle('camera:status', async (): Promise<APIResponse<{ connected: boolean; camera: CameraDevice | null }>> => {
        return {
            success: true,
            data: {
                connected: cameraHandler.isConnected(),
                camera: cameraHandler.getCurrentCamera()
            }
        }
    })

    // Switch to mock camera (for development/testing)
    ipcMain.handle('camera:use-mock', async (): Promise<APIResponse<void>> => {
        cameraHandler = new MockCamera()
        return { success: true }
    })

    // Switch to real camera
    ipcMain.handle('camera:use-real', async (): Promise<APIResponse<void>> => {
        cameraHandler = new DigiCamControlCamera()
        return { success: true }
    })
}
