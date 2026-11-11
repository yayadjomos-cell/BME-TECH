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
// GESTION DES VENTES - BME TECHNOLOGIE
// =========================================================

let articlesEnCours = [];
let editVenteId = null;
let editArticleIndex = null;

// Application du thème global
const savedTheme = localStorage.getItem('theme') || 'dark';
if (savedTheme === 'light') {
  document.body.classList.add('light-mode');
} else {
  document.body.classList.remove('light-mode');
}

document.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('date');
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  afficherTableauVentes();

  const btnAjouter = document.getElementById('btnAjouterEquipement');
  if (btnAjouter) {
    btnAjouter.addEventListener('click', ajouterOuModifierEquipementDansListe);
  }

  const formProduit = document.getElementById('formProduit');
  if (formProduit) {
    formProduit.addEventListener('submit', validerEtEnregistrerVente);
  }

  const btnFacture = document.getElementById('btnFacture');
  if (btnFacture) {
    btnFacture.addEventListener('click', (e) => {
      e.preventDefault();
      window.genererFactureDerniereVente();
    });
  }

  const searchInput = document.getElementById('searchVente');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      afficherTableauVentes(e.target.value);
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

function ajouterOuModifierEquipementDansListe() {
  const equipement = document.getElementById('equipement')?.value.trim();
  const reference = document.getElementById('reference')?.value.trim() || '-';
  const quantite = parseInt(document.getElementById('quantite')?.value, 10);
  const prix = parseFloat(document.getElementById('prix')?.value);

  if (!equipement) {
    afficherToast("Veuillez saisir le nom de l'équipement.", "error");
    return;
  }
  if (isNaN(quantite) || quantite <= 0) {
    afficherToast("Quantité invalide.", "error");
    return;
  }
  if (isNaN(prix) || prix <= 0) {
    afficherToast("Prix invalide.", "error");
    return;
  }

  let equipementsStock = JSON.parse(localStorage.getItem('bme_equipements_vente')) || [];
  let indexStock = equipementsStock.findIndex(eq => 
    eq.produit?.toLowerCase().trim() === equipement.toLowerCase().trim()
  );

  if (indexStock === -1 && reference !== '-' && reference !== '') {
    indexStock = equipementsStock.findIndex(eq => 
      eq.reference?.toLowerCase().trim() === reference.toLowerCase().trim()
    );
  }

  if (indexStock !== -1) {
    const stockDispo = equipementsStock[indexStock].quantite;
    const qteCumulee = articlesEnCours
      .filter((item, idx) => idx !== editArticleIndex && item.equipement.toLowerCase() === equipement.toLowerCase())
      .reduce((sum, item) => sum + item.quantite, 0);

    if (stockDispo < (qteCumulee + quantite)) {
      afficherToast(`Stock insuffisant ! Dispo : ${stockDispo}`, "error");
      return;
    }
  }

  const nouvelArticle = {
    equipement,
    reference,
    quantite,
    prix,
    sousTotal: quantite * prix
  };

  if (editArticleIndex !== null) {
    articlesEnCours[editArticleIndex] = nouvelArticle;
    editArticleIndex = null;
  } else {
    articlesEnCours.push(nouvelArticle);
  }

  reinitialiserChampsEquipement();
  afficherListeVisuelle();
}

function reinitialiserChampsEquipement() {
  document.getElementById('equipement').value = '';
  document.getElementById('reference').value = '';
  document.getElementById('quantite').value = '1';
  document.getElementById('prix').value = '';

  const btnAjouter = document.getElementById('btnAjouterEquipement');
  if (btnAjouter) {
    btnAjouter.innerHTML = `<i class="fa-solid fa-plus"></i> AJOUTER L'ÉQUIPEMENT`;
    btnAjouter.style.backgroundColor = '#388bfd';
  }
  editArticleIndex = null;
}

window.editerEquipementDansListe = function(index) {
  const item = articlesEnCours[index];
  if (!item) return;

  document.getElementById('equipement').value = item.equipement || '';
  document.getElementById('reference').value = item.reference !== '-' ? item.reference : '';
  document.getElementById('quantite').value = item.quantite || 1;
  document.getElementById('prix').value = item.prix || '';

  editArticleIndex = index;

  const btnAjouter = document.getElementById('btnAjouterEquipement');
  if (btnAjouter) {
    btnAjouter.innerHTML = `<i class="fa-solid fa-check"></i> METTRE À JOUR`;
    btnAjouter.style.backgroundColor = "#eab308";
  }
};

window.retirerEquipement = function(index) {
  articlesEnCours.splice(index, 1);
  if (editArticleIndex === index) {
    reinitialiserChampsEquipement();
  }
  afficherListeVisuelle();
};

function afficherListeVisuelle() {
  const zone = document.getElementById('zoneEquipementsAjoutes');
  const liste = document.getElementById('listeEquipements');

  if (!zone || !liste) return;

  if (articlesEnCours.length === 0) {
    zone.style.display = 'none';
    liste.innerHTML = '';
    return;
  }

  zone.style.display = 'block';
  liste.innerHTML = '';

  articlesEnCours.forEach((item, index) => {
    const li = document.createElement('li');
    li.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding: 6px; background: rgba(255,255,255,0.05); border-radius: 4px;';
    
    li.innerHTML = `
      <span>
        • <strong>${item.equipement}</strong> (Réf: ${item.reference}) — Qté: <strong>${item.quantite}</strong> — <span style="color:#10b981;">${Number(item.sousTotal).toLocaleString('fr-FR')} FCFA</span>
      </span>
      <div>
        <button type="button" onclick="editerEquipementDansListe(${index})" style="color: #388bfd; background: none; border: none; cursor: pointer; margin-right: 6px;" title="Modifier cet article">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
        <button type="button" onclick="retirerEquipement(${index})" style="color: #ef4444; background: none; border: none; cursor: pointer;" title="Supprimer cet article">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    `;
    liste.appendChild(li);
  });
}

function validerEtEnregistrerVente(e) {
  if (e) e.preventDefault();

  const nomClient = document.getElementById('nomClient')?.value.trim();
  const telephone = document.getElementById('telephone')?.value.trim();
  const dateVente = document.getElementById('date')?.value;

  if (!nomClient || !telephone) {
    afficherToast("Veuillez renseigner le nom et le téléphone.", "error");
    return;
  }

  const equipementDirect = document.getElementById('equipement')?.value.trim();
  const prixDirect = parseFloat(document.getElementById('prix')?.value);

  if (equipementDirect && !isNaN(prixDirect) && prixDirect > 0) {
    ajouterOuModifierEquipementDansListe();
  }

  if (articlesEnCours.length === 0) {
    afficherToast("Veuillez ajouter au moins un équipement.", "error");
    return;
  }

  let ventes = JSON.parse(localStorage.getItem('bme_historique_ventes')) || [];

  const totalQuantite = articlesEnCours.reduce((sum, a) => sum + Number(a.quantite), 0);
  const totalPrix = articlesEnCours.reduce((sum, a) => sum + Number(a.sousTotal), 0);

  articlesEnCours.forEach(function(artVendu) {
    const clesStock = ['bme_stock_equipements', 'bme_equipements', 'bme_equipements_vente'];
    
    clesStock.forEach(function(cle) {
      let stock = JSON.parse(localStorage.getItem(cle));
      if (!stock || !Array.isArray(stock)) return;
      
      let modifie = false;
      stock.forEach(function(itemStock) {
        const nomStock = (itemStock.nom || itemStock.designation || itemStock.produit || itemStock.appareil || '').toLowerCase().trim();
        const refStock = (itemStock.reference || '').toLowerCase().trim();
        
        const nomVendu = artVendu.equipement.toLowerCase().trim();
        const refVendu = (artVendu.reference || '').toLowerCase().trim();

        if (nomStock === nomVendu || (refVendu !== '-' && refVendu !== '' && refStock === refVendu)) {
          itemStock.quantite = (parseInt(itemStock.quantite) || 0) - artVendu.quantite;
          if (itemStock.quantite < 0) itemStock.quantite = 0;
          modifie = true;
        }
      });
      
      if (modifie) {
        localStorage.setItem(cle, JSON.stringify(stock));
      }
    });
  });

  if (editVenteId !== null) {
    const index = ventes.findIndex(v => Number(v.id) === Number(editVenteId));
    if (index !== -1) {
      ventes[index] = {
        id: editVenteId,
        nomClient,
        telephone,
        articles: [...articlesEnCours],
        totalQuantite,
        totalPrix,
        date: dateVente
      };
      afficherToast("Vente modifiée !", "success");
    }
  } else {
    const nouvelleVente = {
      id: Date.now(),
      nomClient,
      telephone,
      articles: [...articlesEnCours],
      totalQuantite,
      totalPrix,
      date: dateVente
    };
    ventes.push(nouvelleVente);
    afficherToast("Vente enregistrée ! Stock mis à jour.", "success");
  }

  localStorage.setItem('bme_historique_ventes', JSON.stringify(ventes));

  reinitialiserFormulaire();
  afficherTableauVentes();
}

window.editerVente = function(id) {
  const ventes = JSON.parse(localStorage.getItem('bme_historique_ventes')) || [];
  const vente = ventes.find(v => Number(v.id) === Number(id));

  if (!vente) {
    afficherToast("Vente introuvable.", "error");
    return;
  }

  editVenteId = Number(id);

  document.getElementById('nomClient').value = vente.nomClient || '';
  document.getElementById('telephone').value = vente.telephone || '';
  document.getElementById('date').value = vente.date || new Date().toISOString().split('T')[0];

  if (vente.articles && Array.isArray(vente.articles)) {
    articlesEnCours = JSON.parse(JSON.stringify(vente.articles));
  } else {
    articlesEnCours = [{
      equipement: vente.equipements || vente.resumeArticles || vente.equipement || '',
      reference: vente.references || vente.reference || '-',
      quantite: vente.totalQuantite || vente.quantite || 1,
      prix: vente.totalPrix || vente.totalMontant || vente.prix || 0,
      sousTotal: vente.totalPrix || vente.totalMontant || vente.prix || 0
    }];
  }

  const btnSubmit = document.querySelector('#formProduit button[type="submit"]');
  if (btnSubmit) {
    btnSubmit.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> APPLIQUER MODIFICATIONS`;
    btnSubmit.style.backgroundColor = "#388bfd";
  }

  reinitialiserChampsEquipement();
  afficherListeVisuelle();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.genererFactureDerniereVente = function() {
  if (articlesEnCours.length > 0) {
    const nomClient = document.getElementById('nomClient')?.value.trim() || 'Client';
    const telephone = document.getElementById('telephone')?.value.trim() || '';
    const dateVente = document.getElementById('date')?.value || new Date().toISOString().split('T')[0];
    const totalPrix = articlesEnCours.reduce((sum, a) => sum + Number(a.sousTotal), 0);

    const venteProvisoire = {
      id: editVenteId || 'PROVISOIRE',
      nomClient,
      telephone,
      articles: [...articlesEnCours],
      totalPrix,
      date: dateVente
    };
    imprimerFactureObjet(venteProvisoire);
    return;
  }

  const ventes = JSON.parse(localStorage.getItem('bme_historique_ventes')) || [];
  if (ventes.length === 0) {
    afficherToast("Aucune vente à facturer.", "error");
    return;
  }
  imprimerFactureObjet(ventes[ventes.length - 1]);
};

window.imprimerFactureParId = function(id) {
  const ventes = JSON.parse(localStorage.getItem('bme_historique_ventes')) || [];
  const vente = ventes.find(v => Number(v.id) === Number(id));

  if (!vente) {
    afficherToast("Vente introuvable.", "error");
    return;
  }

  imprimerFactureObjet(vente);
};

function imprimerFactureObjet(vente) {
  let listeArticles = [];

  if (vente.articles && Array.isArray(vente.articles)) {
    listeArticles = vente.articles;
  } else {
    listeArticles = [{
      equipement: vente.equipements || vente.resumeArticles || vente.equipement || '-',
      reference: vente.references || vente.reference || '-',
      quantite: vente.totalQuantite ?? vente.quantite ?? 1,
      prix: vente.totalPrix ?? vente.totalMontant ?? vente.prix ?? 0,
      sousTotal: vente.totalPrix ?? vente.totalMontant ?? vente.prix ?? 0
    }];
  }

  let lignesArticlesHtml = '';
  listeArticles.forEach(art => {
    const qte = Number(art.quantite) || 1;
    const prixUnit = Number(art.prix) || (Number(art.sousTotal) / qte) || 0;
    const sousTotal = Number(art.sousTotal) || (qte * prixUnit) || 0;

    lignesArticlesHtml += `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${art.equipement || '-'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${art.reference || '-'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${qte}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${prixUnit.toLocaleString('fr-FR')} FCFA</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${sousTotal.toLocaleString('fr-FR')} FCFA</td>
      </tr>
    `;
  });

  const totalPrix = vente.totalPrix ?? listeArticles.reduce((sum, a) => sum + (Number(a.sousTotal) || 0), 0);
  const numeroFacture = vente.id ? `FAC-${String(vente.id).slice(-6)}` : 'FAC-PROVISOIRE';

  const contenuFacture = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Facture - ${vente.nomClient || 'Client'}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 5px 0; font-size: 14px; }
        .infos-client { margin-bottom: 20px; display: flex; justify-content: space-between; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #f4f4f4; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; }
        .total { text-align: right; margin-top: 20px; font-size: 18px; font-weight: bold; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #777; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>BME TECHNOLOGIE</h1>
        <p>PERFORMANCE ET RAPIDITÉ</p>
        <p><strong>FACTURE DE VENTE</strong></p>
      </div>

      <div class="infos-client">
        <div>
          <strong>Client :</strong> ${vente.nomClient || '-'}<br>
          <strong>Téléphone :</strong> ${vente.telephone || 'N/A'}
        </div>
        <div style="text-align: right;">
          <strong>Date :</strong> ${vente.date || '-'}<br>
          <strong>N° Facture :</strong> ${numeroFacture}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Équipement</th>
            <th>Référence</th>
            <th style="text-align: center;">Qté</th>
            <th style="text-align: right;">Prix Unitaire</th>
            <th style="text-align: right;">Sous-Total</th>
          </tr>
        </thead>
        <tbody>
          ${lignesArticlesHtml}
        </tbody>
      </table>

      <div class="total">
        TOTAL À PAYER : ${Number(totalPrix).toLocaleString('fr-FR')} FCFA
      </div>

      <div class="footer">
        <p>Merci pour votre confiance !</p>
        <p>BME Technologie - Matériels et Services Informatiques</p>
      </div>
    </body>
    </html>
  `;

  const fenetre = window.open('', '_blank');
  fenetre.document.write(contenuFacture);
  fenetre.document.close();
  fenetre.focus();
  setTimeout(() => { fenetre.print(); }, 300);
}

function afficherTableauVentes(filtre = '') {
  const tbody = document.getElementById('tbodyVente');
  if (!tbody) return;

  const ventes = JSON.parse(localStorage.getItem('bme_historique_ventes')) || [];
  tbody.innerHTML = '';

  if (ventes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 20px; color: #8b949e;">Aucune vente enregistrée</td></tr>`;
    return;
  }

  const filtreLower = filtre.toLowerCase();

  ventes.forEach((item) => {
    let listeArticles = [];

    if (item.articles && Array.isArray(item.articles) && item.articles.length > 0) {
      listeArticles = item.articles;
    } else {
      listeArticles = [{
        equipement: item.equipements || item.resumeArticles || item.equipement || '-',
        reference: item.references || item.reference || '-',
        quantite: item.totalQuantite ?? item.quantite ?? 1,
        prix: item.totalPrix ?? item.totalMontant ?? item.prix ?? 0,
        sousTotal: item.totalPrix ?? item.totalMontant ?? item.prix ?? 0
      }];
    }

    const texteEquipements = listeArticles.map(a => a.equipement || '').join(' ');
    const matchClient = (item.nomClient || '').toLowerCase().includes(filtreLower);
    const matchEquip = texteEquipements.toLowerCase().includes(filtreLower);
    const matchTel = (item.telephone || '').toLowerCase().includes(filtreLower);

    if (filtre === '' || matchClient || matchEquip || matchTel) {
      let htmlEquipements = '';
      let htmlReferences = '';
      let htmlQuantites = '';
      let htmlPrix = '';

      listeArticles.forEach((art, idx) => {
        const borderStyle = idx < listeArticles.length - 1 ? 'border-bottom: 1px solid #30363d; padding: 6px 0;' : 'padding: 6px 0;';
        
        htmlEquipements += `<div style="${borderStyle}">${art.equipement || '-'}</div>`;
        htmlReferences += `<div style="${borderStyle}"><code>${art.reference || '-'}</code></div>`;
        htmlQuantites += `<div style="${borderStyle}; text-align: center;"><strong>${art.quantite || 1}</strong></div>`;
        
        const sousTotalCalcule = art.sousTotal || (art.quantite * art.prix) || 0;
        htmlPrix += `<div style="${borderStyle}; color: #10b981; font-weight: bold;">${Number(sousTotalCalcule).toLocaleString('fr-FR')} FCFA</div>`;
      });

      const tr = document.createElement('tr');
      tr.style.verticalAlign = 'top';

      tr.innerHTML = `
        <td style="padding-top: 12px;"><strong>${item.nomClient || '-'}</strong></td>
        <td style="padding-top: 12px;">${item.telephone || '-'}</td>
        <td>${htmlEquipements}</td>
        <td>${htmlReferences}</td>
        <td>${htmlQuantites}</td>
        <td>${htmlPrix}</td>
        <td style="padding-top: 12px;">${item.date || '-'}</td>
        <td class="text-center" style="white-space: nowrap; padding-top: 12px;">
          <div style="display: inline-flex !important; justify-content: center !important; align-items: center !important; gap: 10px !important;">
            <button type="button" onclick="imprimerFactureParId(${item.id})" style="color:#10b981; background:none; border:none; cursor:pointer;" title="Imprimer Facture">
              <i class="fa-solid fa-file-invoice"></i>
            </button>
            <button type="button" onclick="editerVente(${item.id})" style="color:#388bfd; background:none; border:none; cursor:pointer;" title="Modifier la vente">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button type="button" onclick="supprimerVente(${item.id})" style="color:#ef4444; background:none; border:none; cursor:pointer;" title="Supprimer la vente">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    }
  });
}

window.supprimerVente = function(id) {
  if (confirm("Voulez-vous vraiment supprimer cette vente ?")) {
    let ventes = JSON.parse(localStorage.getItem('bme_historique_ventes')) || [];
    ventes = ventes.filter(item => Number(item.id) !== Number(id));
    localStorage.setItem('bme_historique_ventes', JSON.stringify(ventes));
    afficherTableauVentes();
    afficherToast("Vente supprimée.", "success");
  }
};

function reinitialiserFormulaire() {
  const form = document.getElementById('formProduit');
  if (form) form.reset();

  const dateInput = document.getElementById('date');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

  const btnSubmit = document.querySelector('#formProduit button[type="submit"]');
  if (btnSubmit) {
    btnSubmit.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> VALIDER VENTE`;
    btnSubmit.style.backgroundColor = "";
  }

  articlesEnCours = [];
  editVenteId = null;
  reinitialiserChampsEquipement();
  afficherListeVisuelle();
}