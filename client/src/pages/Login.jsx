import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Login() {
  const { user, login } = useAuth();
  const { t, lang, toggleLang } = useLanguage();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1>🏪 {t('login.title')}</h1>
          <p>{t('login.description')}</p>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label htmlFor="username">{t('login.username')}</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder={t('login.usernamePlaceholder')}
              autoFocus
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">{t('login.password')}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t('login.passwordPlaceholder')}
              required
              className="form-input"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? t('login.loading') : t('login.button')}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button className="btn btn-sm" onClick={toggleLang} type="button">
            🌐 {lang === 'ko' ? 'English' : '한국어'}
          </button>
        </div>
      </div>
    </div>
  );
}
