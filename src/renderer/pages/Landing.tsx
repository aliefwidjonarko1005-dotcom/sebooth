import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCameraStore, useFrameStore, useAppConfig } from '../stores'
import styles from './Landing.module.css'

const ADMIN_PASSWORD = 'admin123' // Should be configurable

function Landing(): JSX.Element {
    const navigate = useNavigate()
    const { cameras, selectedCamera, setCameras, selectCamera, setConnected, isConnected } = useCameraStore()
    const { frames, setActiveFrame } = useFrameStore()
    const { config } = useAppConfig()

    const [showAdminModal, setShowAdminModal] = useState(false)
    const [adminPassword, setAdminPassword] = useState('')
    const [passwordError, setPasswordError] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [holdProgress, setHoldProgress] = useState(0)
    const [holdTimer, setHoldTimer] = useState<NodeJS.Timeout | null>(null)

    // Fetch cameras on mount
    useEffect(() => {
        const fetchCameras = async (): Promise<void> => {
            try {
                const result = await window.api.camera.list()
                if (result.success && result.data) {
                    setCameras(result.data)
                    if (result.data.length > 0 && !selectedCamera) {
                        selectCamera(result.data[0])
                    }
                }
            } catch (error) {
                console.error('Failed to fetch cameras:', error)
            }
        }

        fetchCameras()
    }, [setCameras, selectCamera, selectedCamera])

    // Handle long press for admin access
    const handleAdminHoldStart = useCallback(() => {
        const timer = setInterval(() => {
            setHoldProgress(prev => {
                if (prev >= 100) {
                    clearInterval(timer)
                    setShowAdminModal(true)
                    return 0
                }
                return prev + 5
            })
        }, 50)
        setHoldTimer(timer)
    }, [])

    const handleAdminHoldEnd = useCallback(() => {
        if (holdTimer) {
            clearInterval(holdTimer)
            setHoldTimer(null)
        }
        setHoldProgress(0)
    }, [holdTimer])

    // Handle camera selection
    const handleCameraSelect = async (e: React.ChangeEvent<HTMLSelectElement>): Promise<void> => {
        const cameraId = e.target.value
        const camera = cameras.find(c => c.id === cameraId)
        if (camera) {
            selectCamera(camera)

            // Try to connect
            const result = await window.api.camera.connect(cameraId)
            setConnected(result.success && result.data === true)
        }
    }

    // Handle start button
    const handleStart = async (): Promise<void> => {
        setIsLoading(true)

        try {
            // Connect to camera if not connected
            if (!isConnected && selectedCamera) {
                const result = await window.api.camera.connect(selectedCamera.id)
                if (!result.success) {
                    console.error('Failed to connect to camera:', result.error)
                }
                setConnected(result.success && result.data === true)
            }

            // Set active frame
            if (config.activeFrameId) {
                setActiveFrame(config.activeFrameId)
            } else if (frames.length > 0) {
                setActiveFrame(frames[0].id)
            }

            // Navigate to frame selection
            navigate('/frames')
        } catch (error) {
            console.error('Failed to start session:', error)
        } finally {
            setIsLoading(false)
        }
    }

    // Handle admin login
    const handleAdminSubmit = (e: React.FormEvent): void => {
        e.preventDefault()
        if (adminPassword === ADMIN_PASSWORD) {
            setShowAdminModal(false)
            setAdminPassword('')
            navigate('/admin')
        } else {
            setPasswordError(true)
            setTimeout(() => setPasswordError(false), 2000)
        }
    }

    return (
        <motion.div
            className={styles.container}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Background Effects */}
            <div className={styles.backgroundGlow} />
            <div className={styles.backgroundGrid} />

            {/* Logo/Branding */}
            <motion.div
                className={styles.branding}
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <h1 className={styles.logo}>
                    <span className="gradient-text">Sebooth</span>
                </h1>
                <p className={styles.tagline}>Premium Photobooth Experience</p>
            </motion.div>

            {/* Main Content */}
            <motion.div
                className={styles.mainContent}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, type: 'spring' }}
            >
                {/* Camera Selection */}
                <div className={styles.cameraSection}>
                    <label className={styles.label}>Select Camera</label>
                    <select
                        className={styles.select}
                        value={selectedCamera?.id || ''}
                        onChange={handleCameraSelect}
                    >
                        <option value="">-- Select Camera --</option>
                        {cameras.map(camera => (
                            <option key={camera.id} value={camera.id}>
                                {camera.name}
                            </option>
                        ))}
                    </select>

                    {selectedCamera && (
                        <div className={styles.cameraStatus}>
                            <span className={`${styles.statusDot} ${isConnected ? styles.connected : ''}`} />
                            {isConnected ? 'Connected' : 'Not Connected'}
                        </div>
                    )}
                </div>

                {/* Start Button */}
                <motion.button
                    className={styles.startButton}
                    onClick={handleStart}
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {isLoading ? (
                        <span className={styles.loader} />
                    ) : (
                        <>
                            <span className={styles.startIcon}>📸</span>
                            <span>Start</span>
                        </>
                    )}
                </motion.button>
            </motion.div>

            {/* Admin Access (Hidden - Long Press) */}
            <div
                className={styles.adminTrigger}
                onMouseDown={handleAdminHoldStart}
                onMouseUp={handleAdminHoldEnd}
                onMouseLeave={handleAdminHoldEnd}
                onTouchStart={handleAdminHoldStart}
                onTouchEnd={handleAdminHoldEnd}
            >
                <div
                    className={styles.adminProgress}
                    style={{ width: `${holdProgress}%` }}
                />
            </div>

            {/* Admin Modal */}
            {showAdminModal && (
                <motion.div
                    className={styles.modalOverlay}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setShowAdminModal(false)}
                >
                    <motion.div
                        className={styles.modal}
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3>Admin Access</h3>
                        <form onSubmit={handleAdminSubmit}>
                            <input
                                type="password"
                                placeholder="Enter password"
                                value={adminPassword}
                                onChange={e => setAdminPassword(e.target.value)}
                                className={`${styles.passwordInput} ${passwordError ? styles.error : ''}`}
                                autoFocus
                            />
                            <button type="submit" className={styles.submitButton}>
                                Enter
                            </button>
                        </form>
                    </motion.div>
                </motion.div>
            )}

            {/* Version */}
            <div className={styles.version}>v1.0.0</div>
        </motion.div>
    )
}

export default Landing
