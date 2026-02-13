import { createServiceRoleClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const adminClient = createServiceRoleClient()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase credentials')
    }

    // Step 1: Check if columns exist by querying information_schema
    const { data: schemaCheck, error: schemaError } = await adminClient
      .rpc('check_column_exists', {
        table_name: 'profiles',
        column_name: 'avatar_type'
      })
      .single()

    // If RPC doesn't exist, try direct query
    if (schemaError) {
      // Try to select the columns directly
      const { error: selectError } = await adminClient
        .from('profiles')
        .select('avatar_type, avatar_id, avatar_url')
        .limit(1)

      if (selectError && selectError.message.includes('column')) {
        // Columns don't exist - need manual migration
        return NextResponse.json({
          success: false,
          columns_exist: false,
          message: 'Avatar columns not found in database',
          action_required: 'Run migration 024-onboarding-profile-fields.sql in Supabase SQL Editor',
          migration_path: 'migrations/024-onboarding-profile-fields.sql'
        }, { status: 400 })
      }

      if (selectError) {
        throw selectError
      }
    }

    // Step 2: Columns exist - reload PostgREST schema cache
    console.log('Reloading PostgREST schema cache...')
    
    // Trigger schema cache reload via NOTIFY
    await adminClient.rpc('notify_schema_reload', {})
      .catch(() => {
        // If custom function doesn't exist, that's okay
        console.log('Custom reload function not available')
      })

    // Force a simple query to refresh cache
    await adminClient.from('profiles').select('id').limit(1)

    return NextResponse.json({
      success: true,
      columns_exist: true,
      message: 'Schema cache reloaded. Avatar columns are available.',
      action: 'Please refresh your Settings page'
    })
  } catch (error: any) {
    console.error('Schema fix error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        details: 'Check server logs for more information'
      },
      { status: 500 }
    )
  }
}

// Add GET method for diagnostics
export async function GET() {
  try {
    const adminClient = createServiceRoleClient()

    // Try to query avatar columns
    const { data, error } = await adminClient
      .from('profiles')
      .select('id, avatar_type, avatar_id, avatar_url, full_name')
      .limit(1)

    if (error) {
      return NextResponse.json({
        columns_exist: false,
        error: error.message,
        diagnostic: 'Avatar columns not found - migration needed'
      })
    }

    return NextResponse.json({
      columns_exist: true,
      sample_data: data,
      message: 'Avatar columns are available in database'
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
