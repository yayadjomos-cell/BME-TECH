document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. GESTION DU THÈME (SOMBRE / CLAIR)
  // ==========================================
  const themeToggle = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('theme') || 'dark';

  if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
    if (themeToggle) themeToggle.checked = false;
  } else {
    document.body.classList.remove('light-mode');
    if (themeToggle) themeToggle.checked = true;
  }

  if (themeToggle) {
    themeToggle.addEventListener('change', (e) => {
      if (e.target.checked) {
        document.body.classList.remove('light-mode');
        localStorage.setItem('theme', 'dark');
      } else {
        document.body.classList.add('light-mode');
        localStorage.setItem('theme', 'light');
      }
    });
  }

  // ==========================================
  // 2. GESTION DE LA SAUVEGARDE
  // ==========================================
  const btnBackup = document.getElementById('btnBackup');

  if (btnBackup) {
    btnBackup.addEventListener('click', () => {
      const originalHTML = btnBackup.innerHTML;
      btnBackup.disabled = true;
      btnBackup.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> SAUVEGARDE EN COURS...`;

      setTimeout(() => {
        const donneesSauvegarde = {
          dateSauvegarde: new Date().toLocaleString('fr-FR'),
          reparations: JSON.parse(localStorage.getItem('bme_historique_reparations')) || [],
          ventes: JSON.parse(localStorage.getItem('bme_historique_ventes')) || [],
          equipements: JSON.parse(localStorage.getItem('bme_equipements_vente')) || []
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(donneesSauvegarde, null, 2));
        const downloadAnchor = document.createElement('a');
        const dateJour = new Date().toISOString().split('T')[0];
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `BME_Technologie_Sauvegarde_${dateJour}.json`);
        
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();

        btnBackup.disabled = false;
        btnBackup.innerHTML = originalHTML;

        // On ouvre le popup de succès
        const modal = document.getElementById('modalNotif');
        if (modal) {
            modal.classList.add('active');
        }
      }, 1000);
    });
  }

  // ==========================================
  // 3. GESTION DU MENU MOBILE
  // ==========================================
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const closeMenuBtn = document.getElementById('close-menu-btn');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('mobile-overlay');

  if (mobileMenuBtn && sidebar && overlay) {
    mobileMenuBtn.addEventListener('click', () => {
      sidebar.classList.add('show');
      overlay.classList.add('show');
    });
    if (closeMenuBtn) {
      closeMenuBtn.addEventListener('click', () => {
        sidebar.classList.remove('show');
        overlay.classList.remove('show');
      });
    }
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('show');
      overlay.classList.remove('show');
    });
  }
});

// ==========================================
// 4. FERMETURE DE LA MODALE DE NOTIFICATION
// ==========================================
// C'est CETTE fonction qui manquait !
window.fermerNotif = function(event) {
  if (event) event.stopPropagation();
  const modal = document.getElementById('modalNotif');
  if (modal) modal.classList.remove('active');
};