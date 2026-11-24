import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
// @ts-ignore CSS files are handled by the bundler.
import '../styles/login.css';

export function ForgotPassword() {
    const error = useAuthStore((state) => state.error);
    const clearError = useAuthStore((state) => state.clearError);

    const forgotEmail = useAuthStore((state) => state.forgotEmail);
    const setForgotEmail = useAuthStore((state) => state.setForgotEmail);
    const sendResetLink = useAuthStore((state) => state.sendResetLink);

    const resetPassword = useAuthStore((state) => state.resetPassword);
    const resetConfirmPassword = useAuthStore((state) => state.resetConfirmPassword);
    const setResetPassword = useAuthStore((state) => state.setResetPassword);
    const setResetConfirmPassword = useAuthStore((state) => state.setResetConfirmPassword);
    const confirmResetPassword = useAuthStore((state) => state.confirmResetPassword);

    const [emailSent, setEmailSent] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const resetToken = searchParams.get('token');

    useEffect(() => {
        clearError();
    }, [resetToken, clearError]);

    const handleBackToSignIn = () => {
        setForgotEmail('');
        setEmailSent(false);
        clearError();
        navigate('/');
    };

    const handleRequestLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const ok = await sendResetLink();
            if (ok) setEmailSent(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting || !resetToken) return;
        setIsSubmitting(true);
        try {
            const ok = await confirmResetPassword(resetToken);
            if (ok) navigate('/', { replace: true });
        } finally {
            setIsSubmitting(false);
        }
    };

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

                {/* PANTALLA 3: Restablecer contraseña con Token */}
                {resetToken ? (
                    <form onSubmit={handleResetPassword} className="auth-form forgot-form" noValidate>
                        <h2 className="forgot-title">Create a new password</h2>
                        <p className="forgot-description">
                            Your new password must be at least 8 characters.
                        </p>

                        <div className="form-group show">
                            <label className="label-field">NEW PASSWORD</label>
                            <input
                                className={`input-password ${error?.field === 'resetPassword' ? 'input-invalid' : ''}`}
                                type="password"
                                value={resetPassword}
                                onChange={(e) => setResetPassword(e.target.value)}
                            />
                            {error?.field === 'resetPassword' && (
                                <span className="field-error">{error.message}</span>
                            )}
                        </div>

                        <div className="form-group show">
                            <label className="label-field">CONFIRM NEW PASSWORD</label>
                            <input
                                className={`input-password ${error?.field === 'resetConfirmPassword' ? 'input-invalid' : ''}`}
                                type="password"
                                value={resetConfirmPassword}
                                onChange={(e) => setResetConfirmPassword(e.target.value)}
                            />
                            {error?.field === 'resetConfirmPassword' && (
                                <span className="field-error">{error.message}</span>
                            )}
                        </div>

                        <button className="btn-get-into" type="submit" disabled={isSubmitting} style={{ opacity: isSubmitting ? 0.55 : 1 }}>
                            {isSubmitting ? 'Resetting...' : 'Reset Password'}
                        </button>

                        <button type="button" className="btn-back-login" onClick={handleBackToSignIn}>
                            Back to sign in
                        </button>
                    </form>
                ) : emailSent ? (
                    /* PANTALLA 2: Correo enviado con éxito */
                    <div className="auth-form forgot-form">
                        <h2 className="forgot-title">Check your email</h2>
                        <p className="forgot-description">
                            If an account exists for <strong>{forgotEmail}</strong>, a reset link is on its way.
                        </p>

                        <button
                            type="button"
                            className="btn-outline-secondary"
                            onClick={handleBackToSignIn}
                        >
                            Back to sign in
                        </button>
                    </div>
                ) : (
                
                    <form onSubmit={handleRequestLink} className="auth-form forgot-form" noValidate>
                        <h2 className="forgot-title">Reset your password</h2>
                        <p className="forgot-description">
                            Enter the email for your account and we'll send you a reset link.
                        </p>

                        <div className="form-group show">
                            <label className="label-field">EMAIL</label>
                            <input
                                className={`input-name ${error?.field === 'forgotEmail' ? 'input-invalid' : ''}`}
                                type="email"
                                value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                            />
                            {error?.field === 'forgotEmail' && (
                                <span className="field-error">{error.message}</span>
                            )}
                        </div>

                        <button className="btn-get-into" type="submit" disabled={isSubmitting} style={{ opacity: isSubmitting ? 0.55 : 1 }}>
                            {isSubmitting ? 'Sending...' : 'Send reset link'}
                        </button>

                        <button type="button" className="btn-back-login" onClick={handleBackToSignIn}>
                            Back to sign in
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default ForgotPassword;