// ── Changement de statut via le <select> ─────────────────────────────────────
// Le bookId est stocké dans data-book-id sur l'élément <select>
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

// ── Suppression du livre de la collection ────────────────────────────────────
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