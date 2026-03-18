const statusSelect = document.getElementById('bookStatus');

if (statusSelect) {
    statusSelect.addEventListener('change', async function() {
        if (!this.value) return;
        
        try {
            const response = await fetch('/books/status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    api_book_id: statusSelect.dataset.bookId,
                    status: this.value
                })
            });
            
            const data = await response.json();
            if (response.ok) {
                alert(data.message || 'État enregistré !');
            } else {
                console.error('Erreur:', data.error);
                alert('Erreur lors de l\'enregistrement du statut');
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de l\'enregistrement du statut');
        }
    });
}

// Changement de statut via le <select>
const select = document.getElementById('bookStatus');
if (select) {
    select.addEventListener('change', async () => {
        const status = select.value;
        const bookId = select.dataset.bookId;
        if (!status) return;

        await fetch('/books/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_book_id: bookId, status }),
        });

        // Recharge la page pour afficher le nouveau statut
        window.location.reload();
    });
}

// Suppression du statut
const removeBtn = document.getElementById('removeStatus');
if (removeBtn) {
    removeBtn.addEventListener('click', async () => {
        const bookId = removeBtn.dataset.bookId;

        await fetch('/books/status/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_book_id: bookId }),
        });

        window.location.reload();
    });
}