const routesGroups = {
  auth: '(auth)',
  main: '(main)',
};

export const navigationConfig = {
  auth: {
    root: routesGroups.auth,
  },
  main: {
    root: routesGroups.main,
    'ui-kit': `ui-kit`,
  },
};
