import { useLoginForm } from "../store/authStore";
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
        <div className="login">
            <form onSubmit={onSubmit}>
                <h1 className="tittle">WikiMon</h1>
            
                
                {error && <p className="error-message" style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

                <input
                    className="input-name"
                    type="text"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmailInput(e.target.value)}
                />
                <input
                    className="input-password"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPasswordInput(e.target.value)}
                />
                <button className="btn-get-into" type="submit">
                    Get Into
                </button>
            </form>
        </div>
    )
}

export default Login;