
import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import '../styles/ResetPassword.css'

interface TypeError {
    field: string;
    message: string;
}

export default function ResetPassword() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()

    const token = searchParams.get('token')

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<TypeError | null>(null)
    const [success, setSuccess] = useState('')

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)
        setSuccess('')

        if (!token) {
            setError({
                field: 'token',
                message: 'The recovery link is not valid.'
            })
            return
        }

        if (password.length < 8) {
            setError({
                field: 'password',
                message: 'Password must be at least 8 characters.'
            })
            return
        }

        if (password !== confirmPassword) {
            setError({
                field: 'confirmPassword',
                message: 'Passwords do not match.'
            })
            return
        }

        try {
            setLoading(true)

            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/auth/reset-password`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        token,
                        password
                    })
                }
            )

            const data = await response.json()

            if (!response.ok) {
                throw new Error(
                    data.message || 'Could not update password.'
                )
            }

            setSuccess('Password updated successfully!')

            setTimeout(() => navigate('/'), 2000)

        } catch (err) {
            setError({
                field: 'global',
                message: err instanceof Error
                    ? err.message
                    : 'An error occurred.'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-page">
            <div className="feedback-container forgot-form">

                <div className="brand-header">
                    <div className="brand-icon">
                        <span className="material-symbols-outlined">chat</span>
                    </div>
                    <h1 className="tittle">Feedback Collector</h1>
                </div>

                <label className="subtitle">
                    Track feedback and performance for your team
                </label>

                <h2 className="forgot-title">Create a new password</h2>
                <p className="forgot-description">
                    Your new password must be at least 8 characters.
                </p>

                {error?.field === 'token' && (
                    <span className="field-error" style={{ marginBottom: '16px' }}>
                        {error.message}
                    </span>
                )}

                <form onSubmit={handleSubmit} className="auth-form" noValidate>

                    <div className="form-group-reset">
                        <label className="label-field" htmlFor="password">
                            New Password
                        </label>

                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value)
                                if (error?.field === 'password') setError(null)
                            }}
                            className={`input-password ${error?.field === 'password' ? 'input-invalid' : ''}`}
                            disabled={loading}
                            required
                        />

                        {error?.field === 'password' && (
                            <span className="field-error">{error.message}</span>
                        )}
                    </div>

                    <div className="form-group-reset">
                        <label className="label-field" htmlFor="confirmPassword">
                            Confirm New Password
                        </label>

                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value)
                                if (error?.field === 'confirmPassword') setError(null)
                            }}
                            className={`input-password ${error?.field === 'confirmPassword' ? 'input-invalid' : ''}`}
                            disabled={loading}
                            required
                        />

                        {error?.field === 'confirmPassword' && (
                            <span className="field-error">{error.message}</span>
                        )}
                    </div>

                    {error?.field === 'global' && (
                        <span className="field-error">{error.message}</span>
                    )}

                    {success && (
                        <div style={{ marginBottom: '16px' }}>
                            <span className="field-valid">{success}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn-get-into"
                        disabled={loading || !token}
                    >
                        {loading ? 'Updating...' : 'Reset Password'}
                    </button>
                </form>

                <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="btn-back-login"
                >
                    Back to sign in
                </button>
            </div>
        </div>
    )
}
