import { useToastStore } from '../store/toastStore';
import '../styles/Toast.css';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => removeToast(toast.id)}
          className={`toast-card toast-${toast.type}`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
