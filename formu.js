document.addEventListener('DOMContentLoaded', () => {
    // Application du thème
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') document.body.classList.add('light-mode');

    const loginForm = document.getElementById('loginForm');
    const errorMsg = document.getElementById('errorMsg');

    // J'AI SUPPRIMÉ LA REDIRECTION AUTOMATIQUE ICI.
    // La page de connexion s'affichera TOUJOURS, même si l'utilisateur est connecté.

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        // VÉRIFICATION DES IDENTIFIANTS (SIMULATION)
        // Identifiant : admin / Mot de passe : admin123
        if (username === 'yaya' && password === 'djomo123') {
            // Connexion réussie
            localStorage.setItem('bme_user_logged', 'true');
            localStorage.setItem('bme_user_name', username);
            window.location.href = 'dash.html'; // Redirection vers le dashboard
        } else {
            // Échec de la connexion
            errorMsg.style.display = 'block';
            document.getElementById('password').value = ''; // Vide le mot de passe
        }
    });
});