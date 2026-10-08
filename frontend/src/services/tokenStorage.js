export function getAccessToken() {
  const accessToken = localStorage.getItem('access_token');
  const legacyToken = localStorage.getItem('token');

  if (!accessToken && legacyToken) {
    localStorage.setItem('access_token', legacyToken);
  }
  localStorage.removeItem('token');
  return accessToken || legacyToken;
}

export function setAccessToken(token, tokenType = 'bearer') {
  localStorage.setItem('access_token', token);
  localStorage.setItem('token_type', tokenType);
  localStorage.removeItem('token');
}

export function clearAccessToken() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('token_type');
  localStorage.removeItem('token');
}
