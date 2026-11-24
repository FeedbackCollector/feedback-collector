import { useEffect, useState, type FormEvent } from 'react';
import {
  addPreApprovedEmail,
  listPreApprovedEmails,
  removePreApprovedEmail,
  type PreApprovedEmail,
} from '../service/ManagementApi';

function getErrorMessage(reason: unknown): string {
  return reason instanceof Error ? reason.message : 'Something went wrong.';
}

function PreApprovedEmails({ token }: { token: string | null }) {
  const [emails, setEmails] = useState<PreApprovedEmail[]>([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    setLoading(true);
    listPreApprovedEmails(token)
      .then((data) => {
        if (!cancelled) setEmails(data);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(getErrorMessage(reason));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!token || !normalized) return;

    setBusy(true);
    setError(null);
    try {
      await addPreApprovedEmail(normalized, token);
      setEmails(await listPreApprovedEmails(token));
      setEmail('');
    } catch (reason: unknown) {
      setError(getErrorMessage(reason));
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (item: PreApprovedEmail) => {
    if (!token) return;

    setBusy(true);
    setError(null);
    try {
      await removePreApprovedEmail(item.email, token);
      setEmails((current) => current.filter((entry) => entry.email !== item.email));
    } catch (reason: unknown) {
      setError(getErrorMessage(reason));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="management-pre-approved">
      <h3 className="management-requests-title">Invite Managers</h3>

      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px', margin: '12px 0' }}>
        <input
          type="email"
          className="input-control"
          placeholder="manager@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          disabled={busy}
          aria-label="Email to pre-approve"
        />
        <button type="submit" className="management-request-approve" disabled={busy || !email.trim()}>
          Add
        </button>
      </form>

      {error && (
        <p className="management-error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="management-empty-state">Loading pre-approved emails...</p>
      ) : emails.length === 0 ? (
        <p className="management-empty-state">No pre-approved emails.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {emails.map((item) => (
            <li key={item.email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              <span>{item.email}</span>
              <button
                type="button"
                className="management-request-delete"
                onClick={() => void handleRemove(item)}
                disabled={busy}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PreApprovedEmails;
