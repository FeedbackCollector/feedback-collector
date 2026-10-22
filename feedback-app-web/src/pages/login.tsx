import { useAuthStore } from "../store/authStore"; 
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (activeForm === 'login') {
            const success = loginSubmit();
            if (success) console.log("Logged in successfully!");
        } else {
            const success = createAccount();
            if (success) console.log("Account created successfully!");
        }
    };

    if (isAuthenticated) {
        return (
            <div className="feedback-container authenticated">
                <h1 className="tittle">Welcome to Feedback Collector</h1>
                <p>You are logged in successfully.</p>
                <button className="btn-get-into" onClick={logout}>
                    Logout
                </button>
            </div>
        );
    }

    return (
        <div className="feedback-container">
            <h1 className="tittle">Feedback Collector</h1>
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

            {error && <p className="error-message">{error}</p>}

            
            <form onSubmit={handleSubmit} className="auth-form">
                
                
                <div className={`form-group ${activeForm === 'register' ? 'show' : ''}`}>
                    <input
                        className="input-name"
                        type="text"
                        placeholder="Name"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                    />
                </div>

               
                <div className="form-group show">
                    <input
                        className="input-name"
                        type="text"
                        placeholder="Email"
                        value={activeForm === 'login' ? loginEmail : regEmail}
                        onChange={(e) => activeForm === 'login' ? setLoginEmail(e.target.value) : setRegEmail(e.target.value)}
                    />
                </div>

                
                <div className="form-group show">
                    <input
                        className="input-password"
                        type="password"
                        placeholder="Password"
                        value={activeForm === 'login' ? loginPassword : regPassword}
                        onChange={(e) => activeForm === 'login' ? setLoginPassword(e.target.value) : setRegPassword(e.target.value)}
                    />
                </div>

                
                <div className={`form-group ${activeForm === 'register' ? 'show' : ''}`}>
                    <input
                        className="input-password"
                        type="password"
                        placeholder="Confirm Password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                    />
                </div>

                <button className="btn-get-into" type="submit">
                    {activeForm === 'login' ? 'Sign In' : 'Sign Up'}
                </button>
            </form>
        </div>
    );
}

export default Login;
