// Stats Card
export const StatsCard = ({ title, value, icon: Icon, color = 'blue', trend, subtitle }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg border ${colors[color]}`}>
          <Icon size={24} />
        </div>
        {trend && (
          <span className={`text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      <p className="text-sm text-slate-500 mt-1">{title}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
};

// Priority Badge
export const PriorityBadge = ({ priority }) => {
  const styles = {
    urgent: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-green-100 text-green-700 border-green-200',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[priority] || styles.medium}`}>
      {priority?.charAt(0).toUpperCase() + priority?.slice(1)}
    </span>
  );
};

// Status Badge
export const StatusBadge = ({ status }) => {
  const styles = {
    pending: 'bg-gray-100 text-gray-700',
    approved: 'bg-blue-100 text-blue-700',
    assigned: 'bg-purple-100 text-purple-700',
    'in-progress': 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  const labels = {
    pending: 'Pending',
    approved: 'Approved',
    assigned: 'Assigned',
    'in-progress': 'In Progress',
    completed: 'Completed',
    rejected: 'Rejected',
  };

  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
};

// Worker Status Badge
export const WorkerStatusBadge = ({ status }) => {
  const styles = {
    available: 'bg-green-100 text-green-700',
    busy: 'bg-orange-100 text-orange-700',
    offline: 'bg-gray-100 text-gray-500',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || styles.offline}`}>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
};

// Button
export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  loading = false,
  onClick,
  className = '',
  ...props 
}) => {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-lg
        transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && (
        <span className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
};

// Card
export const Card = ({ children, className = '', ...props }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-100 ${className}`} {...props}>
    {children}
  </div>
);

// Modal
export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className={`relative bg-white rounded-xl shadow-xl w-full ${sizes[size]} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
            <button 
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

// Select
export const Select = ({ label, value, onChange, options, placeholder, className = '' }) => (
  <div className={className}>
    {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
    <select
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 rounded-lg border border-slate-200 
        focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
        text-sm bg-white"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

// Textarea
export const Textarea = ({ label, value, onChange, placeholder, rows = 3, className = '' }) => (
  <div className={className}>
    {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 rounded-lg border border-slate-200 
        focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
        text-sm resize-none"
    />
  </div>
);

// Empty State
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    {Icon && (
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <Icon size={32} className="text-slate-400" />
      </div>
    )}
    <h3 className="text-lg font-medium text-slate-800 mb-2">{title}</h3>
    {description && <p className="text-sm text-slate-500 mb-4 max-w-md">{description}</p>}
    {action}
  </div>
);

// Loading Spinner
export const Spinner = ({ size = 'md' }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div className={`animate-spin rounded-full border-2 border-slate-200 border-t-blue-600 ${sizes[size]}`} />
    </div>
  );
};
