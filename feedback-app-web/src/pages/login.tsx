import { useAuthStore } from "../store/authStore";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
// @ts-ignore CSS files are handled by the bundler.
import "../styles/login.css";

function Login() {
    const activeForm = useAuthStore((state) => state.activeForm);
    const error = useAuthStore((state) => state.error);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const switchForm = useAuthStore((state) => state.switchForm);
    const logout = useAuthStore((state) => state.logout);

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


    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate("/", { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (activeForm === 'login') {
            loginSubmit();
        } else {
            createAccount();
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
                        onClick={() => switchForm('login')}
                    >
                        Login
                    </button>
                    <button
                        type="button"
                        className={`tab-btn ${activeForm === 'register' ? 'active' : ''}`}
                        onClick={() => switchForm('register')}
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
                            className={`input-name ${
                                (error?.field === 'loginEmail' || error?.field === 'regEmail') ? 'input-invalid' : ''
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
                                className={`input-password ${
                                    (error?.field === 'loginPassword' || error?.field === 'regPassword') ? 'input-invalid' : ''
                                }`}
                                type="password"
                                value={activeForm === 'login' ? loginPassword : regPassword}
                                onChange={(e) => activeForm === 'login' ? setLoginPassword(e.target.value) : setRegPassword(e.target.value)}
                            />
                            {activeForm === 'login' && error?.field === 'loginPassword' && <span className="field-error">{error.message}</span>}
                            {activeForm === 'register' && error?.field === 'regPassword' && <span className="field-error">{error.message}</span>}
                        </div>

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
                        <select className="select-area" defaultValue="Design">
                            <option value="Design">Design</option>
                            <option value="Delivery">Delivery</option>
                            <option value="Engineering">Engineering</option>
                            <option value="Product">Product</option>
                        </select>
                    </div>

                    <button className="btn-get-into" type="submit">
                        {activeForm === 'login' ? 'Sign In' : 'Create Account'}
                    </button>
                </form>

            </div>
        </div>
    );
}

export default Login;
