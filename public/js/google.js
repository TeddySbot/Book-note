function handleCredentialResponse(response) {
    fetch("/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ credential: response.credential })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            location.reload(); // Recharge pour afficher la session
        } else {
            alert("Erreur : " + data.error);
        }
    });
}

window.onload = function() {
    const clientId = document.getElementById('g_id_onload').dataset.client_id;

    google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse
    });
    google.accounts.id.renderButton(
        document.getElementById("buttonDiv"),
        { theme: "outline", size: "large" }
    );
};
