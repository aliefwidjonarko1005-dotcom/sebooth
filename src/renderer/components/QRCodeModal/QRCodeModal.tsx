import { useState } from 'react'
import QRCode from 'react-qr-code'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './QRCodeModal.module.css'

interface QRCodeModalProps {
    isOpen: boolean
    onClose: () => void
    photoUrl: string | null
    isGenerating: boolean
}

export function QRCodeModal({ isOpen, onClose, photoUrl, isGenerating }: QRCodeModalProps): JSX.Element | null {
    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                className={styles.overlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className={styles.modal}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    onClick={e => e.stopPropagation()}
                >
                    <button className={styles.closeBtn} onClick={onClose}>
                        ×
                    </button>

                    <h2 className={styles.title}>📱 Scan QR Code</h2>
                    <p className={styles.subtitle}>Scan to view your photo on your device</p>

                    <div className={styles.qrContainer}>
                        {isGenerating ? (
                            <div className={styles.loading}>
                                <span className={styles.spinner}></span>
                                <p>Uploading photo...</p>
                            </div>
                        ) : photoUrl ? (
                            <>
                                <div className={styles.qrWrapper}>
                                    <QRCode
                                        value={photoUrl}
                                        size={320}
                                        level="M"
                                        bgColor="#ffffff"
                                        fgColor="#000000"
                                    />
                                </div>
                                <p className={styles.hint}>
                                    Point your phone camera at this QR code
                                </p>
                            </>
                        ) : (
                            <div className={styles.error}>
                                <span>❌</span>
                                <p>Failed to generate QR code</p>
                                <p className={styles.errorHint}>Please try again or use email option</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
