'use strict';

/**
 * @ngdoc overview
 * @name wizardNewApp
 * @description
 * # wizardNewApp
 *
 * Main module of the application.
 */
var app = angular.module('wizardNewApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        controllerAs: 'main'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
