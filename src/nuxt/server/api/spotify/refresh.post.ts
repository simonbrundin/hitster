export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const { refreshToken } = body

  if (!refreshToken) {
    throw createError({
      statusCode: 400,
      message: 'Missing refreshToken'
    })
  }

  const clientId = config.spotifyClientId
  const clientSecret = config.spotifyClientSecret

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
  }>('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    }).toString()
  })

  return {
    access_token: response.access_token,
    token_type: response.token_type,
    expires_in: response.expires_in
  }
})
