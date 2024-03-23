# NX Generators

NX generators for Ronas IT projects

This library contains 3 generators:
1. repo-config
2. code-checks
3. expo-app

## Running

1. Create monorepo with expo app:  
`npx create-nx-workspace@latest my-project --preset=expo --appName=my-app --e2eTestRunner=none --ci=skip`  

2. Install this pakage:  
`npm i @ronas-it/nx-generators`  

3. Start generators:  
`npx nx generate repo-config`  
`npx nx generate code-checks`  
`npx nx generate expo-app`  

Or install all generators:  
`npx nx generate repo-config && npx nx generate code-checks && npx nx generate expo-app`  

4. Start app:  
`cd apps/my-app`  
`npm run start`  
