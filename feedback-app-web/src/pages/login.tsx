import { useAuthStore } from "../store/authStore";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// @ts-ignore CSS files are handled by the bundler.
import "../styles/login.css";
import { obtainAreas, type Area } from "../service/ObtainAreas";
import DropdownSelect from '../components/DropdownSelect';

function Login() {
    const activeForm = useAuthStore((state) => state.activeForm);
    const error = useAuthStore((state) => state.error);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const switchForm = useAuthStore((state) => state.switchForm);
    const logout = useAuthStore((state) => state.logout);
    const clearError = useAuthStore((state) => state.clearError);

    const loginEmail = useAuthStore((state) => state.loginEmail);
    const loginPassword = useAuthStore((state) => state.loginPassword);
    const setLoginEmail = useAuthStore((state) => state.setLoginEmail);
    const setLoginPassword = useAuthStore((state) => state.setLoginPassword);
    const loginSubmit = useAuthStore((state) => state.loginSubmit);

    const regName = useAuthStore((state) => state.regName);
    const regEmail = useAuthStore((state) => state.regEmail);
    const regPassword = useAuthStore((state) => state.regPassword);
    const regConfirmPassword = useAuthStore((state) => state.regConfirmPassword);

    const setRegName = useAuthStore((state) => state.setRegName);
    const setRegEmail = useAuthStore((state) => state.setRegEmail);
    const setRegPassword = useAuthStore((state) => state.setRegPassword);
    const setRegConfirmPassword = useAuthStore((state) => state.setRegConfirmPassword);
    const createAccount = useAuthStore((state) => state.createAccount);

    const [areas, setAreas] = useState<Area[]>([]);
    const [selectedArea, setSelectedArea] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate("/", { replace: true });
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        Promise.allSettled([obtainAreas()])
            .then(([areaResult]) => {
                if (areaResult.status === 'fulfilled') {
                    setAreas(areaResult.value);
                    setSelectedArea(areaResult.value?.[0]?.name ?? '');
                } else {
                    const message = areaResult.reason instanceof Error
                        ? areaResult.reason.message
                        : String(areaResult.reason);
                    console.error('Could not load areas:', message);
                }
            });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (activeForm === 'login') {
            if (isLoggingIn) return;
            setIsLoggingIn(true);
            try {
                await loginSubmit();
            } finally {
                setIsLoggingIn(false);
            }
        } else {
            await createAccount();
        }
    };

    if (isAuthenticated) {
        return (
            <div className="login-page">
                <div className="feedback-container authenticated">
                    <h1 className="tittle">Welcome to Feedback Collector</h1>
                    <p>You are logged in successfully.</p>
                    <button className="btn-get-into" onClick={logout}>
                        Logout
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="login-page">
            <div className="feedback-container">
                <div className="brand-header">
                    <div className="brand-icon">
                        <span className="material-symbols-outlined">chat</span>
                    </div>
                    <h1 className="tittle">Feedback Collector</h1>
                </div>
                <label className="subtitle">Track feedback and performance for your team</label>

                <div className="switch-tabs">
                    <button
                        type="button"
                        className={`tab-btn ${activeForm === 'login' ? 'active' : ''}`}
                        onClick={() => {
                            clearError();
                            switchForm('login');
                        }}
                    >
                        Login
                    </button>
                    <button
                        type="button"
                        className={`tab-btn ${activeForm === 'register' ? 'active' : ''}`}
                        onClick={() => {
                            clearError();
                            switchForm('register');
                        }}
                    >
                        Register
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="auth-form" noValidate>
                    <div className={`form-group ${activeForm === 'register' ? 'show' : ''}`}>
                        <label className="label-field">Name</label>
                        <input
                            className={`input-name ${error?.field === 'regName' ? 'input-invalid' : ''}`}
                            type="text"
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                        />
                        {error?.field === 'regName' && <span className="field-error">{error.message}</span>}
                    </div>

                    <div className="form-group show">
                        <label className="label-field">Email</label>
                        <input
                            className={`input-name ${(error?.field === 'loginEmail' || error?.field === 'regEmail') ? 'input-invalid' : ''
                                }`}
                            type="email"
                            value={activeForm === 'login' ? loginEmail : regEmail}
                            onChange={(e) => activeForm === 'login' ? setLoginEmail(e.target.value) : setRegEmail(e.target.value)}
                        />
                        {activeForm === 'login' && error?.field === 'loginEmail' && <span className="field-error">{error.message}</span>}
                        {activeForm === 'register' && error?.field === 'regEmail' && <span className="field-error">{error.message}</span>}
                    </div>

                    <div className={activeForm === 'register' ? 'form-row' : ''}>
                        <div className="form-group show">
                            <label className="label-field">Password</label>
                            <input
                                className={`input-password ${(error?.field === 'loginPassword' || error?.field === 'regPassword') ? 'input-invalid' : ''
                                    }`}
                                type="password"
                                value={activeForm === 'login' ? loginPassword : regPassword}
                                onChange={(e) => activeForm === 'login' ? setLoginPassword(e.target.value) : setRegPassword(e.target.value)}
                            />
                            {activeForm === 'login' && error?.field === 'loginPassword' && <span className="span field-error">{error.message}</span>}
                            {activeForm === 'register' && error?.field === 'regPassword' && <span className="span field-error">{error.message}</span>}
                        </div>

                        {activeForm === 'login' && (
                            <div className="forgot-link-wrapper">
                                <button
                                    type="button"
                                    className="btn-forgot-link"
                                    onClick={() => {
                                        clearError();
                                        navigate('/forgot-password');
                                    }}
                                >
                                    Forgot password?
                                </button>
                            </div>
                        )}

                        <div className={`form-group ${activeForm === 'register' ? 'show' : ''}`}>
                            <label className="label-field">Confirm Password</label>
                            <input
                                className={`input-password ${error?.field === 'regConfirmPassword' ? 'input-invalid' : ''}`}
                                type="password"
                                value={regConfirmPassword}
                                onChange={(e) => setRegConfirmPassword(e.target.value)}
                            />
                            {error?.field === 'regConfirmPassword' && <span className="field-error">{error.message}</span>}
                        </div>
                    </div>

                    <div className={`form-group ${activeForm === 'register' ? 'show' : ''}`}>
                        <label className="label-field">Area</label>
                        <DropdownSelect
                            id="register-area"
                            label="Area"
                            value={selectedArea}
                            options={areas.map((area) => ({
                                value: area.name,
                                label: area.name,
                            }))}
                            onChange={setSelectedArea}
                        />
                    </div>

                    <button className="btn-get-into" type="submit" disabled={isLoggingIn} style={{ opacity: isLoggingIn ? 0.55 : 1 }}>
                        {activeForm === 'login' ? (isLoggingIn ? 'Signing In...' : 'Sign In') : 'Create Account'}
                    </button>
                </form>
            </div>
        </div>
    );
}
export default Login;