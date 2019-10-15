'use strict';
import angular from 'angular';

// services
import eventService from './core/event/event.service';

// components
import eventList from './event-list/event-list.component';

// Define the `App` module
export default angular.
  module('app', [
    eventService.name,
    eventList.name
  ])
