# ConnectFour
Chess.com, but Game of the Mind!
=======
Closed Source Connect Four Online!

## Directory Structure
```
.
├── backend [Django]
|   ├── [List of all apps we need]
├── frontend [React / TS]
    ├── src: client-side code
    │   ├── app: main app components
    │   ├── lib: utility functions
    │   ├── pages: routes
    |   └── components: reusable components
    ├── public: static files e.g. images, fonts
```

## Config Files
- `.gitignore`: configures ignored files and directories
- `next.config.mjs`: Next.js configuration
- `package.json`: js dependencies and scripts
- `postcss.config.mjs`: postcss configuration
- `README.md`: this file
- `requirements.txt`: python dependencies
- `tailwind.config.ts`: TailwindCSS configuration
- `tsconfig.json`: TypeScript configuration

Add a section here for development test v
## Development
1. Install dependencies
```bash
npm install
```
2. Start the development server
```bash
npm run start:all
```

<<<<<<< Updated upstream
## Setup - Without Docker
1. Clone the repository
```bash
git clone https://github.com/abhinav-gg/connectfour.git
```
2. Install React and Next.js dependencies
```bash
npm install
```
If that doesn't work, you probably need to [install Node.js](https://nodejs.org/en).

## Development
### Frontend (React)
1. Start the development server
```bash
yarn dev
```
2. Open [http://localhost:3000](http://localhost:3000)
3. Edit files in `./src` (the page should automatically reload)

### Python API
1. Start the server
```bash
cd server
python manage.py runserver
```
2. Edit files in `./server`

### Next.js server
1. Start the development server
```bash
yarn dev
```
2. Open [http://localhost:3000](http://localhost:3000)
3. Edit files in `./src/pages/api`

## Deployment
Change "Build Command" in Render to `yarn build` and "Start Command" to `yarn start & python server/main.py`

## General Guidelines
- Commit whenever you make a significant change
- Push when you've finished a feature
- I will try to figure out how branches work and update this README accordingly
=======
Django and React project
=======
>>>>>>> Stashed changes
