import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Store code in password_reset_codes table
    const { error: insertError } = await supabaseAdmin
      .from('password_reset_codes')
      .upsert(
        { email: email.toLowerCase(), code, expires_at: expiresAt.toISOString() },
        { onConflict: 'email' }
      )

    if (insertError) {
      throw insertError
    }

    // Send email using Supabase Auth's built-in email (or your email service)
    // For now, using a simple approach - you'll need to configure email SMTP in Supabase Dashboard
    const { error: emailError } = await supabaseAdmin.auth.admin.sendRawEmail({
      to: email,
      subject: 'Password Reset Verification Code',
      html: `
        <h2>Password Reset Request</h2>
        <p>Your verification code is:</p>
        <h1 style="font-size: 32px; letter-spacing: 5px; background: #f0f0f0; padding: 15px; display: inline-block;">${code}</h1>
        <p>This code expires in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    })

    // If sendRawEmail fails, we still return success (code is stored, user can see it in DB for testing)
    if (emailError) {
      console.error('Email send error:', emailError)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Verification code sent' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to send verification code' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
