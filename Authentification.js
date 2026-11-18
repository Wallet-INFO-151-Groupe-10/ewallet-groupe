// Éléments du DOM
const form = document.getElementById('compteForm');
const inputNom = document.getElementById('nomClient');
const inputPin = document.getElementById('pinClient');
const dashboardClient = document.getElementById('dashboardClient');
const salutationClient = document.getElementById('salutationClient');
const affichageSolde = document.getElementById('affichageSolde');
const alerteFeedback = document.getElementById('alerteFeedback');

// Contrôles d'opérations
const inputMontant = document.getElementById('montantOperation');
const btnDepot = document.getElementById('btnDepot');
const btnRetrait = document.getElementById('btnRetrait');
const inputDestinataire = document.getElementById('destinataireVirement');
const inputMontantVirement = document.getElementById('montantVirement');
const btnVirement = document.getElementById('btnVirement');

// Actions rapides & Historique
const btnToggleSolde = document.getElementById('btnToggleSolde');
const btnTelecharger = document.getElementById('btnTelecharger');
const btnDeconnexion = document.getElementById('btnDeconnexion');
const listeHistorique = document.getElementById('listeHistorique');

const CLE_STORAGE = 'banque_clients_v2';
let clientActif = null;
let soldeMasque = false;
let filtreActif = 'tout';

// Comptes pré-enregistrés pour tester immédiatement les virements
const comptesInitiaux = {
    johan: {
        nom: 'Johan',
        pin: '1234',
        solde: 150000,
        historique: [
            { type: 'Dépôt initial', montant: 150000, date: 'Aujourd’hui', signe: '+' }
        ]
    },
    marie: {
        nom: 'Marie',
        pin: '0000',
        solde: 85000,
        historique: [
            { type: 'Dépôt initial', montant: 85000, date: 'Aujourd’hui', signe: '+' }
        ]
    }
};

// 1. Gestion du stockage local
function chargerComptes() {
    const data = localStorage.getItem(CLE_STORAGE);
    if (!data) {
        sauvegarderComptes(comptesInitiaux);
        return comptesInitiaux;
    }
    return JSON.parse(data);
}

function sauvegarderComptes(comptes) {
    localStorage.setItem(CLE_STORAGE, JSON.stringify(comptes));
}

// 2. Utilitaires de formatage et date
function formaterMontant(montant) {
    return `${montant.toLocaleString('fr-FR')} FCFA`;
}

function obtenirDateHeure() {
    return new Date().toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 3. Affichage des notifications
function afficherMessage(texte, type = 'succes') {
    alerteFeedback.textContent = texte;
    alerteFeedback.className = `alerte-feedback ${type}`;
    alerteFeedback.hidden = false;

    clearTimeout(alerteFeedback.timer);
    alerteFeedback.timer = setTimeout(() => {
        alerteFeedback.hidden = true;
    }, 4500);
}

// 4. Authentification ou création sécurisée de compte
function authentifierClient(nomSaisi, pinSaisi) {
    const comptes = chargerComptes();
    const cle = nomSaisi.trim().toLowerCase();
    const nomFormate = nomSaisi.trim().charAt(0).toUpperCase() + nomSaisi.trim().slice(1);

    if (!/^\d{4}$/.test(pinSaisi)) {
        afficherMessage('Le code PIN doit contenir exactement 4 chiffres.', 'erreur');
        return null;
    }

    if (comptes[cle]) {
        if (comptes[cle].pin !== pinSaisi) {
            afficherMessage('Code PIN incorrect pour ce compte.', 'erreur');
            return null;
        }
        afficherMessage(`Bienvenue ${comptes[cle].nom} ! Votre solde est de ${formaterMontant(comptes[cle].solde)}.`, 'succes');
        return cle;
    } else {
        // Création d'un nouveau compte avec le PIN choisi
        comptes[cle] = {
            nom: nomFormate,
            pin: pinSaisi,
            solde: 50000,
            historique: [
                { type: 'Bonus de bienvenue', montant: 50000, date: obtenirDateHeure(), signe: '+' }
            ]
        };
        sauvegarderComptes(comptes);
        afficherMessage(`Compte créé pour ${nomFormate} (PIN: ${pinSaisi}) avec 50 000 FCFA offerts !`, 'succes');
        return cle;
    }
}

// 5. Mise à jour de l'interface et filtrage de l'historique
function actualiserInterface() {
    if (!clientActif) return;

    const comptes = chargerComptes();
    const infos = comptes[clientActif];

    salutationClient.innerHTML = `Bonjour, <strong>${infos.nom}</strong>`;
    affichageSolde.textContent = soldeMasque ? '•••••• FCFA' : formaterMontant(infos.solde);

    // Filtrage de l'historique
    const operationsFiltrees = infos.historique.filter((op) => {
        if (filtreActif === 'tout') return true;
        return op.signe === filtreActif;
    });

    listeHistorique.innerHTML = '';
    if (operationsFiltrees.length === 0) {
        listeHistorique.innerHTML = '<li style="justify-content:center; color:#64748b;">Aucune opération</li>';
        return;
    }

    operationsFiltrees.forEach((op) => {
        const li = document.createElement('li');
        const classeMontant = op.signe === '+' ? 'op-positif' : 'op-negatif';
        li.innerHTML = `
            <div>
                <span>${op.type}</span>
                <span class="op-date">${op.date}</span>
            </div>
            <span class="${classeMontant}">${op.signe}${formaterMontant(op.montant)}</span>
        `;
        listeHistorique.appendChild(li);
    });
}

// 6. Dépôt et Retrait
function effectuerOperation(type) {
    if (!clientActif) return;
    const montant = parseFloat(inputMontant.value);

    if (isNaN(montant) || montant <= 0) {
        afficherMessage('Veuillez saisir un montant valide supérieur à 0.', 'erreur');
        return;
    }

    const comptes = chargerComptes();
    const client = comptes[clientActif];

    if (type === 'retrait') {
        if (montant > client.solde) {
            afficherMessage('Solde insuffisant pour ce retrait.', 'erreur');
            return;
        }
        client.solde -= montant;
        client.historique.unshift({ type: 'Retrait espèces', montant, date: obtenirDateHeure(), signe: '-' });
        afficherMessage(`Retrait de ${formaterMontant(montant)} validé.`, 'succes');
    } else if (type === 'depot') {
        client.solde += montant;
        client.historique.unshift({ type: 'Dépôt espèces', montant, date: obtenirDateHeure(), signe: '+' });
        afficherMessage(`Dépôt de ${formaterMontant(montant)} validé.`, 'succes');
    }

    sauvegarderComptes(comptes);
    inputMontant.value = '';
    actualiserInterface();
}

// 7. Virement entre deux comptes clients
function effectuerVirement() {
    if (!clientActif) return;

    const nomDest = inputDestinataire.value.trim();
    const cleDest = nomDest.toLowerCase();
    const montant = parseFloat(inputMontantVirement.value);

    if (!nomDest) {
        afficherMessage('Veuillez indiquer le nom du bénéficiaire.', 'erreur');
        return;
    }
    if (cleDest === clientActif) {
        afficherMessage('Vous ne pouvez pas faire un virement vers votre propre compte.', 'erreur');
        return;
    }
    if (isNaN(montant) || montant <= 0) {
        afficherMessage('Veuillez saisir un montant de virement valide.', 'erreur');
        return;
    }

    const comptes = chargerComptes();
    if (!comptes[cleDest]) {
        afficherMessage(`Le client "${nomDest}" n'existe pas.`, 'erreur');
        return;
    }

    const expediteur = comptes[clientActif];
    const destinataire = comptes[cleDest];

    if (montant > expediteur.solde) {
        afficherMessage('Solde insuffisant pour effectuer ce virement.', 'erreur');
        return;
    }

    const dateOp = obtenirDateHeure();

    // Débit expéditeur & Crédit bénéficiaire
    expediteur.solde -= montant;
    expediteur.historique.unshift({
        type: `Virement vers ${destinataire.nom}`,
        montant,
        date: dateOp,
        signe: '-'
    });

    destinataire.solde += montant;
    destinataire.historique.unshift({
        type: `Virement reçu de ${expediteur.nom}`,
        montant,
        date: dateOp,
        signe: '+'
    });

    sauvegarderComptes(comptes);
    inputDestinataire.value = '';
    inputMontantVirement.value = '';
    afficherMessage(`Virement de ${formaterMontant(montant)} envoyé à ${destinataire.nom} !`, 'succes');
    actualiserInterface();
}

// 8. Masquer / Afficher le solde
function basculerVisibiliteSolde() {
    soldeMasque = !soldeMasque;
    btnToggleSolde.innerHTML = soldeMasque
        ? '<i class="fa-regular fa-eye-slash"></i>'
        : '<i class="fa-regular fa-eye"></i>';
    actualiserInterface();
}

// 9. Télécharger un relevé de compte en fichier .txt
function telechargerReleve() {
    if (!clientActif) return;
    const comptes = chargerComptes();
    const infos = comptes[clientActif];

    let contenu = `=== RELEVÉ DE COMPTE CLIENT ===\n`;
    contenu += `Titulaire : ${infos.nom}\n`;
    contenu += `Date d'édition : ${obtenirDateHeure()}\n`;
    contenu += `Solde disponible : ${formaterMontant(infos.solde)}\n`;
    contenu += `=================================\n\nHISTORIQUE DES OPÉRATIONS :\n`;

    infos.historique.forEach((op) => {
        contenu += `- [${op.date}] ${op.type} : ${op.signe}${formaterMontant(op.montant)}\n`;
    });

    const blob = new Blob([contenu], { type: 'text/plain;charset=utf-8' });
    const lien = document.createElement('a');
    lien.href = URL.createObjectURL(blob);
    lien.download = `Releve_${infos.nom}.txt`;
    lien.click();
    URL.revokeObjectURL(lien.href);
    afficherMessage('Relevé téléchargé avec succès.', 'succes');
}

// 10. Déconnexion
function deconnecterClient() {
    clientActif = null;
    soldeMasque = false;
    dashboardClient.hidden = true;
    form.hidden = false;
    inputNom.value = '';
    inputPin.value = '';
    alerteFeedback.hidden = true;
}

// Écouteurs d'événements principaux
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const cle = authentifierClient(inputNom.value, inputPin.value);
    if (cle) {
    clientActif = cle;
    form.hidden = true;
    dashboardClient.hidden = false;
    actualiserInterface();
    }
});
btnDepot.addEventListener('click', () => effectuerOperation('depot'));
btnRetrait.addEventListener('click', () => effectuerOperation('retrait'));
btnVirement.addEventListener('click', effectuerVirement);
btnToggleSolde.addEventListener('click', basculerVisibiliteSolde);
btnTelecharger.addEventListener('click', telechargerReleve);
btnDeconnexion.addEventListener('click', deconnecterClient);
// Gestion des onglets (Dépôt/Retrait vs Virement)
document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
        document.querySelectorAll('.tab-contenu').forEach((c) => (c.hidden = true));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).hidden = false;
    });
});
// Gestion des filtres d'historique
document.querySelectorAll('.filtre-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filtre-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        filtreActif = btn.dataset.filtre;
        actualiserInterface();
    });
});