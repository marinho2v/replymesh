import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Icon } from "../components/ui/Icon.jsx";
import { api, getAuthToken, saveSession } from "../services/api.js";

export function Login({ onLogin, onToast }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (getAuthToken()) {
    return <Navigate to={location.state?.from || "/dashboard"} replace />;
  }

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const data = await api.login(email, password);
      saveSession(data);
      onLogin?.(data);
      onToast?.("Login realizado com sucesso", "ok");
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
      onToast?.(err.message, "err");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={submit}>
        <div className="login-brand">
          <div className="login-logo">
            <img src="/mark.png" alt="" />
          </div>
          <div>
            <div className="login-title">Replymesh</div>
            <div className="login-sub">Painel Master</div>
          </div>
        </div>

        <div className="field">
          <label>E-mail</label>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
        </div>
        <div className="field">
          <label>Senha</label>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
        </div>

        {error && <div className="login-error"><Icon name="CircleAlert" size={14} /> {error}</div>}

        <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: "100%" }}>
          {submitting ? <><Icon name="LoaderCircle" size={16} className="spin" /> Entrando...</> : <><Icon name="LogIn" size={17} /> Entrar</>}
        </button>
      </form>
    </div>
  );
}
