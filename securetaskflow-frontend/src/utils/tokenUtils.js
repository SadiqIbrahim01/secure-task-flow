
export const decodeToken = (token) => {
  if (!token) return null;
  try {
    const base64Payload = token.split('.')[1];
    const payload = atob(base64Payload);
    return JSON.parse(payload);
  } catch {
    return null;
  }
};

export const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return true;
  // Add 30-second buffer to avoid edge cases
  return Date.now() >= (decoded.exp * 1000) - 30000;
};

export const getTokenUserId = (token) => {
  return decodeToken(token)?.sub ?? null;
};