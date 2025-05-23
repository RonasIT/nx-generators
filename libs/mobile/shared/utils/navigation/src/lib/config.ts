const routesGroups = {
  auth: '(auth)',
  main: '(main)',
};

export const navigationConfig = {
  routesGroups,
  routes: {
    signIn: `/${routesGroups.auth}`,
    profile: `/${routesGroups.main}`,
  },
};
