/**
 * Centralized Avatar Helper for CyberGuard
 * Handles URL resolution for both local and cloud-hosted avatars,
 * fallback initial generation, and theme-matched gradients.
 */

export const getAvatarUrl = (avatar, timestamp = null) => {
  if (!avatar || typeof avatar !== 'string') return null;
  
  const clean = avatar.trim();
  if (!clean) return null;

  let url = clean;

  // Already a full remote URL or Base64 data URL
  if (!clean.startsWith('http://') && !clean.startsWith('https://') && !clean.startsWith('data:')) {
    // Relative path served by Express backend (e.g., /uploads/avatars/...)
    const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
    const backendBase = apiBase.replace(/\/api\/?$/, '');
    const relativePath = clean.startsWith('/') ? clean : `/${clean}`;
    url = `${backendBase}${relativePath}`;
  }

  if (timestamp && !url.startsWith('data:')) {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}t=${new Date(timestamp).getTime()}`;
  }

  return url;
};

export const getAvatarFallback = (name, isOwner = false) => {
  if (isOwner) return '◆';
  if (!name || typeof name !== 'string') return 'U';
  return name.trim().charAt(0).toUpperCase() || 'U';
};

export const getAvatarGradient = (role, isOwner = false) => {
  if (isOwner) return 'linear-gradient(135deg, #00B4FF, #00FF88)';
  switch (role) {
    case 'admin':
      return 'linear-gradient(135deg, #007AFF, #AF52DE)';
    case 'officer':
      return 'linear-gradient(135deg, #FF9500, #FFCC00)';
    case 'education':
      return 'linear-gradient(135deg, #AF52DE, #FF2D55)';
    default:
      return 'linear-gradient(135deg, #00B4FF, #00FF88)';
  }
};
