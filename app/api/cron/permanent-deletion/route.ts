import { createServiceRoleClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Cron job: Permanently delete profiles soft-deleted more than 30 days ago
 * Run: Daily at 3:00 AM
 * Vercel Cron: 0 3 * * *
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminClient = createServiceRoleClient()

  try {
    console.log('[Permanent Deletion Cron] Starting...')

    // Calculate 30 days ago
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const cutoffDate = thirtyDaysAgo.toISOString()

    console.log(`[Permanent Deletion Cron] Cutoff date: ${cutoffDate}`)

    // 1. Find profiles to delete (soft-deleted > 30 days ago)
    const { data: profilesToDelete, error: findError } = await adminClient
      .from('profiles')
      .select('id, full_name, email, deleted_at')
      .not('deleted_at', 'is', null)
      .lt('deleted_at', cutoffDate)

    if (findError) {
      console.error('[Permanent Deletion Cron] Find error:', findError)
      throw findError
    }

    if (!profilesToDelete || profilesToDelete.length === 0) {
      console.log('[Permanent Deletion Cron] No profiles to delete')
      return NextResponse.json({
        success: true,
        deleted_count: 0,
        message: 'No profiles to delete'
      })
    }

    console.log(`[Permanent Deletion Cron] Found ${profilesToDelete.length} profiles to delete`)

    const deletedProfiles: string[] = []

    for (const profile of profilesToDelete) {
      console.log(`[Permanent Deletion Cron] Deleting profile: ${profile.id}`)

      try {
        // Delete profile (CASCADE will handle related records)
        // The profile has foreign key references with ON DELETE CASCADE:
        // - books.owner_id
        // - circle_members.user_id  
        // - borrow_history.borrower_id
        // - notifications.user_id
        // - beta_feedback.user_id
        // - etc.
        const { error: deleteError } = await adminClient
          .from('profiles')
          .delete()
          .eq('id', profile.id)

        if (deleteError) {
          console.error(`[Permanent Deletion Cron] Failed to delete ${profile.id}:`, deleteError)
          continue
        }

        deletedProfiles.push(profile.id)
        console.log(`[Permanent Deletion Cron] ✅ Deleted profile: ${profile.id}`)

      } catch (err) {
        console.error(`[Permanent Deletion Cron] Error deleting ${profile.id}:`, err)
        continue
      }
    }

    console.log(`[Permanent Deletion Cron] Completed. Deleted: ${deletedProfiles.length}/${profilesToDelete.length}`)

    return NextResponse.json({
      success: true,
      deleted_count: deletedProfiles.length,
      attempted_count: profilesToDelete.length,
      deleted_profile_ids: deletedProfiles,
      cutoff_date: cutoffDate
    })

  } catch (error: any) {
    console.error('[Permanent Deletion Cron] Fatal error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Permanent deletion failed',
        success: false 
      },
      { status: 500 }
    )
  }
}
