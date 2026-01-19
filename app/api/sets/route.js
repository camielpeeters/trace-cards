import { NextResponse } from 'next/server';

// Force dynamic rendering (uses request.url)
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('apiKey');
    
    console.log('🔄 [API Route] Sets endpoint called');
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 400 });
    }
    
    // SIMPELE QUERY - GEEN DATE FILTERS!
    const url = 'https://api.pokemontcg.io/v2/sets';
    
    console.log('🌐 [API Route] Fetching ALL sets:', url);
    
    // Timeout na 60 seconden (fallback voor oudere Node.js versies)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    
    const response = await fetch(url, {
      headers: { 
        'X-Api-Key': apiKey
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log('📡 [API Route] Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [API Route] Pokemon API error:', errorText);
      return NextResponse.json(
        { error: `Pokemon API error: ${response.status}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('✅ [API Route] Success:', data.data?.length, 'total sets');
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('❌ [API Route] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
