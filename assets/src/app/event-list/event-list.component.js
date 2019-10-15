'use strict';
import eventList from './event-list.module'

// Register 'eventList' component, along with its associated controller and template
export default angular.
  module(eventList.name).
  component('eventList', {
    template: require('./event-list.template.html'),
    controller: ['Event',
      function EventListController(Event) {
        var self = this;
        self.events = []
        self.paginator = 20;
    
        var loadEvents = function() {
          console.log(Event.all().$$state.value.data)
          Event.all().success(function(data){
            self.events = data.results;
          });       
        };
      
        self.getEvents = function(){
          if (self.events.length > 0) {
            return self.events.slice(0,self.paginator)
          } else {
            return self.events
          }
        }

        loadEvents()
      }
    ]
  });
