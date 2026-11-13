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

export type FormType = 'login' | 'register';

export interface TypeError {
    field: string;
    message: string;
}

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
    setLoginEmail: (email: string) => void;
    setLoginPassword: (password: string) => void;
    loginSubmit: () => Promise<boolean>; 
    regName: string;
    regEmail: string;
    regPassword: string;
    regConfirmPassword: string;
    setRegName: (name: string) => void;
    setRegEmail: (email: string) => void;
    setRegPassword: (password: string) => void;
    setRegConfirmPassword: (confirmPassword: string) => void;
    createAccount: () => Promise<boolean>; 
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
            regName: '',
            regEmail: '',
            regPassword: '',
            regConfirmPassword: '',

            switchForm: (form) => set({ activeForm: form, error: null }),
            clearError: () => set({ error: null }),

            setLoginEmail: (loginEmail) => set({ loginEmail, error: null }),
            setLoginPassword: (loginPassword) => set({ loginPassword, error: null }),

            setRegName: (regName) => set({ regName, error: null }),
            setRegEmail: (regEmail) => set({ regEmail, error: null }),
            setRegPassword: (regPassword) => set({ regPassword, error: null }),
            setRegConfirmPassword: (regConfirmPassword) => set({ regConfirmPassword, error: null }),

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
                if (!loginEmail.includes('@')) {
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
                        // esto es para decodificar el token
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
                            error: { field: 'loginPassword', message: datos.message || datos.error || datos.mensaje || 'Email or password are incorrect.' },
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
                const { regName, regEmail, regPassword, regConfirmPassword } = get();

                if (!regName.trim()) {
                    set({ error: { field: 'regName', message: 'Enter your name' } });
                    return false;
                }
                if (!regEmail.includes('@')) {
                    set({ error: { field: 'regEmail', message: 'Enter a valid email address' } });
                    return false;
                }
                if (regPassword.length < 8) {
                    set({ error: { field: 'regPassword', message: 'Password must be at least 8 characters.' } });
                    return false;
                }
                if (regPassword !== regConfirmPassword) {
                    set({ error: { field: 'regConfirmPassword', message: "Passwords don't match" } });
                    return false;
                }
                try {
                    const respuesta = await fetch(`${API_URL}/auth/register`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: regName, email: regEmail, password: regPassword, area_id: 1 })
                    });

                    const datos = await respuesta.json();

                    if (respuesta.ok) {
                        set({ 
                            activeForm: 'login', 
                            error: null,
                            regName: '',
                            regEmail: '',
                            regPassword: '',
                            regConfirmPassword: ''
                        }); 
                        useToastStore.getState().addToast('Account created successfully! Please log in.', 'success');
                        return true;
                    } else {
                        set({ error: { field: 'regEmail', message: datos.message || datos.error || datos.mensaje || 'Error creating account.' } });
                        return false;
                    }
                } catch (error) {
                    set({ error: { field: 'regName', message: 'Server connection error.' } });
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
                regConfirmPassword: ''
            }),
        }),
        { name: 'User-Storage' }
    )
);
