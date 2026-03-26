export default function Render({
  url,
  size,
  show_message,
}: {
  url?: string;
  size: string;
  show_message?: string;
}) {
  return (
    <div
      className={`view view--${size}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: size === 'full' ? '0px' : '3px',
      }}
    >
      {show_message ? (
        <div>{show_message}</div>
      ) : (
        <div
          style={{
            background: `url(${url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            width: '100%',
            height: '100%',
            borderRadius: '6px',
            overflow: 'hidden',
          }}
          className="image-dither"
        />
      )}
    </div>
  );
}
