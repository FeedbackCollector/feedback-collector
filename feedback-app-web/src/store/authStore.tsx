import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { API_URL } from '../service/api';
import { useToastStore } from './toastStore';

export interface User {
    id?: number;
    name?: string;
    email: string;
    role: string;
    area_id?: number;
}

export type FormType = 'login' | 'register' | 'forgot';

export interface TypeError {
    field: string;
    message: string;
}

export const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

const decodeToken = (token: string): User => {
    const parts = token.split('.');

    if (parts.length !== 3 || !parts[1]) {
        throw new Error('Invalid token');
    }

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const binary = atob(paddedBase64);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes)) as User;

    if (!payload.email || !payload.role) {
        throw new Error('Invalid user data in token');
    }

    return payload;
};

interface AuthState {
    activeForm: FormType;
    isAuthenticated: boolean;
    token: string | null;
    user: User | null;
    error: TypeError | null;

    switchForm: (form: FormType) => void;
    clearError: () => void;

    loginEmail: string;
    loginPassword: string;
    isLoginEmailValid: boolean;
    setLoginEmail: (email: string) => void;
    setLoginPassword: (password: string) => void;
    loginSubmit: () => Promise<boolean>;

    regName: string;
    regEmail: string;
    regPassword: string;
    regConfirmPassword: string;
    regArea: string;
    isRegEmailValid: boolean;
    setRegName: (name: string) => void;
    setRegEmail: (email: string) => void;
    setRegPassword: (password: string) => void;
    setRegConfirmPassword: (confirmPassword: string) => void;
    setRegArea: (area: string) => void;
    createAccount: () => Promise<string | null>;

    forgotEmail: string;
    resetPassword: string;
    resetConfirmPassword: string;
    setForgotEmail: (email: string) => void;
    setResetPassword: (password: string) => void;
    setResetConfirmPassword: (confirmPassword: string) => void;
    sendResetLink: () => Promise<boolean>;
    confirmResetPassword: (token: string) => Promise<boolean>;

    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            activeForm: 'login',
            isAuthenticated: false,
            token: null,
            user: null,
            error: null,

            loginEmail: '',
            loginPassword: '',
            isLoginEmailValid: false,

            regName: '',
            regEmail: '',
            regPassword: '',
            regConfirmPassword: '',
            regArea: '',
            isRegEmailValid: false,

            forgotEmail: '',
            resetPassword: '',
            resetConfirmPassword: '',

            switchForm: (form) => set({ activeForm: form, error: null }),
            clearError: () => set({ error: null }),

            setLoginEmail: (loginEmail) => set({
                loginEmail,
                isLoginEmailValid: isValidEmail(loginEmail),
                error: null,
            }),
            setLoginPassword: (loginPassword) => set({ loginPassword, error: null }),
            setRegName: (regName) => set({ regName, error: null }),
            setRegEmail: (regEmail) => set({
                regEmail,
                isRegEmailValid: isValidEmail(regEmail),
                error: null,
            }),
            setRegPassword: (regPassword) => set({ regPassword, error: null }),
            setRegConfirmPassword: (regConfirmPassword) => set({ regConfirmPassword, error: null }),
            setRegArea: (regArea) => set({ regArea, error: null }),
            setForgotEmail: (forgotEmail) => set({ forgotEmail, error: null }),
            setResetPassword: (resetPassword) => set({ resetPassword, error: null }),
            setResetConfirmPassword: (resetConfirmPassword) => set({ resetConfirmPassword, error: null }),

            loginSubmit: async () => {
                const { loginEmail, loginPassword } = get();
                const email = loginEmail.trim();

                if (!email) {
                    set({ error: { field: 'loginEmail', message: 'Enter your email.' } });
                    return false;
                }

                if (!loginPassword.trim()) {
                    set({ error: { field: 'loginPassword', message: 'Enter your password.' } });
                    return false;
                }

                if (!isValidEmail(email)) {
                    set({ error: { field: 'loginEmail', message: 'Enter a valid email address.' } });
                    return false;
                }

                try {
                    const response = await fetch(`${API_URL}/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password: loginPassword }),
                    });
                    const data = await response.json().catch(() => ({}));

                    if (!response.ok) {
                        set({
                            token: null,
                            user: null,
                            isAuthenticated: false,
                            error: {
                                field: 'loginPassword',
                                message: data.message || data.error || data.mensaje || 'Email or password are incorrect.',
                            },
                        });
                        return false;
                    }

                    if (typeof data.token !== 'string' || !data.token) {
                        throw new Error('The server did not return a valid token');
                    }

                    const token: string = data.token;
                    const decodedUser = decodeToken(token);
                    let currentUser = decodedUser;

                    
                    try {
                        const usersResponse = await fetch(`${API_URL}/users`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });

                        if (usersResponse.ok) {
                            const usersData = await usersResponse.json().catch(() => ({}));
                            const users = Array.isArray(usersData.data) ? usersData.data : [];
                            const userFromList = users.find((item: User) => item.email === decodedUser.email);

                            if (userFromList) {
                                currentUser = { ...decodedUser, ...userFromList };
                            }
                        }
                    } catch {
                        // El login puede continuar con los datos del token.
                    }

                    set({
                        token,
                        user: {
                            id: currentUser.id,
                            name: currentUser.name,
                            email: currentUser.email,
                            role: currentUser.role,
                            area_id: currentUser.area_id,
                        },
                        isAuthenticated: true,
                        error: null,
                    });

                    useToastStore.getState().addToast('Logged in successfully!', 'success');
                    return true;
                } catch {
                    set({
                        token: null,
                        user: null,
                        isAuthenticated: false,
                        error: { field: 'loginPassword', message: 'Could not connect to the server or process the login response.' },
                    });
                    return false;
                }
            },

            createAccount: async () => {
                const { regName, regEmail, regPassword, regConfirmPassword, regArea } = get();
                const email = regEmail.trim();
                const areaId = Number(regArea);

                if (!regName.trim()) {
                    set({ error: { field: 'regName', message: 'Enter your name.' } });
                    return null;
                }
                if (!isValidEmail(email)) {
                    set({ error: { field: 'regEmail', message: 'Enter a valid email address.' } });
                    return null;
                }
                if (regPassword.length < 8) {
                    set({ error: { field: 'regPassword', message: 'Password must be at least 8 characters.' } });
                    return null;
                }
                if (regPassword !== regConfirmPassword) {
                    set({ error: { field: 'regConfirmPassword', message: "Passwords don't match." } });
                    return null;
                }
                if (!regArea || !Number.isInteger(areaId) || areaId <= 0) {
                    set({ error: { field: 'regArea', message: 'Select a valid area.' } });
                    return null;
                }

                try {
                    const response = await fetch(`${API_URL}/auth/register`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: regName.trim(),
                            email,
                            password: regPassword,
                            area_id: areaId,
                        }),
                    });
                    const data = await response.json().catch(() => ({}));

                    if (!response.ok) {
                        set({
                            error: {
                                field: 'regEmail',
                                message: data.message || data.error || data.mensaje || 'Registration failed.',
                            },
                        });
                        return null;
                    }

                    const successMessage = 'Account created, please wait to be approved.';
                    set({
                        activeForm: 'login',
                        error: null,
                        regName: '',
                        regEmail: '',
                        regPassword: '',
                        regConfirmPassword: '',
                        regArea: '',
                        isRegEmailValid: false,
                    });
                    useToastStore.getState().addToast(successMessage, 'success');
                    return successMessage;
                } catch {
                    set({ error: { field: 'regEmail', message: 'Server connection error.' } });
                    return null;
                }
            },

            sendResetLink: async () => {
                const email = get().forgotEmail.trim();

                if (!email) {
                    set({ error: { field: 'forgotEmail', message: 'Enter your email.' } });
                    return false;
                }
                if (!isValidEmail(email)) {
                    set({ error: { field: 'forgotEmail', message: 'Enter a valid email address.' } });
                    return false;
                }

                try {
                    const response = await fetch(`${API_URL}/auth/forgot-password`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email }),
                    });

                    if (response.ok) {
                        set({ error: null, forgotEmail: '' });
                        useToastStore.getState().addToast('Reset link sent!', 'success');
                        return true;
                    }

                    const data = await response.json().catch(() => ({}));
                    set({
                        error: {
                            field: 'forgotEmail',
                            message: data.message || data.error || data.mensaje || 'Could not send reset link.',
                        },
                    });
                    return false;
                } catch {
                    set({ error: { field: 'forgotEmail', message: 'Server connection error.' } });
                    return false;
                }
            },

            confirmResetPassword: async (token) => {
                const { resetPassword, resetConfirmPassword } = get();

                if (!resetPassword.trim()) {
                    set({ error: { field: 'resetPassword', message: 'Enter a new password.' } });
                    return false;
                }
                if (resetPassword.length < 8) {
                    set({ error: { field: 'resetPassword', message: 'Your new password must be at least 8 characters.' } });
                    return false;
                }
                if (resetPassword !== resetConfirmPassword) {
                    set({ error: { field: 'resetConfirmPassword', message: "Passwords don't match." } });
                    return false;
                }
                if (!token.trim()) {
                    set({ error: { field: 'resetPassword', message: 'The reset link is invalid or expired.' } });
                    return false;
                }

                try {
                    const response = await fetch(`${API_URL}/auth/reset-password`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token, password: resetPassword }),
                    });
                    const data = await response.json().catch(() => ({}));

                    if (!response.ok) {
                        set({
                            error: {
                                field: 'resetPassword',
                                message: data.message || data.error || data.mensaje || 'Invalid or expired reset link.',
                            },
                        });
                        return false;
                    }

                    useToastStore.getState().addToast('Password reset successfully!', 'success');
                    set({
                        activeForm: 'login',
                        resetPassword: '',
                        resetConfirmPassword: '',
                        forgotEmail: '',
                        error: null,
                    });
                    return true;
                } catch {
                    set({ error: { field: 'resetPassword', message: 'Server connection error.' } });
                    return false;
                }
            },

            logout: () => set({
                activeForm: 'login',
                isAuthenticated: false,
                token: null,
                user: null,
                error: null,
                loginEmail: '',
                loginPassword: '',
                isLoginEmailValid: false,
                regName: '',
                regEmail: '',
                regPassword: '',
                regConfirmPassword: '',
                regArea: '',
                isRegEmailValid: false,
                forgotEmail: '',
                resetPassword: '',
                resetConfirmPassword: '',
            }),
        }),
        {
            name: 'User-Storage',
            partialize: (state) => ({
                isAuthenticated: state.isAuthenticated,
                token: state.token,
                user: state.user,
            }),
        },
    ),
);
