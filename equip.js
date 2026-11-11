// =========================================================
// SYSTÈME DE NOTIFICATION (TOAST)
// =========================================================
window.afficherToast = function(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) {
    alert(message);
    return;
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icone = 'fa-circle-info';
  if (type === 'success') icone = 'fa-circle-check';
  if (type === 'error') icone = 'fa-circle-exclamation';

  toast.innerHTML = `<i class="fa-solid ${icone}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => { toast.remove(); }, 300);
  }, 3000);
};

// =========================================================
// GESTION DES ÉQUIPEMENTS - BME TECHNOLOGIE
// =========================================================

let editId = null;

// Application du thème global
const savedTheme = localStorage.getItem('theme') || 'dark';
if (savedTheme === 'light') {
  document.body.classList.add('light-mode');
} else {
  document.body.classList.remove('light-mode');
}

document.addEventListener('DOMContentLoaded', () => {
  afficherTableau();

  const formProduit = document.getElementById('formProduit');
  const searchInput = document.getElementById('searchInput');

  if (formProduit) {
    formProduit.addEventListener('submit', (e) => {
      e.preventDefault();

      const produit = document.getElementById('produit')?.value.trim();
      const marque = document.getElementById('marque')?.value.trim();
      const reference = document.getElementById('reference')?.value.trim();
      const quantite = Number(document.getElementById('quantite')?.value);

      if (!produit || !marque || !reference) {
        afficherToast("Veuillez remplir tous les champs.", "error");
        return;
      }
      if (isNaN(quantite) || quantite <= 0) {
        afficherToast("Quantité invalide.", "error");
        return;
      }

      let inventaire = JSON.parse(localStorage.getItem('bme_equipements_vente')) || [];

      if (editId !== null) {
        inventaire = inventaire.map(item => {
          if (item.id === editId) {
            return { ...item, produit, marque, reference, quantite };
          }
          return item;
        });
        localStorage.setItem('bme_equipements_vente', JSON.stringify(inventaire));
        editId = null;
        reinitialiserFormulaire();
        afficherTableau();
        afficherToast("Équipement mis à jour !", "success");
        return;
      }

      const nouvelEquipement = {
        id: genererIDUnique(inventaire),
        produit: produit,
        marque: marque,
        reference: reference,
        quantite: quantite,
        dateDepot: new Date().toLocaleDateString('fr-FR')
      };

      inventaire.push(nouvelEquipement);
      localStorage.setItem('bme_equipements_vente', JSON.stringify(inventaire));

      reinitialiserFormulaire();
      afficherTableau();
      afficherToast("Équipement ajouté à l'inventaire !", "success");
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      afficherTableau(e.target.value);
    });
  }

  // --- GESTION DU MENU MOBILE ---
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

function genererIDUnique(inventaire) {
  let nouvelID = Date.now();
  const idsExistants = inventaire.map(item => item.id);
  while (idsExistants.includes(nouvelID)) {
    nouvelID++;
  }
  return nouvelID;
}

function afficherTableau(filtre = '') {
  const tbody = document.getElementById('tbody');
  if (!tbody) return;

  const inventaire = JSON.parse(localStorage.getItem('bme_equipements_vente')) || [];
  tbody.innerHTML = '';

  if (inventaire.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding: 20px; color: #8a99ad;">
          Aucun équipement enregistré dans l'inventaire
        </td>
      </tr>`;
    return;
  }

  const filtreLower = filtre.toLowerCase();

  inventaire.forEach((item) => {
    const matchProduit = (item.produit || '').toLowerCase().includes(filtreLower);
    const matchMarque = (item.marque || '').toLowerCase().includes(filtreLower);
    const matchRef = (item.reference || '').toLowerCase().includes(filtreLower);

    if (filtre === '' || matchProduit || matchMarque || matchRef) {
      const estEnStock = item.quantite > 3;
      const couleurTexte = estEnStock ? '#10b981' : '#ef4444';
      const couleurFond = estEnStock ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.2)';
      const couleurBordure = estEnStock ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.4)';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${item.produit}</strong></td>
        <td>${item.marque}</td>
        <td><code>${item.reference}</code></td>
        <td>${item.dateDepot}</td>
        <td style="text-align: center;">
          <span style="
            background-color: ${couleurFond}; 
            color: ${couleurTexte}; 
            border: 1px solid ${couleurBordure};
            padding: 4px 10px; 
            border-radius: 6px; 
            font-weight: bold;
            display: inline-block;
            min-width: 35px;
          ">
            ${item.quantite}
          </span>
        </td>
        <td style="text-align: center; width: 80px; white-space: nowrap;">
          <div style="display: inline-flex !important; justify-content: center !important; align-items: center !important; gap: 8px !important;">
            <button type="button" onclick="chargerPourModification(${item.id})" style="color:#3b82f6; background:none; border:none; cursor:pointer;" title="Modifier">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button type="button" onclick="supprimerEquipement(${item.id})" style="color:#ef4444; background:none; border:none; cursor:pointer;" title="Supprimer">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    }
  });
}

window.chargerPourModification = function(id) {
  const inventaire = JSON.parse(localStorage.getItem('bme_equipements_vente')) || [];
  const item = inventaire.find(eqp => eqp.id === id);

  if (!item) return;

  editId = id;

  document.getElementById('produit').value = item.produit || '';
  document.getElementById('marque').value = item.marque || '';
  document.getElementById('reference').value = item.reference || '';
  document.getElementById('quantite').value = item.quantite || 1;

  const btnSubmit = document.querySelector('#formProduit button[type="submit"]');
  if (btnSubmit) {
    btnSubmit.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> METTRE À JOUR`;
    btnSubmit.style.backgroundColor = "#10b981";
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.supprimerEquipement = function(id) {
  if (confirm("Voulez-vous vraiment supprimer cet équipement de l'inventaire ?")) {
    let inventaire = JSON.parse(localStorage.getItem('bme_equipements_vente')) || [];
    inventaire = inventaire.filter(item => item.id !== id);
    localStorage.setItem('bme_equipements_vente', JSON.stringify(inventaire));
    afficherTableau();
    afficherToast("Équipement supprimé.", "success");
  }
};

function reinitialiserFormulaire() {
  editId = null;

  const formProduit = document.getElementById('formProduit');
  if (formProduit) formProduit.reset();

  document.getElementById('quantite').value = 1;

  const btnSubmit = document.querySelector('#formProduit button[type="submit"]');
  if (btnSubmit) {
    btnSubmit.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> ENREGISTRER`;
    btnSubmit.style.backgroundColor = "";
  }
}