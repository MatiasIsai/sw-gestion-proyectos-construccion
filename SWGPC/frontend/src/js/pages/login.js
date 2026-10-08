import { login } from '../api/client.js';

export function renderLogin(app, onSuccess) {
  app.innerHTML = `
    <form id="login-form" class="card login-card">
      <h2>Iniciar sesión</h2>
      <label>Correo
        <input type="email" name="email" required autocomplete="username" />
      </label>
      <label>Contraseña
        <input type="password" name="password" required autocomplete="current-password" />
      </label>
      <p id="login-error" class="error" hidden></p>
      <button type="submit">Entrar</button>
    </form>
  `;

  const form = app.querySelector('#login-form');
  const errorBox = app.querySelector('#login-error');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.hidden = true;
    const button = form.querySelector('button');
    button.disabled = true;

    try {
      const { email, password } = Object.fromEntries(new FormData(form));
      const user = await login(email, password);
      onSuccess(user);
    } catch (error) {
      errorBox.textContent = error.message === 'Failed to fetch'
        ? 'No fue posible conectar con la API.'
        : error.message;
      errorBox.hidden = false;
      button.disabled = false;
    }
  });
}
