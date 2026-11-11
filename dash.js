// =========================================================
// TABLEAU DE BORD - BME TECHNOLOGIE (Version Finale 6)
// =========================================================

let detailsKPI = {
  encours: [],
  pret: [],
  livre: [],
  recu: [],
  vendu: []
};

let chartTopEquipements = null;
let chartVentesVsReparations = null;

// Application du thème global
const savedTheme = localStorage.getItem('theme') || 'dark';
if (savedTheme === 'light') {
  document.body.classList.add('light-mode');
} else {
  document.body.classList.remove('light-mode');
}

document.addEventListener('DOMContentLoaded', () => {
  chargerStatistiquesDashboard();

  const onglets = document.querySelectorAll('.tab-btn');
  onglets.forEach(onglet => {
    onglet.addEventListener('click', (e) => {
      onglets.forEach(o => o.classList.remove('active'));
      e.target.classList.add('active');
      const filtre = e.target.textContent.trim().toUpperCase();
      rafraichirGraphiques(filtre);
    });
  });

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

// ---------------------------------------------------------
// HELPERS
// ---------------------------------------------------------
function getDateLocaleISO(date) {
  const d = date || new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

function getArticlesVente(v) {
  if (v.articles && Array.isArray(v.articles) && v.articles.length > 0) return v.articles;
  if (v.equipements && Array.isArray(v.equipements) && v.equipements.length > 0) return v.equipements;
  return [];
}

function getEquipementsReparation(r) {
  if (r.equipements && Array.isArray(r.equipements) && r.equipements.length > 0) return r.equipements;
  if (r.articles && Array.isArray(r.articles) && r.articles.length > 0) return r.articles;
  return [];
}

function chargerStockFusionne() {
  const cles = ['bme_stock_equipements', 'bme_equipements', 'bme_stock', 'bme_equipements_vente'];
  const vus = new Set();
  const resultat = [];
  cles.forEach(function (cle) {
    let data = [];
    try { data = JSON.parse(localStorage.getItem(cle)) || []; } catch (e) { data = []; }
    if (!Array.isArray(data)) return;
    data.forEach(function (item) {
      const nom = (item.nom || item.designation || item.produit || item.appareil || '').toLowerCase().trim();
      const ref = (item.reference || item.ref || '').toLowerCase().trim();
      const signature = nom + '|' + ref;
      if (nom && !vus.has(signature)) { vus.add(signature); resultat.push(item); } else if (!nom) { resultat.push(item); }
    });
  });
  return resultat;
}

function estStatutComptabilise(statut) { return statut === 'Livré' || statut === 'Prêt à être livré'; }

// ---------------------------------------------------------
// CHARGEMENT PRINCIPAL (KPI)
// ---------------------------------------------------------
function chargerStatistiquesDashboard() {
  const reparations = JSON.parse(localStorage.getItem('bme_historique_reparations')) || [];
  const ventes = JSON.parse(localStorage.getItem('bme_historique_ventes')) || [];
  const equipementsStock = chargerStockFusionne();

  const aujourdhui = new Date();
  const dateAujourdhuiIso = getDateLocaleISO(aujourdhui);
  const moisActuel = aujourdhui.getMonth();
  const anneeActuelle = aujourdhui.getFullYear();

  let countEnCours = 0, countPretLivrer = 0, countMoteursLivres = 0, countMoteursRecusMensuel = 0, caReparationsMensuel = 0;

  // Réinitialisation des détails pour éviter les doublons
  detailsKPI = { encours: [], pret: [], livre: [], recu: [], vendu: [] };

  reparations.forEach(function (item) {
    const listEqp = getEquipementsReparation(item);
    const dateLivraison = item.dateLivraison || item.date || '';
    const dateCreation = item.dateCreation || item.date || '';
    const dateCreationObj = dateCreation ? new Date(dateCreation) : new Date();
    const estRecuMoisActuel = (dateCreationObj.getMonth() === moisActuel && dateCreationObj.getFullYear() === anneeActuelle);
    const dateLivraisonObj = dateLivraison ? new Date(dateLivraison) : new Date();
    const estLivreMoisActuel = (dateLivraisonObj.getMonth() === moisActuel && dateLivraisonObj.getFullYear() === anneeActuelle);

    let statutActuel = item.statut || 'En cours de réparation';
    if (statutActuel !== 'Livré') {
      if (dateLivraison && dateLivraison <= dateAujourdhuiIso) statutActuel = 'Prêt à être livré';
      else statutActuel = 'En cours de réparation';
    }

    if (estLivreMoisActuel && estStatutComptabilise(statutActuel)) caReparationsMensuel += Number(item.totalCout || item.total || 0);

    listEqp.forEach(function (eqp) {
      const qte = parseInt(eqp.quantite) || 1;
      const nomEqp = eqp.appareil || eqp.equipement || 'Équipement';
      const refEqp = eqp.modele || '-';
      
      if (statutActuel === 'En cours de réparation') {
        countEnCours += qte;
        detailsKPI.encours.push({ nom: nomEqp, client: item.nomClient, qte: qte, ref: refEqp });
      }
      if (statutActuel === 'Prêt à être livré') {
        countPretLivrer += qte;
        detailsKPI.pret.push({ nom: nomEqp, client: item.nomClient, qte: qte, ref: refEqp });
      }
      if (statutActuel === 'Livré') {
        countMoteursLivres += qte;
        detailsKPI.livre.push({ nom: nomEqp, client: item.nomClient, qte: qte, ref: refEqp });
      }
      if (estRecuMoisActuel) {
        countMoteursRecusMensuel += qte;
        detailsKPI.recu.push({ nom: nomEqp, client: item.nomClient, qte: qte, ref: refEqp });
      }
    });
  });

  let caVentesMensuel = 0, totalEquipementVenduMensuel = 0;
  ventes.forEach(function (v) {
    const dateVente = v.date ? new Date(v.date) : new Date();
    if (dateVente.getMonth() === moisActuel && dateVente.getFullYear() === anneeActuelle) {
      caVentesMensuel += Number(v.total || v.totalPrix || v.totalMontant || 0);
      
      getArticlesVente(v).forEach(function (art) { 
        const qte = parseInt(art.quantite) || 1;
        totalEquipementVenduMensuel += qte; 
        detailsKPI.vendu.push({ 
          nom: art.equipement || art.nom || 'Équipement', 
          client: v.nomClient, 
          qte: qte, 
          ref: art.reference || '-' 
        });
      });
    }
  });

  const caTotalMensuel = caVentesMensuel + caReparationsMensuel;
  mettreAJourText('val-reparations', countEnCours);
  mettreAJourText('val-pret', countPretLivrer);
  mettreAJourText('val-livre', countMoteursLivres);
  mettreAJourText('val-ca', caTotalMensuel.toLocaleString('fr-FR'));
  mettreAJourText('val-recu', countMoteursRecusMensuel);
  mettreAJourText('val-ventes', totalEquipementVenduMensuel);

  genererGraphiques(ventes, reparations, 'MOTEURS');
  alimenterTableauComparaisonCA(ventes, reparations);
  alimenterTableauMoteursRepares(reparations);
  alimenterAlertesStock(equipementsStock);
}

function mettreAJourText(id, valeur) { const el = document.getElementById(id); if (el) el.textContent = valeur; }

// ---------------------------------------------------------
// GRAPHIQUES
// ---------------------------------------------------------
function genererGraphiques(ventes, reparations, filtre) {
  const filtreActif = filtre || 'MOTEURS';
  const moisNomsComplets = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  const aujourdhui = new Date();
  const moisActuel = aujourdhui.getMonth();
  const anneeActuelle = aujourdhui.getFullYear();
  const dateAujourdhuiIso = getDateLocaleISO(aujourdhui);
  const moisAffiches = moisNomsComplets.slice(0, moisActuel + 1);

  const reparationsMoteursQteMois = new Array(moisActuel + 1).fill(0);
  const ventesAutresQteMois = new Array(moisActuel + 1).fill(0);
  const reparationsPrixMois = new Array(moisActuel + 1).fill(0);
  const ventesPrixMois = new Array(moisActuel + 1).fill(0);

  reparations.forEach(function (r) {
    const dateLivraison = r.dateLivraison || r.date || '';
    const dLiv = new Date(dateLivraison || Date.now());
    
    let statut = r.statut || 'En cours de réparation';
    if (statut !== 'Livré' && dateLivraison && dateLivraison <= dateAujourdhuiIso) statut = 'Prêt à être livré';

    if (dLiv.getFullYear() === anneeActuelle && dLiv.getMonth() <= moisActuel) {
      if (estStatutComptabilise(statut)) {
          reparationsPrixMois[dLiv.getMonth()] += Number(r.totalCout || r.total || 0);
      }
      getEquipementsReparation(r).forEach(function (eqp) {
        const qte = parseInt(eqp.quantite) || 1;
        const nom = (eqp.appareil || eqp.equipement || '').toLowerCase();
        if (nom.indexOf('moteur') !== -1) {
          reparationsMoteursQteMois[dLiv.getMonth()] += qte;
        }
      });
    }
  });

  ventes.forEach(function (v) {
    const d = new Date(v.date || Date.now());
    if (d.getFullYear() === anneeActuelle && d.getMonth() <= moisActuel) {
      ventesPrixMois[d.getMonth()] += Number(v.total || v.totalPrix || v.totalMontant || 0);
      getArticlesVente(v).forEach(function (art) {
        const qte = parseInt(art.quantite) || 1;
        const nom = (art.equipement || art.article || art.nom || art.appareil || '').toLowerCase();
        if (nom.indexOf('moteur') === -1) {
          ventesAutresQteMois[d.getMonth()] += qte;
        }
      });
    }
  });

  const canvasTop = document.getElementById('chart-top-equipements');
  if (canvasTop) {
    const ctxTop = canvasTop.getContext('2d');
    let dataGraph1 = [];
    let labelGraph1 = '';

    if (filtreActif === 'MOTEURS') {
      dataGraph1 = reparationsMoteursQteMois;
      labelGraph1 = 'Moteurs Livrés/Prêts (Quantité)';
    } else {
      dataGraph1 = ventesAutresQteMois;
      labelGraph1 = 'Autres Équipements Vendus (Quantité)';
    }

    if (chartTopEquipements) chartTopEquipements.destroy();
    chartTopEquipements = new Chart(ctxTop, {
      type: 'bar',
      data: {
        labels: moisAffiches,
        datasets: [{ label: labelGraph1, data: dataGraph1, backgroundColor: filtreActif === 'MOTEURS' ? '#388bfd' : '#eab308', borderRadius: 4 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#8b949e' }, grid: { color: 'rgba(255,255,255,0.05)' } }, y: { ticks: { color: '#8b949e', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } } } }
    });
  }

  const canvasCompare = document.getElementById('chart-ventes-reparations');
  if (canvasCompare) {
    const ctxCompare = canvasCompare.getContext('2d');
    if (chartVentesVsReparations) chartVentesVsReparations.destroy();
    chartVentesVsReparations = new Chart(ctxCompare, {
      type: 'line',
      data: {
        labels: moisAffiches,
        datasets: [
          { label: 'Réparations (FCFA)', data: reparationsPrixMois, borderColor: '#388bfd', backgroundColor: 'rgba(56, 139, 253, 0.1)', tension: 0.3, fill: true },
          { label: 'Ventes (FCFA)', data: ventesPrixMois, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', tension: 0.3, fill: true }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#c9d1d9' } } }, scales: { x: { ticks: { color: '#8b949e' }, grid: { color: 'rgba(255,255,255,0.05)' } }, y: { ticks: { color: '#8b949e' }, grid: { color: 'rgba(255,255,255,0.05)' } } } }
    });
  }
}

function rafraichirGraphiques(filtre) {
  genererGraphiques(
    JSON.parse(localStorage.getItem('bme_historique_ventes')) || [],
    JSON.parse(localStorage.getItem('bme_historique_reparations')) || [],
    filtre
  );
}

// ---------------------------------------------------------
// TABLEAUX & ALERTES
// ---------------------------------------------------------
function alimenterTableauComparaisonCA(ventes, reparations) {
  const tbody = document.getElementById('tbody-comparaison-ca');
  if (!tbody) return;
  tbody.innerHTML = '';
  const moisNoms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const moisActuel = new Date().getMonth();
  const anneeActuelle = new Date().getFullYear();
  const dateAujourdhuiIso = getDateLocaleISO(new Date());
  const caParMois = new Array(moisActuel + 1).fill(0);

  ventes.forEach(function (v) {
    const d = new Date(v.date || Date.now());
    if (d.getFullYear() === anneeActuelle && d.getMonth() <= moisActuel) caParMois[d.getMonth()] += Number(v.total || v.totalPrix || v.totalMontant || 0);
  });
  reparations.forEach(function (r) {
    const d = new Date(r.dateLivraison || r.date || Date.now());
    let statut = r.statut || 'En cours de réparation';
    if (statut !== 'Livré' && (r.dateLivraison || r.date) && (r.dateLivraison || r.date) <= dateAujourdhuiIso) statut = 'Prêt à être livré';
    if (d.getFullYear() === anneeActuelle && d.getMonth() <= moisActuel && estStatutComptabilise(statut)) caParMois[d.getMonth()] += Number(r.totalCout || r.total || 0);
  });

  for (let idx = 0; idx <= moisActuel; idx++) {
    const ca = caParMois[idx];
    const caPrecedent = idx > 0 ? caParMois[idx - 1] : 0;
    let evol = '—';
    
    if (idx > 0) {
      if (caPrecedent > 0) {
        const pct = (((ca - caPrecedent) / caPrecedent) * 100).toFixed(1);
        evol = (pct >= 0 ? '+' + pct + '%' : pct + '%');
      } else if (ca > 0) {
        evol = '+100%';
      } else {
        evol = '0%';
      }
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${moisNoms[idx]}</td><td style="color:#10b981; font-weight:bold;">${ca.toLocaleString('fr-FR')} FCFA</td><td style="color:${evol.indexOf('+') === 0 ? '#10b981' : (evol.indexOf('-') === 0 ? '#ef4444' : '#8b949e')}">${evol}</td>`;
    tbody.appendChild(tr);
  }
}

function alimenterTableauMoteursRepares(reparations) {
  const tbody = document.getElementById('tbody-moteurs-repares');
  if (!tbody) return;
  tbody.innerHTML = '';
  const moisNoms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const moisActuel = new Date().getMonth();
  const anneeActuelle = new Date().getFullYear();
  const dateAujourdhuiIso = getDateLocaleISO(new Date());
  const moteursParMois = new Array(moisActuel + 1).fill(0);

  reparations.forEach(function (r) {
    const d = new Date(r.dateLivraison || r.date || Date.now());
    let statut = r.statut || 'En cours de réparation';
    if (statut !== 'Livré' && (r.dateLivraison || r.date) && (r.dateLivraison || r.date) <= dateAujourdhuiIso) statut = 'Prêt à être livré';
    if (d.getFullYear() === anneeActuelle && d.getMonth() <= moisActuel && estStatutComptabilise(statut)) {
      getEquipementsReparation(r).forEach(function (eqp) { moteursParMois[d.getMonth()] += parseInt(eqp.quantite) || 1; });
    }
  });

  for (let idx = 0; idx <= moisActuel; idx++) {
    const count = moteursParMois[idx];
    const countPrecedent = idx > 0 ? moteursParMois[idx - 1] : 0;
    let evol = '—';
    
    if (idx > 0) {
      if (countPrecedent > 0) {
        const pct = (((count - countPrecedent) / countPrecedent) * 100).toFixed(1);
        evol = (pct >= 0 ? '+' + pct + '%' : pct + '%');
      } else if (count > 0) {
        evol = '+100%';
      } else {
        evol = '0%';
      }
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${moisNoms[idx]}</td><td><strong>${count}</strong></td><td style="color:${evol.indexOf('+') === 0 ? '#10b981' : (evol.indexOf('-') === 0 ? '#ef4444' : '#8b949e')}">${evol}</td>`;
    tbody.appendChild(tr);
  }
}

function alimenterAlertesStock(equipements) {
  const listStock = document.getElementById('list-alertes-stock');
  if (!listStock) return;
  listStock.innerHTML = '';
  if (!equipements || equipements.length === 0) { listStock.innerHTML = `<li style="color: #8b949e; padding: 10px 0;">Aucune alerte de stock</li>`; return; }
  const alertes = equipements.filter(function (eq) { const qte = parseInt(eq.quantite !== undefined ? eq.quantite : (eq.qte !== undefined ? eq.qte : (eq.stock || 0))); return qte <= 3; });
  if (alertes.length === 0) { listStock.innerHTML = `<li style="color: #10b981; padding: 10px 0;">Stock optimal (Tous > 3)</li>`; return; }
  alertes.forEach(function (item) {
    const nom = item.nom || item.designation || item.produit || item.appareil || 'Équipement';
    const qte = parseInt(item.quantite !== undefined ? item.quantite : (item.qte !== undefined ? item.qte : (item.stock || 0)));
    const li = document.createElement('li');
    li.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); color: #ef4444; font-weight: bold; font-size: 0.9rem;';
    li.innerHTML = `<span><i class="fa-solid fa-triangle-exclamation" style="margin-right: 8px;"></i> ${nom}</span><span style="background: rgba(239, 68, 68, 0.2); padding: 2px 8px; border-radius: 4px;">Reste : ${qte}</span>`;
    listStock.appendChild(li);
  });
}

// =========================================================
// GESTION DE LA MODALE DES KPI
// =========================================================

window.ouvrirModalKPI = function(type) {
  const modal = document.getElementById('modalKPI');
  const titre = document.getElementById('modalKPI-titre');
  const liste = document.getElementById('modalKPI-liste');
  
  if (!modal || !titre || !liste) return;

  let titreTexte = '';
  let donnees = [];

  switch(type) {
    case 'encours':
      titreTexte = "Équipements en cours de réparation";
      donnees = detailsKPI.encours;
      break;
    case 'pret':
      titreTexte = "Équipements prêts à être livrés";
      donnees = detailsKPI.pret;
      break;
    case 'livre':
      titreTexte = "Équipements livrés (Total)";
      donnees = detailsKPI.livre;
      break;
    case 'recu':
      titreTexte = "Équipements reçus ce mois-ci";
      donnees = detailsKPI.recu;
      break;
    case 'vendu':
      titreTexte = "Équipements vendus ce mois-ci";
      donnees = detailsKPI.vendu;
      break;
  }

  titre.textContent = titreTexte;
  liste.innerHTML = '';

  if (!donnees || donnees.length === 0) {
    liste.innerHTML = `<li style="color: #8b949e; justify-content: center;">Aucun élément à afficher.</li>`;
  } else {
    donnees.forEach(function(item) {
      const li = document.createElement('li');
      li.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <span><strong>${item.qte}x</strong> ${item.nom} <small style="color:#38bdf8;">(${item.ref})</small></span>
          <span style="color: #8b949e; font-size: 0.75rem;">Client : ${item.client}</span>
        </div>
      `;
      liste.appendChild(li);
    });
  }

  modal.classList.add('active');
};

window.fermerModalKPI = function(event) {
  if (event) event.stopPropagation();
  const modal = document.getElementById('modalKPI');
  if (modal) modal.classList.remove('active');
};