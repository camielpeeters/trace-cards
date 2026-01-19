import { NextResponse } from 'next/server';

// Force dynamic rendering (uses request.url)
export const dynamic = 'force-dynamic';

// Helper functie voor fetch met timeout
async function fetchWithTimeout(url, options, timeout = 60000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

// Retry functie met exponential backoff
async function fetchWithRetry(url, options, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`🔄 [API Route] Attempt ${attempt + 1}/${maxRetries} for: ${url}`);
      
      const response = await fetchWithTimeout(url, options, 60000); // 60 second timeout
      
      if (response.ok) {
        return response;
      }
      
      // Als het een 504 is, probeer opnieuw
      if (response.status === 504 && attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`⏳ [API Route] 504 error, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        lastError = new Error(`Pokemon API error: ${response.status}`);
        continue;
      }
      
      // Andere errors: gooi error zodat we het kunnen afhandelen in de GET functie
      const errorText = await response.text();
      console.error('❌ [API Route] Pokemon API error:', errorText);
      lastError = new Error(`Pokemon API error: ${response.status}`);
      
      // Als het geen retry-waardige error is, gooi direct
      if (response.status !== 504) {
        throw lastError;
      }
      
    } catch (error) {
      lastError = error;
      
      // Timeout of network error: retry als we nog pogingen hebben
      if (attempt < maxRetries - 1 && (error.message === 'Request timeout' || error.name === 'TypeError')) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`⏳ [API Route] ${error.message}, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Laatste poging gefaald of andere error
      throw error;
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const apiKey = searchParams.get('apiKey');
    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('pageSize') || '250'; // Max page size
    
    console.log('🔄 [API Route] Cards endpoint called');
    console.log('📝 [API Route] Query:', query);
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 400 });
    }
    
    let url = 'https://api.pokemontcg.io/v2/cards';
    const params = new URLSearchParams();
    
    if (query) {
      params.append('q', query);
    }
    params.append('page', page);
    params.append('pageSize', pageSize);
    
    url += `?${params.toString()}`;
    
    console.log('🌐 [API Route] Fetching:', url);
    
    const response = await fetchWithRetry(url, {
      headers: { 'X-Api-Key': apiKey }
    });
    
    console.log('📡 [API Route] Response status:', response.status);
    
    const data = await response.json();
    console.log('✅ [API Route] Success:', data.data?.length, 'cards returned');
    
    // Als er meer pagina's zijn, log dat
    if (data.totalCount && data.pageSize) {
      const totalPages = Math.ceil(data.totalCount / data.pageSize);
      console.log(`📄 [API Route] Page ${data.page || page} of ${totalPages} (${data.totalCount} total cards)`);
    }
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('❌ [API Route] Error:', error);
    
    // Specifieke error messages
    if (error.message === 'Request timeout') {
      return NextResponse.json(
        { error: 'Request timeout - De Pokemon API reageert te langzaam. Probeer het later opnieuw.' },
        { status: 504 }
      );
    }
    
    if (error.message.includes('All retry attempts failed')) {
      return NextResponse.json(
        { error: 'Kon niet verbinden met Pokemon API na meerdere pogingen. Probeer het later opnieuw.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
