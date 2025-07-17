FROM node:20

WORKDIR /app

COPY package.json ./
RUN npm install --only=production

COPY dist ./dist
COPY frontend-dist ./dist/frontend-dist
COPY uploads ./uploads

EXPOSE 3000
CMD ["node", "dist/server.js"]
