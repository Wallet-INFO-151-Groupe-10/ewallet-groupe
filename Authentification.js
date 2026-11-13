const btn = document.querySelector('.btnvoir');
//var nom = document.getElementById('nomClient');
let nom = 'Johan';
let solde = 150000;

btn.addEventListener('click', () => {
    alert(`Bonjour cher monsieur/madame ${nom} votre saolde est de ${solde}`);
});