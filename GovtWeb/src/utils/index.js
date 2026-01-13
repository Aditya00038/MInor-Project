// Format date utilities
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return 'N/A';
  
  const defaultOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options
  };
  
  return new Date(dateString).toLocaleDateString('en-US', defaultOptions);
};

export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatRelativeTime = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return formatDate(dateString);
};

// Status utilities
export const getStatusColor = (status) => {
  const colors = {
    pending: 'gray',
    approved: 'blue',
    assigned: 'purple',
    'in-progress': 'yellow',
    completed: 'green',
    rejected: 'red',
  };
  return colors[status] || 'gray';
};

export const getPriorityColor = (priority) => {
  const colors = {
    urgent: 'red',
    high: 'orange',
    medium: 'yellow',
    low: 'green',
  };
  return colors[priority] || 'gray';
};

// String utilities
export const truncate = (str, length = 50) => {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
};

export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Number utilities
export const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

// Category to icon mapping
export const getCategoryIcon = (category) => {
  const icons = {
    road: 'road',
    pothole: 'road',
    traffic: 'traffic-cone',
    water: 'droplet',
    pipeline: 'pipe',
    garbage: 'trash',
    sewage: 'waves',
    streetlight: 'lamp',
    electricity: 'zap',
    park: 'trees',
    tree: 'tree',
    safety: 'shield',
    construction: 'hard-hat',
    health: 'heart-pulse',
  };
  return icons[category?.toLowerCase()] || 'help-circle';
};
