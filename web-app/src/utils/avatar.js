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
  if (isOwner) return '#1C1C1A';
  switch (role) {
    case 'admin':
      return '#242422';
    case 'officer':
      return '#1E1E1C';
    case 'education':
      return '#222220';
    default:
      return '#1C1C1A';
  }
};
