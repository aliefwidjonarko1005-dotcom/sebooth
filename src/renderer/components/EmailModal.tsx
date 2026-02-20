import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './EmailModal.module.css'

interface EmailModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (email: string) => Promise<void>
}

export function EmailModal({ isOpen, onClose, onSubmit }: EmailModalProps): JSX.Element {
    const [email, setEmail] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) return

        setIsSubmitting(true)
        try {
            await onSubmit(email)
            onClose()
            setEmail('')
        } catch (error) {
            console.error(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className={styles.overlay}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className={styles.modal}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className={styles.title}>📧 Send Photos to Email</h3>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.inputGroup}>
                                <label htmlFor="email" className={styles.label}>Email Address</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className={styles.input}
                                    autoFocus
                                    required
                                />
                            </div>
                            <div className={styles.actions}>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className={styles.cancelBtn}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={styles.submitBtn}
                                    disabled={!email || isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className={styles.spinner} />
                                            Sending...
                                        </>
                                    ) : (
                                        'Send Email'
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
