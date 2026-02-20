import { PrinterDevice, PrintResult } from '@shared/types'

// Conditional import for pdf-to-printer (Windows)
let pdfToPrinter: typeof import('pdf-to-printer') | null = null

/**
 * PrinterHandler - Manages silent printing operations
 * Uses pdf-to-printer on Windows for dialog-free printing
 */
export class PrinterHandler {
    private initialized: boolean = false

    constructor() {
        this.initialize()
    }

    private async initialize(): Promise<void> {
        try {
            if (process.platform === 'win32') {
                pdfToPrinter = await import('pdf-to-printer')
            }
            this.initialized = true
        } catch (error) {
            console.error('Failed to initialize printer module:', error)
        }
    }

    /**
     * Get list of available printers
     */
    async listPrinters(): Promise<PrinterDevice[]> {
        try {
            if (!pdfToPrinter) {
                await this.initialize()
            }

            if (pdfToPrinter) {
                const printers = await pdfToPrinter.getPrinters()
                return printers.map(printer => ({
                    name: printer.name,
                    isDefault: printer.isDefault || false
                }))
            }

            return []
        } catch (error) {
            console.error('Failed to list printers:', error)
            return []
        }
    }

    /**
     * Get the default printer
     */
    async getDefaultPrinter(): Promise<PrinterDevice | null> {
        const printers = await this.listPrinters()
        return printers.find(p => p.isDefault) || printers[0] || null
    }

    /**
     * Print an image file silently (no dialog)
     */
    async print(filePath: string, printerName?: string): Promise<PrintResult> {
        try {
            if (!pdfToPrinter) {
                await this.initialize()
            }

            if (!pdfToPrinter) {
                return {
                    success: false,
                    error: 'Printer module not available'
                }
            }

            const options: { printer?: string } = {}
            if (printerName) {
                options.printer = printerName
            }

            await pdfToPrinter.print(filePath, options)

            return { success: true }
        } catch (error) {
            const err = error as Error
            return {
                success: false,
                error: err.message
            }
        }
    }

    /**
     * Print with specific options
     */
    async printWithOptions(
        filePath: string,
        options: {
            printer?: string
            copies?: number
            scale?: 'fit' | 'noscale'
        }
    ): Promise<PrintResult> {
        try {
            if (!pdfToPrinter) {
                await this.initialize()
            }

            if (!pdfToPrinter) {
                return {
                    success: false,
                    error: 'Printer module not available'
                }
            }

            await pdfToPrinter.print(filePath, {
                printer: options.printer,
                scale: options.scale
            })

            // Handle multiple copies
            if (options.copies && options.copies > 1) {
                for (let i = 1; i < options.copies; i++) {
                    await pdfToPrinter.print(filePath, {
                        printer: options.printer,
                        scale: options.scale
                    })
                }
            }

            return { success: true }
        } catch (error) {
            const err = error as Error
            return {
                success: false,
                error: err.message
            }
        }
    }
}

// Singleton instance
export const printerHandler = new PrinterHandler()
