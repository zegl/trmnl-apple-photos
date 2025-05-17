export default function Render({
  url,
  size,
  show_message,
}: { url: string; size: string; show_message?: string }) {
  return (
    <div
      className={`view view--${size}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {show_message ? (
        <div>{show_message}</div>
      ) : (
        <>
          <img
            style={{
              width: `calc(var(--${size}-w) - 6px)`,
              height: `calc(var(--${size}-h) - 6px)`,
              objectFit: 'cover',
              objectPosition: 'center',
              borderRadius: '6px',
            }}
            src={url}
            alt="Photo"
            className="image-dither"
          />

          <div
            style={{
              backdropFilter: 'grayscale(100%)',
              backgroundColor: 'rgba(255, 255, 255, 0.0)',
              height: '100%',
              width: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 1,
            }}
          ></div>
        </>
      )}
    </div>
  );
}
