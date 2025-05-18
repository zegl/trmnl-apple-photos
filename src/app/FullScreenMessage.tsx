export default function FullScreenMessage({ message }: { message: string }) {
  return (
    <div
      className="screen"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <p>{message}</p>
    </div>
  );
}
