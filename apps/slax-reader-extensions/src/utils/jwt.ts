export function parseJWTToken(token: string): { email?: string } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    const payload = parts[1]
    const paddedPayload = payload + '='.repeat((4 - (payload.length % 4)) % 4)
    const decodedPayload = atob(paddedPayload)
    const userInfo = JSON.parse(decodedPayload)

    return {
      email: userInfo.email || userInfo.sub || userInfo.username
    }
  } catch (error) {
    console.error('Error parsing JWT token:', error)
    return null
  }
}

export function isSameUser(oldToken: string, newToken: string): boolean {
  if (!oldToken || !newToken) {
    return false
  }

  const oldUser = parseJWTToken(oldToken)
  const newUser = parseJWTToken(newToken)

  if (!oldUser || !newUser || !oldUser.email || !newUser.email) {
    return false
  }

  return oldUser.email === newUser.email
}
