import { creerApp } from "./app.js";

const port = process.env.PORT || 3000;
const app = creerApp();

app.listen(port, () => {
  console.log(`SiègeVif — serveur démarré sur http://localhost:${port}`);
});
