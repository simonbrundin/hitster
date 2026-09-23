export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const { code, redirectUri } = body

  if (!code || !redirectUri) {
    throw createError({
      statusCode: 400,
      message: 'Missing code or redirectUri'
    })
  }

  const clientId = config.spotifyClientId
  const clientSecret = config.spotifyClientSecret
  const requestOrigin = getRequestURL(event).origin
  const configuredOrigin = config.appUrl.replace(/\/$/, '')
  const allowedRedirectUris = new Set([
    `${requestOrigin}/callback`,
    configuredOrigin ? `${configuredOrigin}/callback` : ''
  ])

  if (!allowedRedirectUris.has(redirectUri)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid redirect URI'
    })
  }

  if (!clientId || !clientSecret) {
    throw createError({
      statusCode: 500,
      message: 'Spotify credentials not configured'
    })
  }

  const response = await $fetch<{
    access_token: string
    token_type: string
    expires_in: number
    refresh_token?: string
  }>('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri
    }).toString()
  })

  return {
    access_token: response.access_token,
    refresh_token: response.refresh_token,
    token_type: response.token_type,
    expires_in: response.expires_in
  }
})
