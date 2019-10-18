'use strict';
import angular from 'angular';

// services

// components
import eventList from './event-list/event-list.component';

// Define the `App` module
export default angular.
  module('app', [
    eventList.name
  ])
