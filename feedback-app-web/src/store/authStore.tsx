import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import UserData from '../data/userData.json';


export type FormType = 'login' | 'register';

interface AuthState {

    activeForm: FormType;
    isAuthenticated: boolean;
    error: string;
    switchForm: (form: FormType) => void;
    clearError: () => void;


    loginEmail: string;
    loginPassword: string;
    setLoginEmail: (email: string) => void;
    setLoginPassword: (password: string) => void;
    loginSubmit: () => boolean;


    regName: string;
    regEmail: string;
    regPassword: string;
    regConfirmPassword: string;
    setRegName: (name: string) => void;
    setRegEmail: (email: string) => void;
    setRegPassword: (password: string) => void;
    setRegConfirmPassword: (confirmPassword: string) => void;
    createAccount: () => boolean;


    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({

            activeForm: 'login',
            isAuthenticated: false,
            error: '',

            loginEmail: '',
            loginPassword: '',
            regName: '',
            regEmail: '',
            regPassword: '',
            regConfirmPassword: '',


            switchForm: (form) => set({ activeForm: form, error: '' }),
            clearError: () => set({ error: '' }),


            setLoginEmail: (loginEmail) => set({ loginEmail, error: '' }),
            setLoginPassword: (loginPassword) => set({ loginPassword, error: '' }),


            setRegName: (regName) => set({ regName, error: '' }),
            setRegEmail: (regEmail) => set({ regEmail, error: '' }),
            setRegPassword: (regPassword) => set({ regPassword, error: '' }),
            setRegConfirmPassword: (regConfirmPassword) => set({ regConfirmPassword, error: '' }),


            loginSubmit: () => {
                const { loginEmail, loginPassword } = get();

                if (!loginEmail.trim() || !loginPassword.trim()) {
                    set({ error: 'Please, complete all fields.' });
                    return false;
                }


                const userFound = UserData.credentials.find(
                    (user) => user.email === loginEmail && user.password === loginPassword
                );

                if (userFound) {
                    set({ isAuthenticated: true, error: '' });
                    return true;
                } else {
                    set({ error: 'Email or password are incorrect.', isAuthenticated: false });
                    return false;
                }
            },


            createAccount: () => {
                const { regName, regEmail, regPassword, regConfirmPassword } = get();

                if (!regName.trim() || !regEmail.trim() || !regPassword.trim() || !regConfirmPassword.trim()) {
                    set({ error: 'Please, complete all fields.' });
                    return false;
                }

                if (regPassword !== regConfirmPassword) {
                    set({ error: 'Passwords do not match.' });
                    return false;
                }

                // Nota: Conectar API!!!. Por ahora simulamos
                set({ activeForm: 'login', error: '' }); // Te manda al login, despues de registrarte
                alert('Account created successfully! Please log in.');
                return true;
            },


            logout: () => set({
                activeForm: 'login',
                isAuthenticated: false,
                error: '',
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
