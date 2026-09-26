# Construit depuis la RACINE du dépôt (voir docker-compose.yml :
# build.context = ".", build.dockerfile = "backend/Dockerfile"), pour
# que la même structure de dossiers existe en local et dans l'image
# — backend/src/app.js retrouve connexionSignUp/ au même endroit
# relatif (../../connexionSignUp) qu'en développement.
FROM node:22-alpine

WORKDIR /app

COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm install --omit=dev

COPY backend/src ./backend/src
COPY connexionSignUp ./connexionSignUp

WORKDIR /app/backend
EXPOSE 3000
CMD ["node", "src/server.js"]
