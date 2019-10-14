'use strict';
import eventList from './event-list.module'

// Register 'eventList' component, along with its associated controller and template
export default angular.
  module(eventList.name).
  component('eventList', {
    template: require('./event-list.template.html'),
    controller: [ 'Event',
      function EventListController(Event) {
          this.events = Event.query();
        }
    ]
  });