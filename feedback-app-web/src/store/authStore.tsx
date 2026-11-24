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
            forgotEmail: '',
            resetPassword: '',
            resetConfirmPassword: '',
            regArea: '',
            isRegEmailValid: false,

            switchForm: (form) => set({ activeForm: form, error: null }),
            clearError: () => set({ error: null }),

            setLoginEmail: (loginEmail) => set({ 
                loginEmail, 
                isLoginEmailValid: isValidEmail(loginEmail), 
                error: null 
            }),
            setLoginPassword: (loginPassword) => set({ loginPassword, error: null }),
            setRegName: (regName) => set({ regName, error: null }),
            setRegEmail: (regEmail) => set({ 
                regEmail, 
                isRegEmailValid: isValidEmail(regEmail), 
                error: null 
            }),
            setRegPassword: (regPassword) => set({ regPassword, error: null }),
            setRegConfirmPassword: (regConfirmPassword) => set({ regConfirmPassword, error: null }),
            setRegArea: (regArea) => set({ regArea, error: null }),
            setForgotEmail: (forgotEmail) => set({ forgotEmail, error: null }),
            setResetPassword: (resetPassword) => set({ resetPassword, error: null }),
            setResetConfirmPassword: (resetConfirmPassword) => set({ resetConfirmPassword, error: null }),

            loginSubmit: async () => {
                const { loginEmail, loginPassword } = get();
                if (!loginEmail.trim()) {
                    set({ error: { field: 'loginEmail', message: 'Enter your email.' } });
                    return false;
                }
                if (!loginPassword.trim()) {
                    set({ error: { field: 'loginPassword', message: 'Enter your password.' } });
                    return false;
                }
                if (!isValidEmail(loginEmail)) {
                    set({ error: { field: 'loginEmail', message: 'Enter a valid email address' } });
                    return false;
                }
                try {
                    const respuesta = await fetch(`${API_URL}/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: loginEmail, password: loginPassword })
                    });
                    const datos = await respuesta.json();
                    if (respuesta.ok) {
                        const token: string = datos.token;
                        const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
                        const decodedUser = JSON.parse(
                            atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '='))
                        ) as User;
                        let currentUser = decodedUser;
                        const usersResponse = await fetch(`${API_URL}/users`, {
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        });

                        if (usersResponse.ok) {
                            const usersData = await usersResponse.json();
                            const userFromList = Array.isArray(usersData.data)
                                ? usersData.data.find((item: User) => item.email === decodedUser.email)
                                : undefined;
                            if (userFromList) currentUser = { ...decodedUser, ...userFromList };
                        }

                        set({
                            token,
                            user: {
                                id: currentUser.id,
                                name: currentUser.name,
                                email: currentUser.email,
                                role: currentUser.role,
                                area_id: currentUser.area_id
                            },
                            isAuthenticated: true,
                            error: null
                        });
                        useToastStore.getState().addToast('Logged in successfully!', 'success');
                        return true;
                    } else {
                        set({
                            error: {
                                field: 'loginPassword',
                                message: datos.message || datos.error || datos.mensaje || 'Email or password are incorrect.'
                            },
                            isAuthenticated: false
                        });
                        return false;
                    }
                } catch (error) {
                    set({ error: { field: 'loginPassword', message: 'Server connection error.' } });
                    return false;
                }
            },

            createAccount: async () => {
                const { regName, regEmail, regPassword, regConfirmPassword, regArea } = get();

                if (!regName.trim()) {
                    set({ error: { field: 'regName', message: 'Enter your name' } });
                    return null;
                }
                if (!isValidEmail(regEmail)) {
                    set({ error: { field: 'regEmail', message: 'Enter a valid email address' } });
                    return null;
                }
                if (regPassword.length < 8) {
                    set({ error: { field: 'regPassword', message: 'Password must be at least 8 characters.' } });
                    return null;
                }
                if (regPassword !== regConfirmPassword) {
                    set({ error: { field: 'regConfirmPassword', message: "Passwords don't match" } });
                    return null;
                }
                if (!regArea) {
                    set({ error: { field: 'regArea', message: 'Area is required.' } });
                    return null;
                }

                try {
                    const respuesta = await fetch(`${API_URL}/auth/register`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: regName, email: regEmail, password: regPassword, area_id: 1 })
                    });
                    const datos = await respuesta.json();
                    if (respuesta.ok) {
                        const successMessage = 'Account created, please wait to be approved';
                        set({ activeForm: 'login', error: null, regName: '', regEmail: '', regPassword: '', regConfirmPassword: '' });
                        useToastStore.getState().addToast(successMessage, 'success');
                        return successMessage;
                    } else {
                        set({ 
                            error: { field: 'regArea', message: datos.message || datos.error || 'Registration failed.' } 
                        });
                        return null;
                    }
                } catch (error) {
                    set({ error: { field: 'regArea', message: 'Server connection error.' } });
                    return null;
                }
            },

            sendResetLink: async () => {
                const { forgotEmail } = get();
                if (!forgotEmail.trim()) {
                    set({ error: { field: 'forgotEmail', message: 'Enter your email.' } });
                    return false;
                }
                if (!forgotEmail.includes('@')) {
                    set({ error: { field: 'forgotEmail', message: 'Enter a valid email address' } });
                    return false;
                }
                try {
                    const respuesta = await fetch(`${API_URL}/auth/forgot-password`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: forgotEmail })
                    });
                    if (respuesta.ok) {
                        set({ error: null, forgotEmail: '' });
                        useToastStore.getState().addToast('Reset link sent!', 'success');
                        return true;
                    } else {
                        const datos = await respuesta.json();
                        set({

                            error: {
                                field: 'forgotEmail',
                                message: datos.message || datos.error || datos.mensaje || 'Could not send reset link.'
                            }
                        });
                        return false;
                    }
                } catch (error) {
                    set({ error: { field: 'forgotEmail', message: 'Server connection error.' } });
                    return false;
                }
            },
            confirmResetPassword: async (token: string) => {
                const { resetPassword, resetConfirmPassword } = get();
                if (!resetPassword.trim()) {
                    set({ error: { field: 'resetPassword', message: 'Enter a new password' } });
                    return false;
                }
                if (resetPassword.length < 8) {
                    set({ error: { field: 'resetPassword', message: 'Your new password must be at least 8 characters.' } });
                    return false;
                }
                if (resetPassword !== resetConfirmPassword) {
                    set({ error: { field: 'resetConfirmPassword', message: "Passwords don't match" } });
                    return false;
                }
                try {

                    const respuesta = await fetch(`${API_URL}/auth/reset-password`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token, password: resetPassword })
                    });
                    const datos = await respuesta.json();

                    if (respuesta.ok) {
                        useToastStore.getState().addToast('Password reset successfully!', 'success');
                        set({ activeForm: 'login', resetPassword: '', resetConfirmPassword: '', forgotEmail: '', error: null });
                        return true;
                    } else {
                        set({
                            error: {
                                field: 'resetPassword',
                                message: datos.message || datos.error || datos.mensaje || 'Invalid or expired reset link.'
                            }
                        });
                        return false;
                    }
                } catch (error) {
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
                regName: '',
                regEmail: '',
                regPassword: '',
                regConfirmPassword: '',
                forgotEmail: '',
                resetPassword: '',
                resetConfirmPassword: ''
            }),
        }),
        {
            name: 'User-Storage',
            partialize: (state) => ({
                isAuthenticated: state.isAuthenticated,
                token: state.token,
                user: state.user,
            })
        }
    )
);