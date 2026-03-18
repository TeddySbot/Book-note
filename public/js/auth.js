function handleCredentialResponse(response) {
    fetch('/auth/google', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ credential: response.credential })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            window.location.reload();
        } else {
            console.error('Erreur de connexion:', data.error);
        }
    })
    .catch(error => {
        console.error('Erreur:', error);
    });
}

// Initialiser le bouton Google après le chargement
window.onload = function() {
    if (typeof google !== 'undefined') {
        google.accounts.id.initialize({
            client_id: document.getElementById('g_id_onload')?.dataset.clientId,
            callback: handleCredentialResponse
        });
        google.accounts.id.renderButton(
            document.getElementById('buttonDiv'),
            { theme: 'outline', size: 'large' }
        );
    }
};

// ── Dropdown Auth ──────────────────────────────────────────────────────
function toggleAuthDropdown() {
    document.getElementById('authMenu').classList.toggle('open');
}

// Ferme si clic en dehors
document.addEventListener('click', (e) => {
    const dropdown = document.querySelector('.auth-dropdown');
    if (dropdown && !dropdown.contains(e.target)) {
        document.getElementById('authMenu')?.classList.remove('open');
    }
});

function switchTab(tab, btn) {
    document.querySelectorAll('.auth-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-login').classList.toggle('hidden', tab !== 'login');
    document.getElementById('tab-register').classList.toggle('hidden', tab !== 'register');
}

async function submitLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errEl = document.getElementById('login-error');
    errEl.textContent = '';

    const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success) {
        window.location.reload();
    } else {
        errEl.textContent = data.error || 'Erreur de connexion';
    }
}

async function submitRegister() {
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const errEl = document.getElementById('reg-error');
    errEl.textContent = '';

    const res = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username })
    });
    const data = await res.json();
    if (data.success) {
        window.location.reload();
    } else {
        errEl.textContent = data.error || 'Erreur inscription';
    }
}