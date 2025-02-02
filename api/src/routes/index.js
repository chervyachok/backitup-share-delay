const express = require('express');
const router = express.Router();
const defaultRoutes = [
  
  {
    path: '/dispatch',
    route: require('./dispatch.route'),
  }, 
  {
    path: '/backup',
    route: require('./backup.route'),
  }, 
  {
    path: '/lit',
    route: require('./lit.route'),
  },
  
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
