# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Docker Compose

To run the server with MongoDB using Docker:

```bash
docker-compose up --build
```

Then open http://localhost:3000 in your browser.


The stack initializes a MongoDB database named `tracker` on first run.
An admin user `apadmin` with password `ehfpal!!` is created automatically.
