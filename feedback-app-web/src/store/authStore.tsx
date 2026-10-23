import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type FormType = 'login' | 'register';

export interface TypeError {
    field: string;
    message: string;
}

interface AuthState {
    activeForm: FormType;
    isAuthenticated: boolean;
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


const API_URL = 'https://feedback-api-latest-moe8.onrender.com/ics';

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            activeForm: 'login',
            isAuthenticated: false,
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
                    const respuesta = await fetch(`${API_URL}/login`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ email: loginEmail, password: loginPassword })
                    });

                    const datos = await respuesta.json();

                    if (respuesta.ok) {
                        set({ isAuthenticated: true, error: null });
                        return true;
                    } else {
                        set({ 
                            error: { field: 'loginPassword', message: datos.mensaje || 'Email or password are incorrect.' }, 
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
                    const respuesta = await fetch(`${API_URL}/usuarios`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ nombre: regName, email: regEmail, password: regPassword })
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
                        alert('Account created successfully! Please log in.');
                        return true;
                    } else {
                        set({ error: { field: 'regEmail', message: datos.mensaje || 'Error creating account.' } });
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
