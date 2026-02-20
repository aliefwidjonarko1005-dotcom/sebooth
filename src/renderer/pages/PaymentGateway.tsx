import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import QRCode from 'react-qr-code'
import { useFrameStore, useAppConfig, useSessionStore } from '../stores'
import { SessionTimer } from '../components/SessionTimer'
import styles from './PaymentGateway.module.css'

interface PaymentState {
    status: 'idle' | 'pending' | 'success' | 'failed' | 'expired'
    orderId: string | null
    qrisUrl: string | null
    transactionId: string | null
}

function PaymentGateway(): JSX.Element {
    const navigate = useNavigate()
    const { activeFrame } = useFrameStore()
    const { config } = useAppConfig()
    const { startSession } = useSessionStore()

    const [additionalPrints, setAdditionalPrints] = useState(0)
    const [payment, setPayment] = useState<PaymentState>({
        status: 'idle',
        orderId: null,
        qrisUrl: null,
        transactionId: null
    })
    const [isCreatingOrder, setIsCreatingOrder] = useState(false)
    const [pollInterval, setPollInterval] = useState<ReturnType<typeof setInterval> | null>(null)

    // Calculate total price
    const totalPrice = config.sessionPrice + (additionalPrints * config.additionalPrintPrice)

    // Handle print quantity change (multiples of 2)
    const handlePrintChange = (delta: number): void => {
        setAdditionalPrints(prev => Math.max(0, prev + delta))
    }

    // Create Midtrans QRIS order
    const createOrder = async (): Promise<void> => {
        if (!config.midtransServerKey) {
            alert('Midtrans Server Key belum dikonfigurasi di Admin Panel')
            return
        }

        setIsCreatingOrder(true)
        const orderId = `SEBOOTH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        try {
            // Create Midtrans transaction
            const auth = btoa(`${config.midtransServerKey}:`)
            const response = await fetch('https://api.sandbox.midtrans.com/v2/charge', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${auth}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    payment_type: 'qris',
                    transaction_details: {
                        order_id: orderId,
                        gross_amount: totalPrice
                    },
                    qris: {
                        acquirer: 'gopay'
                    }
                })
            })

            const data = await response.json()

            if (data.actions && data.actions[0]) {
                const qrisAction = data.actions.find((a: { name: string }) => a.name === 'generate-qr-code')
                setPayment({
                    status: 'pending',
                    orderId: orderId,
                    qrisUrl: qrisAction?.url || data.actions[0].url,
                    transactionId: data.transaction_id
                })

                // Start polling for payment status
                startPolling(orderId)
            } else if (data.status_code === '201' || data.status_code === '200') {
                // For some responses, QR code might be in different format
                setPayment({
                    status: 'pending',
                    orderId: orderId,
                    qrisUrl: data.qr_string || null,
                    transactionId: data.transaction_id
                })
                startPolling(orderId)
            } else {
                throw new Error(data.status_message || 'Failed to create order')
            }
        } catch (err) {
            console.error('Payment error:', err)
            setPayment(prev => ({ ...prev, status: 'failed' }))
            alert('Gagal membuat pembayaran: ' + (err as Error).message)
        } finally {
            setIsCreatingOrder(false)
        }
    }

    // Poll for payment status
    const startPolling = (orderId: string): void => {
        if (pollInterval) clearInterval(pollInterval)

        const interval = setInterval(async () => {
            try {
                const auth = btoa(`${config.midtransServerKey}:`)
                const response = await fetch(
                    `https://api.sandbox.midtrans.com/v2/${orderId}/status`,
                    {
                        headers: {
                            'Authorization': `Basic ${auth}`,
                            'Accept': 'application/json'
                        }
                    }
                )
                const data = await response.json()

                if (data.transaction_status === 'settlement' || data.transaction_status === 'capture') {
                    clearInterval(interval)
                    setPollInterval(null)
                    setPayment(prev => ({ ...prev, status: 'success' }))

                    // Start session and navigate to capture
                    setTimeout(() => {
                        if (activeFrame) {
                            startSession(activeFrame.id)
                        }
                        navigate('/capture')
                    }, 2000)
                } else if (data.transaction_status === 'expire' || data.transaction_status === 'cancel') {
                    clearInterval(interval)
                    setPollInterval(null)
                    setPayment(prev => ({ ...prev, status: 'expired' }))
                }
            } catch (err) {
                console.error('Status check error:', err)
            }
        }, 3000) // Check every 3 seconds

        setPollInterval(interval)
    }

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollInterval) clearInterval(pollInterval)
        }
    }, [pollInterval])

    // Handle timeout
    const handleTimeout = useCallback((): void => {
        if (pollInterval) clearInterval(pollInterval)
        navigate('/')
    }, [pollInterval, navigate])

    // Handle back
    const handleBack = (): void => {
        if (pollInterval) clearInterval(pollInterval)
        navigate('/frames')
    }

    // Handle skip (for testing)
    const handleSkip = (): void => {
        if (activeFrame) {
            startSession(activeFrame.id)
        }
        navigate('/capture')
    }

    if (!activeFrame) {
        return (
            <div className={styles.container}>
                <div className={styles.noFrame}>
                    <h2>No Frame Selected</h2>
                    <button onClick={() => navigate('/frames')}>Select Frame</button>
                </div>
            </div>
        )
    }

    return (
        <motion.div
            className={styles.container}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <SessionTimer
                duration={config.paymentTimeout}
                onTimeout={handleTimeout}
                enabled={config.sessionTimerEnabled}
                label="Payment"
            />

            <div className={styles.content}>
                <header className={styles.header}>
                    <button onClick={handleBack} className={styles.backBtn}>
                        ← Back
                    </button>
                    <h1>💳 Payment</h1>
                </header>

                <div className={styles.mainContent}>
                    {/* Left - Price Summary */}
                    <div className={styles.priceSection}>
                        <h2>Order Summary</h2>

                        <div className={styles.priceItem}>
                            <span>Session (1x 4R print)</span>
                            <span>Rp {config.sessionPrice.toLocaleString('id-ID')}</span>
                        </div>

                        <div className={styles.printSelector}>
                            <span>Additional Prints (per 2)</span>
                            <div className={styles.quantityControls}>
                                <button
                                    onClick={() => handlePrintChange(-2)}
                                    disabled={additionalPrints === 0}
                                >
                                    −
                                </button>
                                <span>{additionalPrints}</span>
                                <button onClick={() => handlePrintChange(2)}>+</button>
                            </div>
                        </div>

                        {additionalPrints > 0 && (
                            <div className={styles.priceItem}>
                                <span>Extra prints ({additionalPrints}x)</span>
                                <span>Rp {(additionalPrints * config.additionalPrintPrice).toLocaleString('id-ID')}</span>
                            </div>
                        )}

                        <div className={styles.priceDivider}></div>

                        <div className={styles.totalPrice}>
                            <span>Total</span>
                            <span>Rp {totalPrice.toLocaleString('id-ID')}</span>
                        </div>

                        {payment.status === 'idle' && (
                            <button
                                className={styles.payButton}
                                onClick={createOrder}
                                disabled={isCreatingOrder}
                            >
                                {isCreatingOrder ? 'Creating Order...' : 'Generate QR Code'}
                            </button>
                        )}
                    </div>

                    {/* Right - QR Code / Status */}
                    <div className={styles.qrSection}>
                        {payment.status === 'idle' && (
                            <div className={styles.qrPlaceholder}>
                                <span>📱</span>
                                <p>Click "Generate QR Code" to start payment</p>
                            </div>
                        )}

                        {payment.status === 'pending' && payment.qrisUrl && (
                            <div className={styles.qrDisplay}>
                                <h3>Scan QRIS</h3>
                                {payment.qrisUrl.startsWith('http') ? (
                                    <img src={payment.qrisUrl} alt="QRIS" className={styles.qrImage} />
                                ) : (
                                    <div className={styles.qrWrapper}>
                                        <QRCode value={payment.qrisUrl} size={256} />
                                    </div>
                                )}
                                <div className={styles.instructions}>
                                    <p>{config.paymentInstructions}</p>
                                </div>
                                <div className={styles.spinner}>
                                    <span></span>
                                    Waiting for payment...
                                </div>
                            </div>
                        )}

                        {payment.status === 'success' && (
                            <div className={styles.successDisplay}>
                                <span className={styles.successIcon}>✓</span>
                                <h3>Payment Successful!</h3>
                                <p>Redirecting to capture...</p>
                            </div>
                        )}

                        {payment.status === 'expired' && (
                            <div className={styles.errorDisplay}>
                                <span>⏰</span>
                                <h3>Payment Expired</h3>
                                <button onClick={() => setPayment({ status: 'idle', orderId: null, qrisUrl: null, transactionId: null })}>
                                    Try Again
                                </button>
                            </div>
                        )}

                        {payment.status === 'failed' && (
                            <div className={styles.errorDisplay}>
                                <span>❌</span>
                                <h3>Payment Failed</h3>
                                <button onClick={() => setPayment({ status: 'idle', orderId: null, qrisUrl: null, transactionId: null })}>
                                    Try Again
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Skip for testing */}
                {import.meta.env.DEV && (
                    <button onClick={handleSkip} className={styles.skipBtn}>
                        [DEV] Skip Payment
                    </button>
                )}
            </div>
        </motion.div>
    )
}

export default PaymentGateway
