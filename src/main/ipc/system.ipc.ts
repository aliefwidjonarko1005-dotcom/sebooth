import { IpcMain, dialog, app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'fs'
import { APIResponse } from '@shared/types'

/**
 * Register all system-related IPC handlers
 */
export function registerSystemHandlers(ipcMain: IpcMain): void {

    // Open file dialog
    ipcMain.handle('system:open-file-dialog', async (_, options: {
        title?: string
        filters?: { name: string; extensions: string[] }[]
        multiple?: boolean
    }): Promise<APIResponse<string[]>> => {
        try {
            const result = await dialog.showOpenDialog({
                title: options.title || 'Select File',
                filters: options.filters || [{ name: 'All Files', extensions: ['*'] }],
                properties: options.multiple ? ['openFile', 'multiSelections'] : ['openFile']
            })

            if (result.canceled) {
                return { success: true, data: [] }
            }

            return { success: true, data: result.filePaths }
        } catch (error) {
            const err = error as Error
            return { success: false, error: err.message }
        }
    })

    // Get temp folder path
    ipcMain.handle('system:get-temp-path', async (): Promise<APIResponse<string>> => {
        const tempPath = join(app.getPath('userData'), 'temp')

        // Ensure temp folder exists
        if (!existsSync(tempPath)) {
            mkdirSync(tempPath, { recursive: true })
        }

        return { success: true, data: tempPath }
    })

    // Get user data path
    ipcMain.handle('system:get-user-data-path', async (): Promise<APIResponse<string>> => {
        return { success: true, data: app.getPath('userData') }
    })

    // Copy file to destination
    ipcMain.handle('system:copy-file', async (_, source: string, destination: string): Promise<APIResponse<string>> => {
        try {
            // Ensure destination directory exists
            const destDir = join(destination, '..')
            if (!existsSync(destDir)) {
                mkdirSync(destDir, { recursive: true })
            }

            copyFileSync(source, destination)
            return { success: true, data: destination }
        } catch (error) {
            const err = error as Error
            return { success: false, error: err.message }
        }
    })

    // Read JSON file
    ipcMain.handle('system:read-json', async (_, filePath: string): Promise<APIResponse<unknown>> => {
        try {
            if (!existsSync(filePath)) {
                return { success: false, error: 'File not found' }
            }

            const content = readFileSync(filePath, 'utf-8')
            const data = JSON.parse(content)
            return { success: true, data }
        } catch (error) {
            const err = error as Error
            return { success: false, error: err.message }
        }
    })

    // Write JSON file
    ipcMain.handle('system:write-json', async (_, filePath: string, data: unknown): Promise<APIResponse<void>> => {
        try {
            // Ensure directory exists
            const dir = join(filePath, '..')
            if (!existsSync(dir)) {
                mkdirSync(dir, { recursive: true })
            }

            writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
            return { success: true }
        } catch (error) {
            const err = error as Error
            return { success: false, error: err.message }
        }
    })

    // Check if file exists
    ipcMain.handle('system:file-exists', async (_, filePath: string): Promise<APIResponse<boolean>> => {
        return { success: true, data: existsSync(filePath) }
    })

    // Save data URL as file
    ipcMain.handle('system:save-data-url', async (_, dataUrl: string, filename: string): Promise<APIResponse<string>> => {
        try {
            const tempPath = join(app.getPath('userData'), 'temp')

            // Ensure temp folder exists
            if (!existsSync(tempPath)) {
                mkdirSync(tempPath, { recursive: true })
            }

            // Parse data URL
            const matches = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/)
            if (!matches) {
                return { success: false, error: 'Invalid data URL format' }
            }

            const base64Data = matches[2]
            const buffer = Buffer.from(base64Data, 'base64')

            const filePath = join(tempPath, filename)
            writeFileSync(filePath, buffer)

            return { success: true, data: filePath }
        } catch (error) {
            const err = error as Error
            return { success: false, error: err.message }
        }
    })
}
