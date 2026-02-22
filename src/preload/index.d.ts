import { ElectronAPI } from '@electron-toolkit/preload'
import {
    CameraDevice,
    CaptureResult,
    PrinterDevice,
    PrintResult,
    PhotoSlot,
    APIResponse
} from '../shared/types'

interface CameraAPI {
    list: () => Promise<APIResponse<CameraDevice[]>>
    connect: (cameraId: string) => Promise<APIResponse<boolean>>
    disconnect: () => Promise<APIResponse<void>>
    capture: (slotId?: string) => Promise<APIResponse<CaptureResult>>
    status: () => Promise<APIResponse<{ connected: boolean; camera: CameraDevice | null }>>
    useMock: () => Promise<APIResponse<void>>
    useReal: () => Promise<APIResponse<void>>
}

interface PrinterAPI {
    list: () => Promise<APIResponse<PrinterDevice[]>>
    getDefault: () => Promise<APIResponse<PrinterDevice | null>>
    print: (filePath: string, printerName?: string) => Promise<APIResponse<PrintResult>>
    printWithOptions: (
        filePath: string,
        options: { printer?: string; copies?: number; scale?: 'fit' | 'noscale' }
    ) => Promise<APIResponse<PrintResult>>
}

interface SystemAPI {
    openFileDialog: (options: {
        title?: string
        filters?: { name: string; extensions: string[] }[]
        multiple?: boolean
    }) => Promise<APIResponse<string[]>>
    getTempPath: () => Promise<APIResponse<string>>
    getLocalIp: () => Promise<APIResponse<string | null>>
    getUserDataPath: () => Promise<APIResponse<string>>
    copyFile: (source: string, destination: string) => Promise<APIResponse<string>>
    readJson: <T>(filePath: string) => Promise<APIResponse<T>>
    writeJson: (filePath: string, data: unknown) => Promise<APIResponse<void>>
    fileExists: (filePath: string) => Promise<APIResponse<boolean>>
    readFileAsBase64: (filePath: string) => Promise<APIResponse<string>>
    saveDataUrl: (dataUrl: string, filename: string) => Promise<APIResponse<string>>
    saveSessionLocally: (params: {
        sessionId: string
        stripDataUrl?: string
        gifDataUrl?: string
        photos: { path: string; filename: string }[]
        videos: { path: string; filename: string }[]
        overlay?: { path: string; filename: string }
        frameConfig?: {
            width: number
            height: number
            slots: { width: number; height: number; x: number; y: number; rotation: number }[]
        }
    }) => Promise<APIResponse<{ path: string; filename: string; mimeType: string }[]>>
    generateHqGif: (framesBase64: string[], delayMs: number) => Promise<APIResponse<string>>
}

interface ImageAPI {
    composite: (options: {
        photos: { path: string; slot: PhotoSlot }[]
        framePath: string
        outputPath: string
        canvasWidth: number
        canvasHeight: number
    }) => Promise<APIResponse<string>>
    resize: (options: {
        inputPath: string
        outputPath: string
        width: number
        height: number
        fit?: 'cover' | 'contain' | 'fill'
    }) => Promise<APIResponse<string>>
    applyFilter: (options: {
        inputPath: string
        outputPath: string
        filter: {
            brightness?: number
            contrast?: number
            saturation?: number
            grayscale?: boolean
            sepia?: boolean
        }
    }) => Promise<APIResponse<string>>
    generateGif: (options: {
        imagePaths: string[]
        outputPath: string
        delay?: number
        width?: number
        height?: number
    }) => Promise<APIResponse<string>>
    metadata: (imagePath: string) => Promise<APIResponse<{
        width: number
        height: number
        format: string
    }>>
}

interface WindowAPI {
    toggleFullscreen: () => Promise<boolean>
    toggleKiosk: () => Promise<boolean>
}

interface EmailAPI {
    send: (params: {
        to: string
        sessionId: string
        galleryUrl: string
        photoStripUrl?: string
        photoUrls?: string[]
    }) => Promise<{ success: boolean; error?: string; messageId?: string }>
    isConfigured: () => Promise<boolean>
}

interface DriveAPI {
    uploadSession: (params: {
        sessionId: string
        files: { path: string; filename: string; mimeType: string }[]
    }) => Promise<{
        success: boolean
        error?: string
        folderUrl?: string
        folderId?: string
        files?: { filename: string; url: string; id: string }[]
    }>
}

interface API {
    camera: CameraAPI
    printer: PrinterAPI
    system: SystemAPI
    image: ImageAPI
    window: WindowAPI
    email: EmailAPI
    drive: DriveAPI
}

declare global {
    interface Window {
        electron: ElectronAPI
        api: API
    }
}
