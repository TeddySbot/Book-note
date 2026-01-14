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