'use strict';
import eventList from './event-list.module'

// Register 'eventList' component, along with its associated controller and template
export default angular.
  module(eventList.name).
  component('eventList', {
    template: require('./event-list.template.html'),
    controller: ['$http',
    	function EventListController($http) {
	      var self = this;
	      self.events = []
	      self.paginator = 20

	      $http.get('api/events.json').then(function(response) {
	        self.events = response.data;
	      });

	      self.getEvents = function(){
	      	if (self.events.length > 0) {
						return self.events.slice(0,self.paginator)
	      	} else {
	      		return self.events
	      	}
	      }
	    }
	  ]
  });