import { useAuthStore } from '../store/authStore';

const CHECK_INTERVAL_MS = 60 * 1000;

function checkSession() {
    const { token, logout } = useAuthStore.getState();
    if (!token) return;

    try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()) logout();
    } catch {
    logout();
    }
}

let started = false;

export function startSessionCheck() {
    if (started) return;
    started = true;

    checkSession();
    setInterval(checkSession, CHECK_INTERVAL_MS);
}