import { create } from 'zustand'
import { persist } from 'zustand/middleware';
import UserData from '../data/userData.json'; 

interface LoginProps {
    email: string;
    password: string;
    isAuthenticated: boolean; 
    error: string;            
    setPasswordInput: (password: string) => void;
    setEmailInput: (email: string) => void;
    loginSubmit: () => boolean; 
    logout: () => void;
}

interface RegisterProps {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    isAuthenticated: boolean; 
    error: string;        
    setNameInput: (name: string) => void;    
    setEmailInput: (email: string) => void;
    setPasswordInput: (password: string) => void;
    setConfirmPasswordInput: (confirmPassword: string) => void;
    createAccount: () => void;
    loginSubmit: () => boolean; 
    logout: () => void;
}



export const useLoginForm = create<LoginProps>()(
    persist(
        (set, get) => ({
            
            email: '',
            password: '',
            isAuthenticated: false,
            error: '',

            setPasswordInput: (password) => set({ password, error: '' }), 
            setEmailInput: (email) => set({ email, error: '' }),

            loginSubmit: () => {
                const { email, password } = get();

                
                if (!email.trim() || !password.trim()) {
                    set({ error: 'Please, complete all fields.' });
                    return false;
                }

                
                const userFound = UserData.credentials.find(
                    (user) => user.email === email && user.password === password
                );

                if (userFound) {
                    set({ isAuthenticated: true, error: '' });
                    return true; // Datos correctos
                } else {
                    set({ error: 'Email or password are incorrect.', isAuthenticated: false });
                    return false; // Datos incorrectos
                }
            },

            logout: () => set({ password: '', email: '', isAuthenticated: false, error: '' }),
        }), 
        { name: 'User-Storage' }
    )
)

export const useRegisterForm = create<RegisterProps>() (

    persist(
        (set, get) => ({
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            isAuthenticated: false,
            error: '',

            setPasswordInput: (password) => set({ password, error: '' }), 
            setEmailInput: (email) => set({ email, error: '' }),
            setNameInput: (name) => set({ name, error: '' }),
            setConfirmPasswordInput: (confirmPassword) => set({ confirmPassword, error: '' }),

            createAccount: () => {
                const { email, password, confirmPassword, name } = get();

                if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
                    set({ error: 'Please, complete all fields.' });
                    return;
                }

                if (password !== confirmPassword) {
                    set({ error: 'Passwords do not match.' });
                    return;
                }

                //Aca hay que cambiarlo y llamar a la API, no al JSON
                // UserData.credentials.push({ email, password, name });
                // set({ error: 'Account created successfully.' });
            },

           
            loginSubmit: () => {
                
                return false; 
            },

            logout: () => set({ name: '', email: '', password: '', confirmPassword: '', isAuthenticated: false, error: '' }),
        }), 
        { name: 'User-Storage' }
)
)