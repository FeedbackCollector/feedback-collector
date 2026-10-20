import { useLoginForm } from "../store/authStore";
import {useRegisterForm} from "../store/authStore";
// import "../styles/Login.css"

function Login() {
    const email = useLoginForm((state) => state.email)
    const password = useLoginForm((state) => state.password)
    const error = useLoginForm((state) => state.error)

    const setEmailInput = useLoginForm((state) => state.setEmailInput)
    const setPasswordInput = useLoginForm((state) => state.setPasswordInput)
    const loginSubmit = useLoginForm((state) => state.loginSubmit)


    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();


        const success = loginSubmit();

        if (success) {
            console.log("Logged in successfully!");

        }
    }

    return (
        <div className="feedback-container">

            <h1 className="tittle"> Feedback Collector</h1>
            <label>Track feedback and performance for your team</label>

            {error && <p className="error-message" style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

            <div className="login">
                <form onSubmit={onSubmit}>
                    <input
                        className="input-name"
                        type="text"
                        onChange={(e) => setEmailInput(e.target.value)}
                    />
                    <input
                        className="input-password"
                        type="password"
                        onChange={(e) => setPasswordInput(e.target.value)}
                    />
                    <button className="btn-get-into" type="submit">
                        Sign In
                    </button>
                </form>
            </div>

            <div className="register">
                <form onSubmit={onSubmit}>
                    <input
                        className="input-name"
                        type="text"
                        onChange={(e) => setEmailInput(e.target.value)}
                    />
                    <input
                        className="input-email"
                        type="email"
                        onChange={(e) => setEmailInput(e.target.value)}
                    />
                    <input
                        className="input-password"
                        type="password"
                        onChange={(e) => setPasswordInput(e.target.value)}
                    />
                    <input
                        className="input-confirmPassword"
                        type="password"
                        onChange={(e) => setPasswordInput(e.target.value)}
                    />

                    {/* falta agregar un desplegar del area del user */}

                    <button className="btn-get-into" type="submit">
                        Create Account
                    </button>
                </form>

            </div>

        </div>
    )
}

export default Login;