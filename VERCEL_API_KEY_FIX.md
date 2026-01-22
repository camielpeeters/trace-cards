# API Key Fix - Vercel Environment Variables

## Probleem
De environment variable naam is inconsistent in de code.

## Oplossing

### Stap 1: Voeg BEIDE varianten toe in Vercel
Ga naar Vercel → Settings → Environment Variables en voeg toe:

1. `POKEMON_TCG_API_KEY` = `[jouw API key]`
2. `POKEMON_API_KEY` = `[jouw API key]` (voor backwards compatibility)

### Stap 2: Redeploy de app
Na het toevoegen van environment variables MOET je redeployen:
- Ga naar Vercel → Deployments
- Klik op de "..." menu van de laatste deployment
- Klik "Redeploy"

### Stap 3: Controleer de logs
Na deployment, bekijk de Vercel logs:
- Zoek naar `✅ POKEMON_TCG_API_KEY is configured`
- Of `❌ POKEMON_TCG_API_KEY not configured`

## Belangrijk
Environment variables zijn ALLEEN beschikbaar na een nieuwe deployment!
Het toevoegen van variables op zich is niet genoeg.
