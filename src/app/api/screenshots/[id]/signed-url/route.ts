import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

/**
 * GET /api/screenshots/[id]/signed-url
 * 
 * Génère une URL signée Supabase Storage pour un screenshot donné.
 * - Vérifie que l'utilisateur a accès au scan via RLS
 * - Génère une URL signée valide 1 heure (Storage privé)
 * - Ne jamais exposer storage_path ou clés côté client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { error: 'Screenshot ID requis' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServerClient()

    // 1. Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // 2. Récupérer le screenshot avec vérification RLS
    const { data: screenshot, error: fetchError } = await supabase
      .from('screenshots')
      .select('storage_path, scan_id, viewport, created_at')
      .eq('id', id)
      .single()

    if (fetchError || !screenshot) {
      return NextResponse.json(
        { error: 'Screenshot introuvable ou accès refusé' },
        { status: 404 }
      )
    }

    // 3. Générer l'URL signée (valide 1 heure)
    const { data: signedUrlData, error: signedError } = await supabase
      .storage
      .from('screenshots')
      .createSignedUrl(screenshot.storage_path, 3600) // 1 heure

    if (signedError || !signedUrlData?.signedUrl) {
      console.error('Erreur génération URL signée:', signedError)
      return NextResponse.json(
        { error: 'Impossible de générer l\'URL signée' },
        { status: 500 }
      )
    }

    // 4. Retourner l'URL signée avec métadonnées
    return NextResponse.json({
      signedUrl: signedUrlData.signedUrl,
      viewport: screenshot.viewport,
      createdAt: screenshot.created_at,
      scanId: screenshot.scan_id,
      expiresIn: 3600, // secondes
    })

  } catch (error) {
    console.error('Erreur API signed-url:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}
