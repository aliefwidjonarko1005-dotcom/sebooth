import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useFrameStore, useAppConfig, useSessionStore } from '../stores'
import { SessionTimer } from '../components/SessionTimer'
import styles from './FrameSelection.module.css'

function FrameSelection(): JSX.Element {
    const navigate = useNavigate()
    const { frames, setActiveFrame } = useFrameStore()
    const { config } = useAppConfig()
    const { endSession } = useSessionStore()

    // Clear any existing session when entering frame selection
    // This prevents old photos from persisting after timer timeout
    useEffect(() => {
        endSession()
    }, [endSession])

    // Show only active frames if any are active, otherwise show all
    const displayFrames = config.activeFrameIds.length > 0
        ? frames.filter(f => config.activeFrameIds.includes(f.id))
        : frames

    const handleSelectFrame = (frameId: string): void => {
        setActiveFrame(frameId)
        // Navigate to payment if enabled, otherwise go directly to capture
        if (config.paymentEnabled) {
            navigate('/payment')
        } else {
            navigate('/capture')
        }
    }

    const handleBack = (): void => {
        navigate('/')
    }

    // Session timer timeout handler
    const handleTimeout = (): void => {
        navigate('/')
    }

    return (
        <motion.div
            className={styles.container}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Session Timer Overlay */}
            <SessionTimer
                duration={config.frameSelectionTimeout}
                onTimeout={handleTimeout}
                enabled={config.sessionTimerEnabled}
                label="Frame Selection"
            />
            <header className={styles.header}>
                <button onClick={handleBack} className={styles.backButton}>
                    ← Back
                </button>
                <h1>Select a Frame</h1>
            </header>

            <main className={styles.content}>
                {frames.length === 0 ? (
                    <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}>🖼️</span>
                        <h2>No Frames Available</h2>
                        <p>Please add frames in the Admin Dashboard first.</p>
                        <button onClick={() => navigate('/admin')} className={styles.adminButton}>
                            Go to Admin
                        </button>
                    </div>
                ) : (
                    <div className={styles.frameGrid}>
                        {displayFrames.map((frame, index) => (
                            <motion.div
                                key={frame.id}
                                className={styles.frameCard}
                                onClick={() => handleSelectFrame(frame.id)}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.03, y: -5 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div
                                    className={styles.framePreview}
                                    style={{ aspectRatio: `${frame.canvasWidth} / ${frame.canvasHeight}` }}
                                >
                                    {/* Colored slot indicators behind overlay */}
                                    {frame.slots.map((slot) => {
                                        const slotColors = ['#ef4444', '#3b82f6', '#22c55e', '#f97316', '#eab308', '#a855f7', '#ec4899', '#14b8a6']

                                        // Calculate sequential number (only count non-duplicates)
                                        const nonDuplicateSlots = frame.slots.filter(s => !s.duplicateOfSlotId)
                                        let displayNumber: number
                                        let colorIndex: number

                                        if (slot.duplicateOfSlotId) {
                                            // Duplicate: use source slot's sequential number
                                            const sourceSlot = frame.slots.find(s => s.id === slot.duplicateOfSlotId)
                                            if (sourceSlot) {
                                                displayNumber = nonDuplicateSlots.findIndex(s => s.id === sourceSlot.id) + 1
                                            } else {
                                                displayNumber = 0
                                            }
                                        } else {
                                            // Non-duplicate: sequential position
                                            displayNumber = nonDuplicateSlots.findIndex(s => s.id === slot.id) + 1
                                        }
                                        colorIndex = Math.max(0, displayNumber - 1)
                                        const color = slotColors[colorIndex % slotColors.length]

                                        return (
                                            <div
                                                key={slot.id}
                                                className={styles.slotIndicator}
                                                style={{
                                                    left: `${(slot.x / frame.canvasWidth) * 100}%`,
                                                    top: `${(slot.y / frame.canvasHeight) * 100}%`,
                                                    width: `${(slot.width / frame.canvasWidth) * 100}%`,
                                                    height: `${(slot.height / frame.canvasHeight) * 100}%`,
                                                    transform: `rotate(${slot.rotation}deg)`,
                                                    backgroundColor: color,
                                                    opacity: 0.7
                                                }}
                                            >
                                                <span className={styles.slotNumber}>{displayNumber}</span>
                                            </div>
                                        )
                                    })}
                                    {/* Frame overlay on top */}
                                    <img
                                        src={`file://${frame.overlayPath}`}
                                        alt={frame.name}
                                        className={styles.frameOverlayImage}
                                    />
                                </div>
                                <div className={styles.frameInfo}>
                                    <h3>{frame.name}</h3>
                                    <span>{frame.slots.filter(s => !s.duplicateOfSlotId).length} photo{frame.slots.filter(s => !s.duplicateOfSlotId).length !== 1 ? 's' : ''}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </motion.div>
    )
}

export default FrameSelection
