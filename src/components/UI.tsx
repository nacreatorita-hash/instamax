import React from 'react';
import { Star, UploadCloud, Check } from 'lucide-react';

// === BUTTON ===
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-semibold rounded-full transition-all duration-200 active:scale-98 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/15',
    secondary: 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900',
    outline: 'border border-zinc-200 hover:bg-zinc-50 text-zinc-800',
    danger: 'bg-red-550 hover:bg-red-600 text-white shadow-sm',
    ghost: 'hover:bg-zinc-100 text-zinc-700'
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base'
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// === INPUT ===
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{label}</label>}
      <input
        ref={ref}
        className={`w-full px-4 py-3 text-sm bg-white border border-zinc-100 rounded-2xl placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-blue-600 transition-colors ${error ? 'border-red-500 focus:border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-500 font-medium mt-0.5">{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';

// === SELECT ===
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  options,
  error,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{label}</label>}
      <div className="relative">
        <select
          ref={ref}
          className={`w-full appearance-none px-4 py-3 text-sm bg-white border border-zinc-100 rounded-2xl focus:outline-none focus:bg-white focus:border-blue-600 transition-colors ${error ? 'border-red-500 focus:border-red-500' : ''} ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-400">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>
      {error && <span className="text-xs text-red-500 font-medium mt-0.5">{error}</span>}
    </div>
  );
});

Select.displayName = 'Select';

// === TEXTAREA ===
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{label}</label>}
      <textarea
        ref={ref}
        rows={4}
        className={`w-full px-4 py-3 text-sm bg-white border border-zinc-100 rounded-2xl placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-blue-600 transition-colors resize-y ${error ? 'border-red-500 focus:border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-500 font-medium mt-0.5">{error}</span>}
    </div>
  );
});

Textarea.displayName = 'Textarea';

// === CARD ===
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverEffect = true,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bg-white border border-zinc-100/80 rounded-[2.25rem] p-6 shadow-xl shadow-zinc-200/40 transition-all duration-300 ${hoverEffect ? 'hover:shadow-2xl hover:shadow-zinc-300/40 hover:-translate-y-1 hover:border-blue-500/50' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// === BADGE ===
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'info' | 'gray';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gray'
}) => {
  const styles = {
    primary: 'bg-zinc-900 text-white',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    warning: 'bg-amber-50 text-amber-700 border border-amber-100',
    info: 'bg-blue-50 text-blue-700 border border-blue-100',
    gray: 'bg-zinc-100 text-zinc-600 border border-zinc-200/50'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium tracking-wide ${styles[variant]}`}>
      {children}
    </span>
  );
};

// === AVATAR ===
interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  isOnline = false,
  className = ''
}) => {
  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl'
  };

  const initial = name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?';

  return (
    <div className={`relative inline-block flex-shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          referrerPolicy="no-referrer"
          className={`${sizes[size]} rounded-full object-cover border border-zinc-100`}
        />
      ) : (
        <div className={`${sizes[size]} rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center font-bold border border-zinc-200/50`}>
          {initial}
        </div>
      )}
      {isOnline && (
        <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
      )}
    </div>
  );
};

// === RATING STARS ===
interface RatingStarsProps {
  rating: number;
  count?: number;
  size?: number;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  count,
  size = 14
}) => {
  return (
    <div className="flex items-center gap-1">
      <div className="flex text-amber-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            fill={star <= Math.round(rating) ? 'currentColor' : 'none'}
            className={star <= Math.round(rating) ? '' : 'text-zinc-200'}
          />
        ))}
      </div>
      <span className="text-xs font-semibold text-zinc-800 ml-1">{rating.toFixed(1)}</span>
      {count !== undefined && (
        <span className="text-xs text-zinc-400">({count})</span>
      )}
    </div>
  );
};

// === STATUS TOGGLE ===
interface StatusToggleProps {
  isOnline: boolean;
  onToggle: () => void;
  onlineLabel?: string;
  offlineLabel?: string;
}

export const StatusToggle: React.FC<StatusToggleProps> = ({
  isOnline,
  onToggle,
  onlineLabel = 'Disponibile',
  offlineLabel = 'Non Disponibile'
}) => {
  return (
    <button
      onClick={onToggle}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 border ${
        isOnline 
          ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100' 
          : 'bg-zinc-50 text-zinc-500 border-zinc-100 hover:bg-zinc-100'
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-300'}`} />
      {isOnline ? onlineLabel : offlineLabel}
    </button>
  );
};

// === UPLOAD BOX ===
interface UploadBoxProps {
  onFileSelect?: (file: File) => void;
  label?: string;
  helperText?: string;
  acceptedTypes?: string;
}

export const UploadBox: React.FC<UploadBoxProps> = ({
  onFileSelect,
  label = 'Carica file',
  helperText = 'PDF, PNG, JPG fino a 10MB',
  acceptedTypes = '.pdf,.png,.jpg,.jpeg'
}) => {
  const [dragActive, setDragActive] = React.useState(false);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFileName(file.name);
      if (onFileSelect) onFileSelect(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      if (onFileSelect) onFileSelect(file);
    }
  };

  const triggerInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={triggerInput}
      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-2 ${
        dragActive 
          ? 'border-zinc-900 bg-zinc-50' 
          : fileName 
            ? 'border-emerald-300 bg-emerald-50/20' 
            : 'border-zinc-200 hover:border-zinc-400 bg-zinc-50/50'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        onChange={handleFileChange}
        className="hidden"
      />
      
      {fileName ? (
        <>
          <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <Check size={20} />
          </div>
          <p className="text-sm font-semibold text-zinc-800">{fileName}</p>
          <p className="text-xs text-zinc-400">Clicca per sostituire il file</p>
        </>
      ) : (
        <>
          <div className="h-10 w-10 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center">
            <UploadCloud size={20} />
          </div>
          <p className="text-sm font-semibold text-zinc-800">{label}</p>
          <p className="text-xs text-zinc-400">{helperText}</p>
          <p className="text-[10px] text-zinc-400/80 mt-1 uppercase tracking-wider font-semibold">Trascina e rilascia o sfoglia</p>
        </>
      )}
    </div>
  );
};
