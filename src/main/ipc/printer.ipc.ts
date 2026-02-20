import { IpcMain } from 'electron'
import { printerHandler } from '../handlers/PrinterHandler'
import { PrinterDevice, PrintResult, APIResponse } from '@shared/types'

/**
 * Register all printer-related IPC handlers
 */
export function registerPrinterHandlers(ipcMain: IpcMain): void {

    // List available printers
    ipcMain.handle('printer:list', async (): Promise<APIResponse<PrinterDevice[]>> => {
        try {
            const printers = await printerHandler.listPrinters()
            return { success: true, data: printers }
        } catch (error) {
            const err = error as Error
            return { success: false, error: err.message }
        }
    })

    // Get default printer
    ipcMain.handle('printer:default', async (): Promise<APIResponse<PrinterDevice | null>> => {
        try {
            const printer = await printerHandler.getDefaultPrinter()
            return { success: true, data: printer }
        } catch (error) {
            const err = error as Error
            return { success: false, error: err.message }
        }
    })

    // Print a file silently
    ipcMain.handle('printer:print', async (_, filePath: string, printerName?: string): Promise<APIResponse<PrintResult>> => {
        try {
            const result = await printerHandler.print(filePath, printerName)
            return { success: result.success, data: result, error: result.error }
        } catch (error) {
            const err = error as Error
            return { success: false, error: err.message }
        }
    })

    // Print with options
    ipcMain.handle('printer:print-with-options', async (
        _,
        filePath: string,
        options: { printer?: string; copies?: number; scale?: 'fit' | 'noscale' }
    ): Promise<APIResponse<PrintResult>> => {
        try {
            const result = await printerHandler.printWithOptions(filePath, options)
            return { success: result.success, data: result, error: result.error }
        } catch (error) {
            const err = error as Error
            return { success: false, error: err.message }
        }
    })
}
