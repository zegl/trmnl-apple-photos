export default function Render({ url, size }: { url: string; size: string }) {
    return (
        <div
          className={`view view--${size}`}
          style={{
            overflow: 'hidden',
            justifyContent: 'center',
          }}
        >
          <img src={url} alt="Photo" className="image-dither" />
    
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
        </div>
      );
}
