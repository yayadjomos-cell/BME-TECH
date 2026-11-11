// =========================================================
// SYSTÈME DE NOTIFICATION (TOAST)
// =========================================================
window.afficherToast = function(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) {
    // Fallback si le conteneur n'est pas présent
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
// GESTION DES RÉPARATIONS - BME TECHNOLOGIE
// =========================================================

let equipementsEnCours = [];
let editReparationId = null;
let editArticleIndex = null;

// Application du thème global
const savedTheme = localStorage.getItem('theme') || 'dark';
if (savedTheme === 'light') {
  document.body.classList.add('light-mode');
} else {
  document.body.classList.remove('light-mode');
}

document.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('dateReparation');
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  afficherTableauReparations();

  const btnAjouter = document.getElementById('btnAjouterEquipementReparation');
  if (btnAjouter) {
    btnAjouter.addEventListener('click', (e) => {
      e.preventDefault();
      ajouterOuModifierEquipement();
    });
  }

  const formReparation = document.getElementById('formReparation');
  if (formReparation) {
    formReparation.addEventListener('submit', validerEtEnregistrerReparation);
  }

  const btnFacture = document.getElementById('btnFactureReparation');
  if (btnFacture) {
    btnFacture.addEventListener('click', (e) => {
      e.preventDefault();
      genererFactureDerniereReparation();
    });
  }

  const searchInput = document.getElementById('searchReparation');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      afficherTableauReparations(e.target.value);
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

function ajouterOuModifierEquipement() {
  const appInput = document.getElementById('appareilReparation');
  const modInput = document.getElementById('modeleReparation');
  const panneInput = document.getElementById('panneReparation');
  const coutInput = document.getElementById('coutReparation');
  const qteInput = document.getElementById('quantiteReparation');

  const appareil = appInput ? appInput.value.trim() : '';
  const modele = modInput ? modInput.value.trim() : '';
  const panne = (panneInput && panneInput.value.trim()) ? panneInput.value.trim() : 'Non spécifiée';
  const cout = coutInput ? parseFloat(coutInput.value) : NaN;
  const quantite = qteInput ? (parseInt(qteInput.value) || 1) : 1;

  if (!appareil) {
    afficherToast("Veuillez renseigner le nom de l'équipement.", "error");
    return;
  }
  if (isNaN(cout) || cout < 0) {
    afficherToast("Veuillez indiquer un prix valide.", "error");
    return;
  }

  const total = cout * quantite;
  const nouvelItem = { appareil, modele, panne, cout, quantite, total };

  if (editArticleIndex !== null) {
    equipementsEnCours[editArticleIndex] = nouvelItem;
    editArticleIndex = null;
  } else {
    equipementsEnCours.push(nouvelItem);
  }

  reinitialiserChampsEquipement();
  afficherListeVisuelleEquipements();
}

function reinitialiserChampsEquipement() {
  const appInput = document.getElementById('appareilReparation');
  const modInput = document.getElementById('modeleReparation');
  const panneInput = document.getElementById('panneReparation');
  const coutInput = document.getElementById('coutReparation');
  const qteInput = document.getElementById('quantiteReparation');

  if (appInput) appInput.value = '';
  if (modInput) modInput.value = '';
  if (panneInput) panneInput.value = '';
  if (coutInput) coutInput.value = '';
  if (qteInput) qteInput.value = '1';

  const btnAjouter = document.getElementById('btnAjouterEquipementReparation');
  if (btnAjouter) {
    btnAjouter.innerHTML = `<i class="fa-solid fa-plus"></i> AJOUTER L'ÉQUIPEMENT`;
    btnAjouter.style.backgroundColor = "";
  }
  editArticleIndex = null;
}

window.editerArticleVisuel = function(index) {
  const item = equipementsEnCours[index];
  if (!item) return;

  document.getElementById('appareilReparation').value = item.appareil || '';
  document.getElementById('modeleReparation').value = item.modele || '';
  document.getElementById('panneReparation').value = item.panne !== 'Non spécifiée' ? item.panne : '';
  document.getElementById('coutReparation').value = item.cout || '';
  document.getElementById('quantiteReparation').value = item.quantite || 1;

  editArticleIndex = index;

  const btnAjouter = document.getElementById('btnAjouterEquipementReparation');
  if (btnAjouter) {
    btnAjouter.innerHTML = `<i class="fa-solid fa-check"></i> METTRE À JOUR L'ÉQUIPEMENT`;
    btnAjouter.style.backgroundColor = "#eab308";
  }
};

window.retirerArticleVisuel = function(index) {
  equipementsEnCours.splice(index, 1);
  if (editArticleIndex === index) {
    reinitialiserChampsEquipement();
  }
  afficherListeVisuelleEquipements();
};

function afficherListeVisuelleEquipements() {
  const zone = document.getElementById('zoneReparationsAjoutees');
  const liste = document.getElementById('listeReparationsEquipements');

  if (!zone || !liste) return;

  if (equipementsEnCours.length === 0) {
    zone.style.display = 'none';
    liste.innerHTML = '';
    return;
  }

  zone.style.display = 'block';
  liste.innerHTML = '';

  equipementsEnCours.forEach((item, index) => {
    const li = document.createElement('li');
    li.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding: 6px; background: rgba(255,255,255,0.05); border-radius: 4px;';
    
    li.innerHTML = `
      <span>
        • <strong>${item.appareil}</strong> ${item.modele ? '(' + item.modele + ')' : ''} (x${item.quantite}) — Panne: ${item.panne} — <span style="color:#10b981;">${Number(item.total).toLocaleString('fr-FR')} FCFA</span>
      </span>
      <div>
        <button type="button" onclick="editerArticleVisuel(${index})" style="color: #388bfd; background: none; border: none; cursor: pointer; margin-right: 8px;" title="Modifier cet équipement">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
        <button type="button" onclick="retirerArticleVisuel(${index})" style="color: #ef4444; background: none; border: none; cursor: pointer;" title="Supprimer cet équipement">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    `;
    liste.appendChild(li);
  });
}

function validerEtEnregistrerReparation(e) {
  if (e) e.preventDefault();

  const clientInput = document.getElementById('nomClientReparation');
  const telInput = document.getElementById('telephoneReparation');
  const dateInput = document.getElementById('dateReparation');

  const nomClient = clientInput ? clientInput.value.trim() : '';
  const telephone = telInput ? telInput.value.trim() : '';
  const dateLivraison = dateInput ? dateInput.value : '';

  if (!nomClient) {
    afficherToast("Veuillez renseigner le nom du client.", "error");
    return;
  }

  const appareilDirect = document.getElementById('appareilReparation')?.value.trim();
  const coutDirect = parseFloat(document.getElementById('coutReparation')?.value);

  if (appareilDirect && !isNaN(coutDirect) && coutDirect >= 0) {
    ajouterOuModifierEquipement();
  }

  if (equipementsEnCours.length === 0) {
    afficherToast("Veuillez ajouter au moins un équipement.", "error");
    return;
  }

  let reparations = JSON.parse(localStorage.getItem('bme_historique_reparations')) || [];
  const totalCout = equipementsEnCours.reduce((sum, item) => sum + Number(item.total), 0);

  if (editReparationId !== null) {
    const index = reparations.findIndex(r => r.id === editReparationId);
    if (index !== -1) {
      reparations[index] = {
        id: editReparationId,
        nomClient,
        telephone,
        equipements: [...equipementsEnCours],
        totalCout,
        statut: reparations[index].statut || 'En cours de réparation',
        dateLivraison,
        dateCreation: reparations[index].dateCreation || new Date().toISOString().split('T')[0]
      };
      afficherToast("Ordre mis à jour avec succès !", "success");
    }
  } else {
    let maxNumero = 0;
    reparations.forEach(r => {
      const match = String(r.id || '').match(/^ORD-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumero) maxNumero = num;
      }
    });
    const prochainNumero = maxNumero + 1;
    const nouvelOrdre = {
      id: "ORD-" + prochainNumero,
      nomClient,
      telephone,
      equipements: [...equipementsEnCours],
      totalCout,
      statut: 'En cours de réparation',
      dateLivraison,
      dateCreation: new Date().toISOString().split('T')[0]
    };
    reparations.push(nouvelOrdre); 
    afficherToast(`Ordre ${nouvelOrdre.id} enregistré !`, "success");
  }

  localStorage.setItem('bme_historique_reparations', JSON.stringify(reparations));

  reinitialiserFormulaireReparation();
  afficherTableauReparations();
}

window.editerReparation = function(id) {
  const reparations = JSON.parse(localStorage.getItem('bme_historique_reparations')) || [];
  const rep = reparations.find(r => r.id === id);

  if (!rep) {
    afficherToast("Réparation introuvable.", "error");
    return;
  }

  editReparationId = id;

  document.getElementById('nomClientReparation').value = rep.nomClient || rep.client || '';
  document.getElementById('telephoneReparation').value = rep.telephone || '';
  document.getElementById('dateReparation').value = rep.dateLivraison || rep.date || new Date().toISOString().split('T')[0];

  if (rep.equipements && Array.isArray(rep.equipements)) {
    equipementsEnCours = JSON.parse(JSON.stringify(rep.equipements));
  } else if (rep.articles && Array.isArray(rep.articles)) {
    equipementsEnCours = JSON.parse(JSON.stringify(rep.articles));
  } else {
    equipementsEnCours = [];
  }

  const btnEnregistrer = document.getElementById('btnEnregistrer');
  if (btnEnregistrer) {
    btnEnregistrer.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> APPLIQUER MODIFICATIONS`;
  }

  reinitialiserChampsEquipement();
  afficherListeVisuelleEquipements();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

function afficherTableauReparations(filtre = '') {
  const tbody = document.getElementById('tbodyReparation');
  if (!tbody) return;

  const reparations = JSON.parse(localStorage.getItem('bme_historique_reparations')) || [];
  tbody.innerHTML = '';

  if (reparations.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 20px; color: #8b949e;">Aucune réparation enregistrée</td></tr>`;
    return;
  }

  const filtreLower = filtre.toLowerCase();
  const aujourdhui = new Date().toISOString().split('T')[0];

  reparations.forEach((item) => {
    const nomClient = item.nomClient || item.client || 'Client inconnu';
    const totalAffichage = item.totalCout ?? item.total ?? 0;
    const telephone = item.telephone || '-';
    const idOrdre = item.id || '-';
    const dateLivraison = item.dateLivraison || item.date || '';

    let statutActuel = item.statut || 'En cours de réparation';
    let styleBadge = 'background: rgba(234, 179, 8, 0.2); color: #eab308; cursor: not-allowed;';
    let estCliquable = false;

    if (statutActuel !== 'Livré') {
      if (dateLivraison && dateLivraison <= aujourdhui) {
        statutActuel = 'Prêt à être livré';
        styleBadge = 'background: rgba(56, 139, 253, 0.2); color: #58a6ff; cursor: pointer; border: 1px solid #388bfd;';
        estCliquable = true;
      } else {
        statutActuel = 'En cours de réparation';
        styleBadge = 'background: rgba(234, 179, 8, 0.2); color: #eab308; cursor: not-allowed;';
        estCliquable = false;
      }
    } else {
      styleBadge = 'background: rgba(16, 185, 129, 0.2); color: #10b981; cursor: default;';
      estCliquable = false;
    }

    let listeEqp = item.equipements || item.articles || [];

    const texteEquipements = listeEqp.map(e => e.appareil || e.equipement || '').join(' ');
    const matchClient = nomClient.toLowerCase().includes(filtreLower);
    const matchEqp = texteEquipements.toLowerCase().includes(filtreLower);
    const matchTel = telephone.toLowerCase().includes(filtreLower);
    const matchId = idOrdre.toLowerCase().includes(filtreLower);

    if (filtre === '' || matchClient || matchEqp || matchTel || matchId) {
      let htmlEquipements = '';
      let htmlQte = '';
      let htmlPannes = '';

      listeEqp.forEach((eq, idx) => {
        const borderStyle = idx < listeEqp.length - 1 ? 'border-bottom: 1px solid #30363d; padding: 4px 0;' : 'padding: 4px 0;';
        const nomAppareil = eq.appareil || eq.equipement || '-';
        const qte = eq.quantite || 1;
        const panne = eq.panne || '-';
        
        htmlEquipements += `<div style="${borderStyle}">${nomAppareil} ${eq.modele ? '(' + eq.modele + ')' : ''}</div>`;
        htmlQte += `<div style="${borderStyle}">${qte}</div>`;
        htmlPannes += `<div style="${borderStyle}">${panne}</div>`;
      });

      const tr = document.createElement('tr');
      tr.style.verticalAlign = 'top';

      tr.innerHTML = `
        <td style="padding-top: 12px;"><strong>${idOrdre}</strong></td>
        <td style="padding-top: 12px;"><strong>${nomClient}</strong><br><small style="color:#8b949e;">${telephone}</small></td>
        <td>${htmlEquipements}</td>
        <td class="text-center">${htmlQte}</td>
        <td>${htmlPannes}</td>
        <td style="padding-top: 12px; color:#10b981; font-weight:bold;">${Number(totalAffichage).toLocaleString('fr-FR')} FCFA</td>
        <td style="padding-top: 12px;">${dateLivraison || '-'}</td>
        <td style="padding-top: 12px;">
          <button type="button" 
                  ${estCliquable ? `onclick="marquerCommeLivre('${idOrdre}')"` : 'disabled'} 
                  style="border:none; padding: 5px 10px; border-radius: 12px; font-size: 11px; font-weight:bold; ${styleBadge}" 
                  title="${estCliquable ? 'Cliquer pour passer en Livré' : 'Changement autorisé uniquement quand il est Prêt à être livré'}">
            ${statutActuel}
          </button>
        </td>
        <td class="text-center" style="white-space: nowrap; padding-top: 12px;">
          <div style="display: inline-flex; justify-content: center; align-items: center; gap: 10px;">
            <button type="button" onclick="imprimerFactureReparationParId('${idOrdre}')" style="color:#10b981; background:none; border:none; cursor:pointer;" title="Facture">
              <i class="fa-solid fa-file-invoice"></i>
            </button>
            <button type="button" onclick="editerReparation('${idOrdre}')" style="color:#388bfd; background:none; border:none; cursor:pointer;" title="Modifier">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button type="button" onclick="supprimerReparation('${idOrdre}')" style="color:#ef4444; background:none; border:none; cursor:pointer;" title="Supprimer">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    }
  });
}

window.marquerCommeLivre = function(id) {
  let reparations = JSON.parse(localStorage.getItem('bme_historique_reparations')) || [];
  const index = reparations.findIndex(r => r.id === id);

  if (index !== -1) {
    reparations[index].statut = 'Livré';
    localStorage.setItem('bme_historique_reparations', JSON.stringify(reparations));
    afficherTableauReparations();
  }
};

window.supprimerReparation = function(id) {
  if (confirm("Voulez-vous vraiment supprimer cet ordre de réparation ?")) {
    let reparations = JSON.parse(localStorage.getItem('bme_historique_reparations')) || [];
    reparations = reparations.filter(item => item.id !== id);
    localStorage.setItem('bme_historique_reparations', JSON.stringify(reparations));
    afficherTableauReparations();
    afficherToast("Ordre supprimé.", "success");
  }
};

function genererFactureDerniereReparation() {
  if (equipementsEnCours.length > 0) {
    const nomClient = document.getElementById('nomClientReparation')?.value.trim() || 'Client';
    const telephone = document.getElementById('telephoneReparation')?.value.trim() || '';
    const dateLivraison = document.getElementById('dateReparation')?.value || '';
    const totalCout = equipementsEnCours.reduce((sum, item) => sum + Number(item.total), 0);

    const repProvisoire = {
      id: editReparationId || 'PROVISOIRE',
      nomClient,
      telephone,
      equipements: [...equipementsEnCours],
      totalCout,
      dateLivraison,
      statut: 'Provisoire'
    };
    imprimerFactureObjet(repProvisoire);
    return;
  }

  const reparations = JSON.parse(localStorage.getItem('bme_historique_reparations')) || [];
  if (reparations.length === 0) {
    afficherToast("Aucune réparation à facturer.", "error");
    return;
  }
  imprimerFactureObjet(reparations[reparations.length - 1]);
}

window.imprimerFactureReparationParId = function(id) {
  const reparations = JSON.parse(localStorage.getItem('bme_historique_reparations')) || [];
  const rep = reparations.find(r => r.id === id);
  if (!rep) {
    afficherToast("Réparation introuvable.", "error");
    return;
  }
  imprimerFactureObjet(rep);
};

function imprimerFactureObjet(rep) {
  let listeEqp = rep.equipements || rep.articles || [];
  let lignesHtml = '';

  listeEqp.forEach(eq => {
    lignesHtml += `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${eq.appareil || eq.equipement || '-'} ${eq.modele ? '(' + eq.modele + ')' : ''}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${eq.panne || '-'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${eq.quantite || 1}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${Number(eq.total ?? eq.cout ?? 0).toLocaleString('fr-FR')} FCFA</td>
      </tr>
    `;
  });

  const totalFinal = rep.totalCout ?? rep.total ?? 0;

  const contenu = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Facture Réparation - ${rep.nomClient || rep.client}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .infos-client { margin-bottom: 20px; display: flex; justify-content: space-between; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #f4f4f4; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; }
        .total { text-align: right; margin-top: 20px; font-size: 18px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>BME TECHNOLOGIE</h1>
        <p>SERVICE DE RÉPARATION ET MAINTENANCE</p>
      </div>

      <div class="infos-client">
        <div>
          <strong>Client :</strong> ${rep.nomClient || rep.client}<br>
          <strong>Téléphone :</strong> ${rep.telephone || 'N/A'}
        </div>
        <div style="text-align: right;">
          <strong>Date :</strong> ${rep.dateLivraison || rep.date || '-'}<br>
          <strong>N° Ordre :</strong> ${rep.id}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Équipement</th>
            <th>Panne / Diagnostique</th>
            <th style="text-align: center;">Qté</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${lignesHtml}
        </tbody>
      </table>

      <div class="total">
        TOTAL À PAYER : ${Number(totalFinal).toLocaleString('fr-FR')} FCFA
      </div>
    </body>
    </html>
  `;

  const fenetre = window.open('', '_blank');
  fenetre.document.write(contenu);
  fenetre.document.close();
  fenetre.focus();
  setTimeout(() => { fenetre.print(); }, 300);
}

function reinitialiserFormulaireReparation() {
  const form = document.getElementById('formReparation');
  if (form) form.reset();

  const dateInput = document.getElementById('dateReparation');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

  const btnEnregistrer = document.getElementById('btnEnregistrer');
  if (btnEnregistrer) {
    btnEnregistrer.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> ENREGISTRER`;
  }

  equipementsEnCours = [];
  editReparationId = null;
  reinitialiserChampsEquipement();
  afficherListeVisuelleEquipements();
}