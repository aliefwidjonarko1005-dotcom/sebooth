import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { SessionLog, ConfigRecord } from '@shared/types'

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Lazy-initialized Supabase client (only created when actually needed and configured)
let _supabase: SupabaseClient | null = null

export const getSupabase = (): SupabaseClient | null => {
    if (!isSupabaseConfigured()) {
        return null
    }
    if (!_supabase) {
        _supabase = createClient(supabaseUrl, supabaseAnonKey)
    }
    return _supabase
}

// Check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
    return Boolean(supabaseUrl && supabaseAnonKey)
}

// ================================
// Storage Operations
// ================================

/**
 * Upload file to Supabase Storage
 */
export async function uploadFile(
    bucket: string,
    filePath: string,
    file: File | Blob
): Promise<{ url: string } | { error: string }> {
    try {
        if (!isSupabaseConfigured()) {
            return { error: 'Supabase not configured' }
        }

        const supabase = getSupabase()!
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true
            })

        if (error) {
            return { error: error.message }
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(data.path)

        return { url: urlData.publicUrl }
    } catch (err) {
        const error = err as Error
        return { error: error.message }
    }
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFile(
    bucket: string,
    filePath: string
): Promise<{ success: boolean; error?: string }> {
    try {
        if (!isSupabaseConfigured()) {
            return { success: false, error: 'Supabase not configured' }
        }

        const supabase = getSupabase()!
        const { error } = await supabase.storage
            .from(bucket)
            .remove([filePath])

        if (error) {
            return { success: false, error: error.message }
        }

        return { success: true }
    } catch (err) {
        const error = err as Error
        return { success: false, error: error.message }
    }
}

// ================================
// Session Log Operations
// ================================

/**
 * Log a session to the database
 */
export async function logSession(
    session: Omit<SessionLog, 'id' | 'created_at'>
): Promise<{ id: string } | { error: string }> {
    try {
        if (!isSupabaseConfigured()) {
            return { error: 'Supabase not configured' }
        }

        const supabase = getSupabase()!
        const { data, error } = await supabase
            .from('session_logs')
            .insert([session])
            .select('id')
            .single()

        if (error) {
            return { error: error.message }
        }

        return { id: data.id }
    } catch (err) {
        const error = err as Error
        return { error: error.message }
    }
}

/**
 * Get session logs
 */
export async function getSessionLogs(
    limit: number = 50
): Promise<{ data: SessionLog[] } | { error: string }> {
    try {
        if (!isSupabaseConfigured()) {
            return { error: 'Supabase not configured' }
        }

        const supabase = getSupabase()!
        const { data, error } = await supabase
            .from('session_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) {
            return { error: error.message }
        }

        return { data: data || [] }
    } catch (err) {
        const error = err as Error
        return { error: error.message }
    }
}

// ================================
// Config Operations
// ================================

/**
 * Get config by key
 */
export async function getConfig<T>(
    key: string
): Promise<{ data: T } | { error: string }> {
    try {
        if (!isSupabaseConfigured()) {
            return { error: 'Supabase not configured' }
        }

        const supabase = getSupabase()!
        const { data, error } = await supabase
            .from('configs')
            .select('value')
            .eq('key', key)
            .single()

        if (error) {
            return { error: error.message }
        }

        return { data: data.value as T }
    } catch (err) {
        const error = err as Error
        return { error: error.message }
    }
}

/**
 * Set config by key
 */
export async function setConfig(
    key: string,
    value: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
    try {
        if (!isSupabaseConfigured()) {
            return { success: false, error: 'Supabase not configured' }
        }

        const supabase = getSupabase()!
        const { error } = await supabase
            .from('configs')
            .upsert({
                key,
                value,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'key'
            })

        if (error) {
            return { success: false, error: error.message }
        }

        return { success: true }
    } catch (err) {
        const error = err as Error
        return { success: false, error: error.message }
    }
}

/**
 * Get all configs
 */
export async function getAllConfigs(): Promise<{ data: ConfigRecord[] } | { error: string }> {
    try {
        if (!isSupabaseConfigured()) {
            return { error: 'Supabase not configured' }
        }

        const supabase = getSupabase()!
        const { data, error } = await supabase
            .from('configs')
            .select('*')

        if (error) {
            return { error: error.message }
        }

        return { data: data || [] }
    } catch (err) {
        const error = err as Error
        return { error: error.message }
    }
}

// ================================
// Gallery Operations
// ================================

export interface SlotPosition {
    x: number
    y: number
    width: number
    height: number
    rotation: number
}

export interface FrameData {
    canvasWidth: number
    canvasHeight: number
    overlayUrl: string
    slots: SlotPosition[]
}

export interface GalleryInput {
    sessionId: string
    photoStripUrl?: string
    gifUrl?: string
    livePhotoUrl?: string
    photoUrls: string[]
    videoUrls?: string[]  // Video URL for each slot
    frameData?: FrameData  // Frame template data for Live Photo
}

/**
 * Save gallery data to database
 */
export async function saveGallery(
    gallery: GalleryInput
): Promise<{ sessionId: string } | { error: string }> {
    try {
        if (!isSupabaseConfigured()) {
            return { error: 'Supabase not configured' }
        }

        const supabase = getSupabase()!
        const { data, error } = await supabase
            .from('session_galleries')
            .upsert({
                session_id: gallery.sessionId,
                photo_strip_url: gallery.photoStripUrl || null,
                gif_url: gallery.gifUrl || null,
                live_photo_url: gallery.livePhotoUrl || null,
                photo_urls: gallery.photoUrls,
                video_urls: gallery.videoUrls || null,
                frame_data: gallery.frameData || null,
                created_at: new Date().toISOString()
            }, {
                onConflict: 'session_id'
            })
            .select('session_id')
            .single()

        if (error) {
            return { error: error.message }
        }

        return { sessionId: data.session_id }
    } catch (err) {
        const error = err as Error
        return { error: error.message }
    }
}

// ================================
// Session History Operations
// ================================

export interface SessionHistoryItem {
    id: string
    session_id: string
    email?: string
    print_count: number
    gallery_url?: string
    created_at: string
    photo_strip_url?: string
    photo_urls?: string[]
}

/**
 * Update session with email address
 */
export async function updateSessionEmail(
    sessionId: string,
    email: string,
    galleryUrl?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        if (!isSupabaseConfigured()) {
            return { success: false, error: 'Supabase not configured' }
        }

        const supabase = getSupabase()!

        // Update session_galleries with email
        const updateData: Record<string, unknown> = { email }
        if (galleryUrl) {
            updateData.gallery_url = galleryUrl
        }

        const { error } = await supabase
            .from('session_galleries')
            .update(updateData)
            .eq('session_id', sessionId)

        if (error) {
            return { success: false, error: error.message }
        }

        return { success: true }
    } catch (err) {
        const error = err as Error
        return { success: false, error: error.message }
    }
}

/**
 * Increment print count for session
 */
export async function incrementPrintCount(
    sessionId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        if (!isSupabaseConfigured()) {
            return { success: false, error: 'Supabase not configured' }
        }

        const supabase = getSupabase()!

        // Get current print count
        const { data: current } = await supabase
            .from('session_galleries')
            .select('print_count')
            .eq('session_id', sessionId)
            .single()

        const currentCount = current?.print_count || 0

        // Update with incremented count
        const { error } = await supabase
            .from('session_galleries')
            .update({ print_count: currentCount + 1 })
            .eq('session_id', sessionId)

        if (error) {
            return { success: false, error: error.message }
        }

        return { success: true }
    } catch (err) {
        const error = err as Error
        return { success: false, error: error.message }
    }
}

/**
 * Fetch session history for admin dashboard
 */
export async function getSessionHistory(
    options: { limit?: number; offset?: number } = {}
): Promise<{ data: SessionHistoryItem[]; total: number } | { error: string }> {
    try {
        if (!isSupabaseConfigured()) {
            return { error: 'Supabase not configured' }
        }

        const supabase = getSupabase()!
        const limit = options.limit || 50
        const offset = options.offset || 0

        // Get total count
        const { count } = await supabase
            .from('session_galleries')
            .select('*', { count: 'exact', head: true })

        // Get data with pagination
        const { data, error } = await supabase
            .from('session_galleries')
            .select('*')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

        if (error) {
            return { error: error.message }
        }

        const items: SessionHistoryItem[] = (data || []).map(row => ({
            id: row.id,
            session_id: row.session_id,
            email: row.email || undefined,
            print_count: row.print_count || 0,
            gallery_url: row.gallery_url || `https://sebooth-gallery.vercel.app?s=${row.session_id}`,
            created_at: row.created_at,
            photo_strip_url: row.photo_strip_url || undefined,
            photo_urls: row.photo_urls || undefined
        }))

        return { data: items, total: count || 0 }
    } catch (err) {
        const error = err as Error
        return { error: error.message }
    }
}
