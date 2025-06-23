FROM node:20
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --omit=dev
COPY frontend-issue-tracker/package.json frontend-issue-tracker/package-lock.json frontend-issue-tracker/
RUN cd frontend-issue-tracker && npm install --omit=dev && npm run build && cd ..
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
