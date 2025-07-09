export default function Button({
  children,
  onClick,
  disabled,
}: {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-sm bg-white px-2 py-1 text-xs font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50 ${disabled ? 'opacity-50' : ''}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function PrimaryButton({
  children,
  onClick,
  href,
  disabled,
  color = 'blue',
}: {
  onClick?: () => void;
  href?: string;
  children: React.ReactNode;
  disabled?: boolean;
  color?: 'blue' | 'gray';
}) {
  const colors = {
    blue: 'bg-blue-600 hover:bg-blue-500 focus-visible:outline-blue-600',
    gray: 'bg-gray-400 hover:bg-gray-300 focus-visible:outline-gray-400',
  };

  const className = `cursor-pointer rounded-md ${colors[color]} px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs  focus-visible:outline-2 focus-visible:outline-offset-2 ${disabled ? 'opacity-50' : 'cursor-pointer'}`;

  if (href) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
