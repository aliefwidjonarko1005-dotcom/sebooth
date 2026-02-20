import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import {
    CameraDevice,
    CaptureResult,
    PrinterDevice,
    PrintResult,
    PhotoSlot,
    APIResponse
} from '../shared/types'

// Custom APIs for renderer
const api = {
    // Camera APIs
    camera: {
        list: (): Promise<APIResponse<CameraDevice[]>> =>
            ipcRenderer.invoke('camera:list'),

        connect: (cameraId: string): Promise<APIResponse<boolean>> =>
            ipcRenderer.invoke('camera:connect', cameraId),

        disconnect: (): Promise<APIResponse<void>> =>
            ipcRenderer.invoke('camera:disconnect'),

        capture: (slotId?: string): Promise<APIResponse<CaptureResult>> =>
            ipcRenderer.invoke('camera:capture', slotId),

        status: (): Promise<APIResponse<{ connected: boolean; camera: CameraDevice | null }>> =>
            ipcRenderer.invoke('camera:status'),

        useMock: (): Promise<APIResponse<void>> =>
            ipcRenderer.invoke('camera:use-mock'),

        useReal: (): Promise<APIResponse<void>> =>
            ipcRenderer.invoke('camera:use-real')
    },

    // Printer APIs
    printer: {
        list: (): Promise<APIResponse<PrinterDevice[]>> =>
            ipcRenderer.invoke('printer:list'),

        getDefault: (): Promise<APIResponse<PrinterDevice | null>> =>
            ipcRenderer.invoke('printer:default'),

        print: (filePath: string, printerName?: string): Promise<APIResponse<PrintResult>> =>
            ipcRenderer.invoke('printer:print', filePath, printerName),

        printWithOptions: (
            filePath: string,
            options: { printer?: string; copies?: number; scale?: 'fit' | 'noscale' }
        ): Promise<APIResponse<PrintResult>> =>
            ipcRenderer.invoke('printer:print-with-options', filePath, options)
    },

    // System APIs
    system: {
        openFileDialog: (options: {
            title?: string
            filters?: { name: string; extensions: string[] }[]
            multiple?: boolean
        }): Promise<APIResponse<string[]>> =>
            ipcRenderer.invoke('system:open-file-dialog', options),

        getTempPath: (): Promise<APIResponse<string>> =>
            ipcRenderer.invoke('system:get-temp-path'),

        getUserDataPath: (): Promise<APIResponse<string>> =>
            ipcRenderer.invoke('system:get-user-data-path'),

        copyFile: (source: string, destination: string): Promise<APIResponse<string>> =>
            ipcRenderer.invoke('system:copy-file', source, destination),

        readJson: <T>(filePath: string): Promise<APIResponse<T>> =>
            ipcRenderer.invoke('system:read-json', filePath),

        writeJson: (filePath: string, data: unknown): Promise<APIResponse<void>> =>
            ipcRenderer.invoke('system:write-json', filePath, data),

        fileExists: (filePath: string): Promise<APIResponse<boolean>> =>
            ipcRenderer.invoke('system:file-exists', filePath),

        saveDataUrl: (dataUrl: string, filename: string): Promise<APIResponse<string>> =>
            ipcRenderer.invoke('system:save-data-url', dataUrl, filename)
    },

    // Image APIs
    image: {
        composite: (options: {
            photos: { path: string; slot: PhotoSlot }[]
            framePath: string
            outputPath: string
            canvasWidth: number
            canvasHeight: number
        }): Promise<APIResponse<string>> =>
            ipcRenderer.invoke('image:composite', options),

        resize: (options: {
            inputPath: string
            outputPath: string
            width: number
            height: number
            fit?: 'cover' | 'contain' | 'fill'
        }): Promise<APIResponse<string>> =>
            ipcRenderer.invoke('image:resize', options),

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
        }): Promise<APIResponse<string>> =>
            ipcRenderer.invoke('image:apply-filter', options),

        generateGif: (options: {
            imagePaths: string[]
            outputPath: string
            delay?: number
            width?: number
            height?: number
        }): Promise<APIResponse<string>> =>
            ipcRenderer.invoke('image:generate-gif', options),

        metadata: (imagePath: string): Promise<APIResponse<{
            width: number
            height: number
            format: string
        }>> =>
            ipcRenderer.invoke('image:metadata', imagePath)
    },

    // Email APIs
    email: {
        send: (params: {
            to: string
            sessionId: string
            galleryUrl: string
            photoStripUrl?: string
            photoUrls?: string[]
        }): Promise<{ success: boolean; error?: string; messageId?: string }> =>
            ipcRenderer.invoke('email:send', params),

        isConfigured: (): Promise<boolean> =>
            ipcRenderer.invoke('email:is-configured')
    },

    // Window APIs
    window: {
        toggleFullscreen: (): Promise<boolean> =>
            ipcRenderer.invoke('window:toggle-fullscreen'),

        toggleKiosk: (): Promise<boolean> =>
            ipcRenderer.invoke('window:toggle-kiosk')
    }
}

// Expose APIs to renderer
if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('electron', electronAPI)
        contextBridge.exposeInMainWorld('api', api)
    } catch (error) {
        console.error(error)
    }
} else {
    // @ts-ignore (define in dts)
    window.electron = electronAPI
    // @ts-ignore (define in dts)
    window.api = api
}
