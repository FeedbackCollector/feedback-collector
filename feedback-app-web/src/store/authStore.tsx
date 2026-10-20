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