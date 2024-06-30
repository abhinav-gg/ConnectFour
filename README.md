# ConnectFour
Chess.com, but Game of the Mind!

All Old Rubbish™ can be found in the `old_stuff` directory.

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
- `yarn.lock`: auto-generated yarn lockfile (don't touch this!)

## Setup
1. Clone the repository
```bash
git clone https://github.com/abhinav-gg/connectfour.git
```
2. Install React and Next.js dependencies
```bash
cd frontend
yarn install
```
If you don't have yarn installed, enable `corepack` then try again:
```bash
corepack enable
```
If that doesn't work, you probably need to [install Node.js](https://nodejs.org/en).

3. Setup Python virtual environment
```bash
python -m venv venv
venv\Scripts\activate
```
4. Install Python dependencies
```bash
cd backend
pip install -r requirements.txt
```

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