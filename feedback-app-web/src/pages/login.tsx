import { useAuthStore } from "../store/authStore"; 
// import "../styles/Login.css"

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


    const onLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const success = loginSubmit();
        if (success) {
            console.log("Logged in successfully!");
        }
    };

    const onRegisterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const success = createAccount();
        if (success) {
            console.log("Account created successfully!");
        }
    };


    if (isAuthenticated) {
        return (
            <div className="feedback-container" style={{ textAlign: 'center', padding: '2rem' }}>
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
            <label>Track feedback and performance for your team</label>


            {error && <p className="error-message" style={{ color: 'red', textAlign: 'center', margin: '10px 0' }}>{error}</p>}

            {activeForm === 'login' ? (

                <div className="login">
                    <button type="button" onClick={() => switchForm('register')}>
                        Register
                    </button>
                    <form onSubmit={onLoginSubmit}>
                        <input
                            className="input-name"
                            type="text"
                            placeholder="Email"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                        />
                        <input
                            className="input-password"
                            type="password"
                            placeholder="Password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                        />
                        <button className="btn-get-into" type="submit">
                            Sign In
                        </button>
                    </form>

                </div>
            ) : (

                <div className="register">
                    <button type="button" onClick={() => switchForm('login')}>
                        Login
                    </button>
                    <form onSubmit={onRegisterSubmit}>
                        <input
                            className="input-name"
                            type="text"
                            placeholder="Name"
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                        />
                        <input
                            className="input-email"
                            type="email"
                            placeholder="Email"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                        />
                        <input
                            className="input-password"
                            type="password"
                            placeholder="Password"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                        />
                        <input
                            className="input-confirmPassword"
                            type="password"
                            placeholder="Confirm Password"
                            value={regConfirmPassword}
                            onChange={(e) => setRegConfirmPassword(e.target.value)}
                        />

                        {/* Agregar el desplegable del área del usuario */}

                        <button className="btn-get-into" type="submit">
                            Create Account
                        </button>
                    </form>

                </div>
            )}
        </div>
    );
}

export default Login;
