/**
 * Partagé entre connexion.html et inscription.html.
 * TODO(Lina — seed base de données) : remplacer ces valeurs par les
 * vrais comptes créés au démarrage (le README doit documenter des
 * comptes de démo, exigé par l'énoncé du sprint 1).
 */
const DEMO_ACCOUNTS = [
  { initials: "SM", nom: "Sophie", email: "sophie@mail.com", motDePasse: "demo1234" },
  { initials: "LB", nom: "Lucas", email: "lucas@mail.com", motDePasse: "demo1234" },
  { initials: "ID", nom: "Isabelle", email: "isabelle@mail.com", motDePasse: "demo1234" },
];

/** Injecte les 3 boutons démo dans #demo-access et branche le clic. */
function afficherAccesDemo(onSelect) {
  const conteneur = document.getElementById("demo-access");
  conteneur.innerHTML = DEMO_ACCOUNTS.map(
    (compte, index) => `
      <button type="button" class="auth-demo-button" data-index="${index}">
        <span class="auth-demo-avatar ${index !== 0 ? "is-alt" : ""}">${compte.initials}</span>
        <span class="auth-demo-name">${compte.nom}</span>
      </button>`
  ).join("");

  conteneur.querySelectorAll(".auth-demo-button").forEach((bouton) => {
    bouton.addEventListener("click", () => {
      onSelect(DEMO_ACCOUNTS[Number(bouton.dataset.index)]);
    });
  });
}

/** Bascule un champ mot de passe entre masqué et visible. */
function brancherAfficherMotDePasse(champId, boutonId) {
  const champ = document.getElementById(champId);
  const bouton = document.getElementById(boutonId);
  bouton.addEventListener("click", () => {
    champ.type = champ.type === "password" ? "text" : "password";
  });
}

function estCourrielValide(valeur) {
  return /^\S+@\S+\.\S+$/.test(valeur);
}

/** Affiche ou efface le message d'erreur d'un champ précis. */
function afficherErreurChamp(champId, erreurId, message) {
  document.getElementById(champId).setAttribute("aria-invalid", message ? "true" : "false");
  document.getElementById(erreurId).textContent = message || "";
}

/** Affiche ou masque le message d'erreur global du formulaire (ex. réponse serveur). */
function afficherErreurFormulaire(message) {
  const el = document.getElementById("erreur-formulaire");
  el.textContent = message || "";
  el.hidden = !message;
}
