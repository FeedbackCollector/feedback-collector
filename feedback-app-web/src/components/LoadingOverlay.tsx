import '../styles/LoadingOverlay.css';

type LoadingOverlayProps = {
  message: string;
};

export default function LoadingOverlay({ message }: LoadingOverlayProps) {
  return (
    <div className="loading-overlay">
      <div className="loading-overlay__card">
        <span className="loading-overlay__spinner"/>
        <p>{message}</p>
      </div>
    </div>
  );
}