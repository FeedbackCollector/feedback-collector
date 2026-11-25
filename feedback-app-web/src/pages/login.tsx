import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { obtainAreas, type Area } from "../service/ObtainAreas";
import DropdownSelect from "../components/DropdownSelect";
import "../styles/login.css";

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
    const regArea = useAuthStore((state) => state.regArea);
    const isRegEmailValid = useAuthStore((state) => state.isRegEmailValid);

    const setRegName = useAuthStore((state) => state.setRegName);
    const setRegEmail = useAuthStore((state) => state.setRegEmail);
    const setRegPassword = useAuthStore((state) => state.setRegPassword);
    const setRegConfirmPassword = useAuthStore((state) => state.setRegConfirmPassword);
    const setRegArea = useAuthStore((state) => state.setRegArea);
    const createAccount = useAuthStore((state) => state.createAccount);

    const [areas, setAreas] = useState<Area[]>([]);
    const [isLoadingAreas, setIsLoadingAreas] = useState(false);
    const [areasError, setAreasError] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate("/", { replace: true });
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        let isMounted = true;

        const loadAreas = async () => {
            setIsLoadingAreas(true);
            setAreasError(false);

            try {
                const result = await obtainAreas();
                if (isMounted) setAreas(result);
            } catch (err) {
                console.error("Could not load areas:", err);
                if (isMounted) setAreasError(true);
            } finally {
                if (isMounted) setIsLoadingAreas(false);
            }
        };

        loadAreas();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            if (activeForm === "login") {
                await loginSubmit();
            } else {
                await createAccount();
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const isLoginMode = activeForm === "login";

    const hasEmailError = isLoginMode
        ? error?.field === "loginEmail"
        : error?.field === "regEmail";

    const showRegisterEmailValid =
        !isLoginMode && isRegEmailValid && !hasEmailError;

    const hasAreaError = error?.field === "regArea";
    const showAreaValid = !isLoginMode && regArea !== "" && !hasAreaError;

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

                <label className="subtitle">
                    Track feedback and performance for your team
                </label>

                <div className="switch-tabs">
                    <button
                        type="button"
                        className={`tab-btn ${isLoginMode ? "active" : ""}`}
                        onClick={() => {
                            clearError();
                            switchForm("login");
                        }}
                    >
                        Login
                    </button>
                    <button
                        type="button"
                        className={`tab-btn ${!isLoginMode ? "active" : ""}`}
                        onClick={() => {
                            clearError();
                            switchForm("register");
                        }}
                    >
                        Register
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="auth-form" noValidate>
                    <div className={`form-group ${!isLoginMode ? "show" : ""}`}>
                        <label className="label-field">Name</label>
                        <input
                            className={`input-name ${error?.field === "regName" ? "input-invalid" : ""}`}
                            type="text"
                            value={regName}
                            onChange={(event) => setRegName(event.target.value)}
                            disabled={isSubmitting}
                        />
                        {error?.field === "regName" && (
                            <span className="field-error">{error.message}</span>
                        )}
                    </div>


                    <div className="form-group show">
                        <label className="label-field">Email</label>
                        <input
                            className={`input-name ${
                                hasEmailError
                                    ? "input-invalid"
                                    : showRegisterEmailValid
                                      ? "input-valid"
                                      : ""
                            }`}
                            type="email"
                            value={isLoginMode ? loginEmail : regEmail}
                            onChange={(event) =>
                                isLoginMode
                                    ? setLoginEmail(event.target.value)
                                    : setRegEmail(event.target.value)
                            }
                            disabled={isSubmitting}
                        />
                        {hasEmailError && (
                            <span className="field-error">{error?.message}</span>
                        )}
                        {showRegisterEmailValid && (
                            <span className="field-valid">Email format is valid</span>
                        )}
                    </div>

                    <div className={!isLoginMode ? "form-row" : ""}>
                        <div className="form-group show">
                            <label className="label-field">Password</label>
                            <input
                                className={`input-password ${
                                    error?.field === "loginPassword" || error?.field === "regPassword"
                                        ? "input-invalid"
                                        : ""
                                }`}
                                type="password"
                                value={isLoginMode ? loginPassword : regPassword}
                                onChange={(event) =>
                                    isLoginMode
                                        ? setLoginPassword(event.target.value)
                                        : setRegPassword(event.target.value)
                                }
                                disabled={isSubmitting}
                            />
                            {(error?.field === "loginPassword" || error?.field === "regPassword") && (
                                <span className="field-error">{error.message}</span>
                            )}
                        </div>

                        {isLoginMode && (
                            <div className="forgot-link-wrapper">
                                <button
                                    type="button"
                                    className="btn-forgot-link"
                                    onClick={() => {
                                        clearError();
                                        navigate("/forgot-password");
                                    }}
                                >
                                    Forgot password?
                                </button>
                            </div>
                        )}

                        <div className={`form-group ${!isLoginMode ? "show" : ""}`}>
                            <label className="label-field">Confirm Password</label>
                            <input
                                className={`input-password ${
                                    error?.field === "regConfirmPassword" ? "input-invalid" : ""
                                }`}
                                type="password"
                                value={regConfirmPassword}
                                onChange={(event) => setRegConfirmPassword(event.target.value)}
                                disabled={isSubmitting}
                            />
                            {error?.field === "regConfirmPassword" && (
                                <span className="field-error">{error.message}</span>
                            )}
                        </div>
                    </div>

                    <div className={`form-group ${!isLoginMode ? "show" : ""}`}>
                        <label className="label-field">Area</label>
                        <div
                            className={
                                hasAreaError
                                    ? "dropdown-invalid"
                                    : showAreaValid
                                      ? "dropdown-valid"
                                      : ""
                            }
                        >
                            <DropdownSelect
                                id="register-area"
                                label="Area"
                                value={regArea}
                                options={[
                                    { value: "", label: "Select an area" },
                                    ...areas.map((area) => ({
                                        value: String(area.id),
                                        label: area.name,
                                    })),
                                ]}
                                onChange={setRegArea}
                            />
                        </div>

                        {areasError && (
                            <span className="field-error">
                                Could not load areas. Please try again later.
                            </span>
                        )}
                        {showAreaValid && (
                            <span className="field-valid">Area selected.</span>
                        )}
                        {!showAreaValid && !areasError && (
                            <label className="subtitle" style={{ marginBottom: "0", marginTop: "5px" }}>
                                {isLoadingAreas
                                    ? "Loading areas..."
                                    : "Choose the area this IC belongs to."}
                            </label>
                        )}
                        {hasAreaError && (
                            <span className="field-error">{error?.message}</span>
                        )}
                    </div>

                    <button
                        className="btn-get-into"
                        type="submit"
                        disabled={isSubmitting || (!isLoginMode && (isLoadingAreas || areas.length === 0))}
                    >
                        {isSubmitting
                            ? isLoginMode
                                ? "Signing In..."
                                : "Creating Account..."
                            : isLoginMode
                              ? "Sign In"
                              : "Create Account"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;
