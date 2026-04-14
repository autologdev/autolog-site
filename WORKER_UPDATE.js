// autolog-mechanic Cloudflare Worker — updated with /ai-classify-enhanced
// Deploy via CF dashboard → Workers → autolog-mechanic → Edit code
// Then set secrets: wrangler secret put OPENAI_KEY and GOOGLE_VISION_KEY
// OPENAI_KEY: set via wrangler secret put OPENAI_KEY
// GOOGLE_VISION_KEY: set via wrangler secret put GOOGLE_VISION_KEY

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
    const path = url.pathname
    if (path === '/dvla-lookup') return handleDVLALookup(request, url, env, corsHeaders)
    if (path === '/ai-classify') return handleAIClassify(request, env, corsHeaders)
    if (path === '/ai-classify-enhanced') return handleAIClassifyEnhanced(request, env, corsHeaders)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const token = pathParts[pathParts.length - 1]
    if (!token || ['dvla-lookup','ai-classify','ai-classify-enhanced'].includes(token)) {
      return new Response(notFoundHTML(), { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    }
    const vehicleRes = await fetch(`${env.SUPABASE_URL}/rest/v1/vehicles?mechanic_share_token=eq.${token}&select=*`, {
      headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json' },
    })
    const vehicles = await vehicleRes.json()
    if (!vehicles || vehicles.length === 0) return new Response(notFoundHTML(), { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    const vehicle = vehicles[0]
    if (vehicle.mechanic_share_expiry && new Date(vehicle.mechanic_share_expiry) < new Date()) return new Response(expiredHTML(), { status: 410, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    const [servicesRes, maintenanceRes] = await Promise.all([
      fetch(`${env.SUPABASE_URL}/rest/v1/service_entries?vehicle_id=eq.${vehicle.id}&select=*&order=date.desc`, { headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}` } }),
      fetch(`${env.SUPABASE_URL}/rest/v1/maintenance_items?vehicle_id=eq.${vehicle.id}&select=*`, { headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}` } }),
    ])
    return new Response(buildHTML(vehicle, await servicesRes.json() || [], await maintenanceRes.json() || []), { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  },
}

async function handleDVLALookup(request, url, env, corsHeaders) {
  const reg = url.searchParams.get('reg')
  if (!reg) return new Response(JSON.stringify({ error: 'Missing reg parameter' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  const cleanReg = reg.toUpperCase().replace(/\s/g, '')
  try {
    const dvlaRes = await fetch('https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': env.DVLA_API_KEY }, body: JSON.stringify({ registrationNumber: cleanReg }) })
    if (dvlaRes.status === 404) return new Response(JSON.stringify({ error: 'Vehicle not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    if (!dvlaRes.ok) return new Response(JSON.stringify({ error: 'DVLA lookup failed' }), { status: dvlaRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    const data = await dvlaRes.json()
    const fuelMap = { PETROL: 'petrol', DIESEL: 'diesel', 'HYBRID ELECTRIC': 'hybrid', 'PETROL/ELECTRIC': 'hybrid', 'PLUG-IN HYBRID ELECTRIC': 'phev', ELECTRIC: 'electric', GAS: 'lpg', LPG: 'lpg' }
    return new Response(JSON.stringify({ registration: data.registrationNumber, make: data.make ? data.make.charAt(0) + data.make.slice(1).toLowerCase() : null, colour: data.colour ? data.colour.charAt(0) + data.colour.slice(1).toLowerCase() : null, year: data.yearOfManufacture || null, fuelType: fuelMap[data.fuelType?.toUpperCase()] || null, engineSizeCc: data.engineCapacity || null, motExpiry: data.motExpiryDate || null, taxExpiry: data.taxDueDate || null, bodyType: data.bodyType || null, doors: data.numberOfDoors || null, co2Emissions: data.co2Emissions || null, euroStatus: data.euroStatus || null }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) { return new Response(JSON.stringify({ error: 'DVLA service error', detail: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) }
}

async function handleAIClassify(request, env, corsHeaders) {
  if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'POST required' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  try {
    const body = await request.json()
    const res = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.OPENAI_KEY}` }, body: JSON.stringify({ model: body.model || 'gpt-4o-mini', max_tokens: body.max_tokens || 400, messages: body.messages }) })
    if (!res.ok) return new Response(JSON.stringify({ error: 'OpenAI error', detail: await res.text() }), { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    return new Response(JSON.stringify(await res.json()), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) { return new Response(JSON.stringify({ error: 'AI classify error', detail: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) }
}

async function handleAIClassifyEnhanced(request, env, corsHeaders) {
  if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'POST required' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  try {
    const body = await request.json()
    let base64Image = null
    for (const msg of body.messages || []) {
      if (Array.isArray(msg.content)) {
        for (const part of msg.content) {
          if (part.type === 'image_url' && part.image_url?.url) {
            const m = part.image_url.url.match(/^data:([^;]+);base64,(.+)$/)
            if (m) { base64Image = m[2] }
          }
        }
      }
    }
    let rawText = null
    if (base64Image && env.GOOGLE_VISION_KEY) {
      const vr = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${env.GOOGLE_VISION_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requests: [{ image: { content: base64Image }, features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }], imageContext: { languageHints: ['en'] } }] }) })
      if (vr.ok) { const vd = await vr.json(); rawText = vd.responses?.[0]?.fullTextAnnotation?.text || vd.responses?.[0]?.textAnnotations?.[0]?.description || null }
    }
    const systemPrompt = `You are an automotive document classifier for a UK vehicle management app. Return ONLY valid JSON: {"document_type":"mot_certificate|service_invoice|fuel_receipt|insurance|v5c|warranty|purchase_receipt|recall_notice|repair_invoice|tyre_receipt|other","confidence":0-1,"document_date":"YYYY-MM-DD or null","extracted_amount":number_or_null,"extracted_mileage":number_or_null,"garage_name":"string or null","description":"string or null","mot_expiry":"YYYY-MM-DD or null"}`
    const gptMessages = rawText ? [{ role: 'user', content: `${systemPrompt}\n\nDocument text:\n\n${rawText}` }] : body.messages
    const gr = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.OPENAI_KEY}` }, body: JSON.stringify({ model: 'gpt-4o-mini', max_tokens: 400, messages: gptMessages }) })
    if (!gr.ok) return new Response(JSON.stringify({ error: 'OpenAI error', detail: await gr.text() }), { status: gr.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    return new Response(JSON.stringify(await gr.json()), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) { return new Response(JSON.stringify({ error: 'Enhanced classify error', detail: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) }
}

// HTML helpers unchanged from original — buildHTML, notFoundHTML, expiredHTML
// (copy from original worker or see full version in git history)
// NOTE: The full HTML helper functions are identical to the original worker code.
// When deploying, copy the buildHTML, notFoundHTML, expiredHTML functions from the
// existing worker (visible in CF dashboard) and paste them below this comment.
