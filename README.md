# ConnectFour
Chess.com, but Game of the Mind!

All Old Rubbish™ can be found in the `old_stuff` directory.

## Directory Structure
```
.
├── server: server-side code
├── src: client-side code
├── public: static files e.g. images, fonts
└── old_stuff: old python code. may be useful for reference
```

## Config Files
- `.gitignore`: configures ignored files and directories
- `.npmrc`: some sort of NPM configuration. probably not important
- `package.json`: dependencies and scripts
- `postcss.config.js`: postcss configuration
- `README.md`: this file
- `svelte.config.js`: SvelteKit configuration
- `tailwind.config.js`: TailwindCSS configuration
- `tsconfig.json`: TypeScript configuration
- `vite.config.js`: Vite configuration
- `yarn.lock`: auto-generated yarn lockfile (don't touch this!)

## Setup
1. Clone the repository
```bash
git clone https://github.com/abhinav-gg/connectfour.git
```
2. Install dependencies
```bash
cd connectfour
yarn install
```

## Development
### Frontend (SvelteKit)
1. Start the development server
```bash
yarn dev
```
2. Open [http://localhost:3000](http://localhost:3000)

### Backend (Express + TypeScript)
1. Compile the TypeScript code using my script
```bash
yarn run start
```
2. Open [http://localhost:3000](http://localhost:3000)

## Resources
- [React Docs](https://react.dev/reference/react)
- [Next.js Docs](https://nextjs.org/docs)
- [Express Docs](https://expressjs.com/en/4x/api.html)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [Yarn Docs](https://yarnpkg.com/getting-started)

## Managing Dependencies
- Add a new dependency
```bash
yarn add <package-name>
```
- Remove a dependency
```bash
yarn remove <package-name>
```
- Update all dependencies
```bash
yarn upgrade
```
- Update a specific dependency
```bash
yarn upgrade <package-name>
```
- Install all dependencies
```bash
yarn install
```

## Deployment
Change "Build Command" in Render to `yarn install && yarn build && yarn tsc` and "Start Command" to `node dist/server/server.js`

## General Guidelines
- Commit whenever you make a significant change
- Push when you've finished a feature
- I will try to figure out how branches work and update this README accordingly