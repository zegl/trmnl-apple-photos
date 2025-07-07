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
