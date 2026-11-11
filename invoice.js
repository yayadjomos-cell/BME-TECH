// ==========================================
// COMPTEUR AUTO-INCRÉMENTÉ (1, 2, 3...)
// ==========================================
function obtenirProchainNumeroFacture() {
  // Récupère le dernier numéro utilisé (0 par défaut)
  let dernierNumero = parseInt(localStorage.getItem('dernierNumeroFacture')) || 0;
  let nouveauNumero = dernierNumero + 1;

  // Formatage du numéro sur 4 chiffres (ex: 0001, 0002...)
  return {
    brut: nouveauNumero,
    formate: String(nouveauNumero).padStart(4, '0')
  };
}

function enregistrerNumeroFacture(numero) {
  localStorage.setItem('dernierNumeroFacture', numero);
}

// ==========================================
// FONCTION DE GÉNÉRATION DE FACTURE
// ==========================================
function genererFactureDepuisFormulaire() {
  // 1. Récupération des champs du formulaire
  const nomClient = document.getElementById('nomClient')?.value.trim() || '';
  const telClient = document.getElementById('telephone')?.value.trim() || '';

  const equipement = document.getElementById('equipement')?.value.trim() || '';
  const modele = document.getElementById('reference')?.value.trim() || '';
  const panne = document.getElementById('panne')?.value.trim() || '';
  const prixUnitaire = parseFloat(document.getElementById('prixVente')?.value) || 0;
  const quantite = parseInt(document.getElementById('quantite')?.value) || 0;

  // 2. VÉRIFICATION STRICTE : pas de facture si les champs sont vides
  if (!nomClient || !equipement || prixUnitaire <= 0 || quantite <= 0) {
    alert("Impossible de générer la facture : Veuillez remplir tous les champs obligatoires du formulaire (Client, Équipement, Prix et Quantité).");
    return;
  }

  // 3. Calcul du numéro séquentiel
  const numFacture = obtenirProchainNumeroFacture();

  // 4. Injection des données réelles dans le document HTML de la facture
  document.getElementById('invNumber').textContent = numFacture.formate;
  document.getElementById('invDate').textContent = new Date().toLocaleDateString('fr-FR');

  document.getElementById('invClientName').textContent = nomClient;
  document.getElementById('invClientAddress').textContent = 'Adresse non renseignée';
  document.getElementById('invClientPhone').textContent = telClient ? `Tél: ${telClient}` : '';

  // 5. Remplissage de la table des prestations
  const tbody = document.getElementById('invItemsBody');
  tbody.innerHTML = '';

  const totalLigne = prixUnitaire * quantite;

  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td class="text-center">1</td>
    <td>${equipement}${modele ? ' (' + modele + ')' : ''}</td>
    <td class="text-right">${prixUnitaire.toLocaleString('fr-FR')} FCFA</td>
    <td class="text-center">${quantite}</td>
    <td class="text-right">${totalLigne.toLocaleString('fr-FR')} FCFA</td>
  `;
  tbody.appendChild(tr);

  // 6. Calculs financiers — TVA SUPPRIMÉE
  const sousTotal = totalLigne;
  const totalTTC = sousTotal;

  document.getElementById('invSubTotal').textContent = sousTotal.toLocaleString('fr-FR') + ' FCFA';
  document.getElementById('invTotalTTC').textContent = totalTTC.toLocaleString('fr-FR') + ' FCFA';

  // 7. Enregistrer le numéro utilisé et afficher la modal
  enregistrerNumeroFacture(numFacture.brut);
  document.getElementById('invoiceModal').style.display = 'block';
}

// Fonction pour fermer la modal
function fermerFacture() {
  document.getElementById('invoiceModal').style.display = 'none';
}

// ==========================================
// ÉCOUTEUR SUR LE BOUTON "FACTURE"
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const btnFacture = document.querySelector('.btn-invoice');
  if (btnFacture) {
    btnFacture.addEventListener('click', (e) => {
      e.preventDefault();
      genererFactureDepuisFormulaire();
    });
  }
});