import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import styles from './GalleryPage.module.css'

interface GalleryData {
    sessionId: string
    photoStrip?: string
    gif?: string
    livePhoto?: string
    photos: string[]
    createdAt: string
}

function GalleryPage(): JSX.Element {
    const [searchParams] = useSearchParams()
    const sessionId = searchParams.get('session')

    const [gallery, setGallery] = useState<GalleryData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'strip' | 'gif' | 'live' | 'photos'>('strip')

    useEffect(() => {
        if (!sessionId) {
            setError('No session ID provided')
            setLoading(false)
            return
        }

        loadGallery(sessionId)
    }, [sessionId])

    const loadGallery = async (id: string): Promise<void> => {
        try {
            if (!isSupabaseConfigured()) {
                setError('Gallery service not configured')
                setLoading(false)
                return
            }

            const supabase = getSupabase()
            if (!supabase) {
                setError('Gallery service not available')
                setLoading(false)
                return
            }

            // Fetch session gallery data
            const { data, error: fetchError } = await supabase
                .from('session_galleries')
                .select('*')
                .eq('session_id', id)
                .single()

            if (fetchError) {
                setError('Gallery not found')
                setLoading(false)
                return
            }

            setGallery({
                sessionId: data.session_id,
                photoStrip: data.photo_strip_url,
                gif: data.gif_url,
                livePhoto: data.live_photo_url,
                photos: data.photo_urls || [],
                createdAt: data.created_at
            })
        } catch (err) {
            setError('Failed to load gallery')
            console.error('Gallery load error:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleDownload = async (url: string, filename: string): Promise<void> => {
        try {
            const response = await fetch(url)
            const blob = await response.blob()
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(link.href)
        } catch (err) {
            console.error('Download error:', err)
            alert('Download failed. Please try again.')
        }
    }

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading your photos...</p>
                </div>
            </div>
        )
    }

    if (error || !gallery) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <span>📷</span>
                    <h2>{error || 'Gallery not found'}</h2>
                    <p>This gallery may have expired or the link is invalid.</p>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>📸 Your Photos</h1>
                <p className={styles.date}>
                    {new Date(gallery.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </p>
            </header>

            <nav className={styles.tabs}>
                {gallery.photoStrip && (
                    <button
                        className={`${styles.tab} ${activeTab === 'strip' ? styles.active : ''}`}
                        onClick={() => setActiveTab('strip')}
                    >
                        🖼️ Photo Strip
                    </button>
                )}
                {gallery.gif && (
                    <button
                        className={`${styles.tab} ${activeTab === 'gif' ? styles.active : ''}`}
                        onClick={() => setActiveTab('gif')}
                    >
                        🎬 GIF
                    </button>
                )}
                {gallery.livePhoto && (
                    <button
                        className={`${styles.tab} ${activeTab === 'live' ? styles.active : ''}`}
                        onClick={() => setActiveTab('live')}
                    >
                        📱 Live Photo
                    </button>
                )}
                {gallery.photos.length > 0 && (
                    <button
                        className={`${styles.tab} ${activeTab === 'photos' ? styles.active : ''}`}
                        onClick={() => setActiveTab('photos')}
                    >
                        📷 Photos ({gallery.photos.length})
                    </button>
                )}
            </nav>

            <main className={styles.content}>
                {activeTab === 'strip' && gallery.photoStrip && (
                    <div className={styles.mediaContainer}>
                        <img src={gallery.photoStrip} alt="Photo Strip" className={styles.mainImage} />
                        <button
                            className={styles.downloadBtn}
                            onClick={() => handleDownload(gallery.photoStrip!, 'photostrip.jpg')}
                        >
                            ⬇️ Download Photo Strip
                        </button>
                    </div>
                )}

                {activeTab === 'gif' && gallery.gif && (
                    <div className={styles.mediaContainer}>
                        <img src={gallery.gif} alt="GIF" className={styles.mainImage} />
                        <button
                            className={styles.downloadBtn}
                            onClick={() => handleDownload(gallery.gif!, 'animation.gif')}
                        >
                            ⬇️ Download GIF
                        </button>
                    </div>
                )}

                {activeTab === 'live' && gallery.livePhoto && (
                    <div className={styles.mediaContainer}>
                        <video
                            src={gallery.livePhoto}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className={styles.mainVideo}
                        />
                        <button
                            className={styles.downloadBtn}
                            onClick={() => handleDownload(gallery.livePhoto!, 'livephoto.mp4')}
                        >
                            ⬇️ Download Live Photo
                        </button>
                    </div>
                )}

                {activeTab === 'photos' && gallery.photos.length > 0 && (
                    <div className={styles.photosGrid}>
                        {gallery.photos.map((photo, index) => (
                            <div key={index} className={styles.photoCard}>
                                <img src={photo} alt={`Photo ${index + 1}`} />
                                <button
                                    className={styles.downloadBtn}
                                    onClick={() => handleDownload(photo, `photo_${index + 1}.jpg`)}
                                >
                                    ⬇️
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <footer className={styles.footer}>
                <p>Powered by Sebooth</p>
            </footer>
        </div>
    )
}

export default GalleryPage
