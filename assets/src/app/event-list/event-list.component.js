'use strict';
import eventList from './event-list.module'

var dateNow = new Date(Date.now())

function dateFormat (date) {
  var day = Number(date.split('/')[0])
  var month = Number(date.split('/')[1]) - 1
  var year = Number(date.split('/')[2])
  return new Date(year, month, day)
}

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
        self.query = {}
        self.query.dpt = "all"
    
        var loadEvents = function() {
          Event.all().then(
				    function resolved (response) {
              // get only next events
			        self.events = response.data.filter((val) => {
                return dateFormat(val.date) >= dateNow
              });

              // sort by dates
              self.events.sort((a, b) => {
                return dateFormat(a.date) - dateFormat(b.date)
              })
				    },
				    function rejected (response) {
				        alert("Une erreur est survenue lors du chargement de la liste. Réactualisez la page.");
				    });
        };
      
        self.getEvents = function() {
          if (self.events.length > 0) {
            return self.events.slice(0,self.paginator)
          } else {
            return self.events
          }
        }

        self.searchEvents = function() {
          // initialize query
          var query = {}
          query.startDate = new Date(self.query.startDate)
          query.endDate = new Date(self.query.endDate)
          query.dpt = self.query.dpt

          self.events = self.events.filter(function (data) {
            var dateFilter = dateFormat(data.date) >= query.startDate && dateFormat(data.date) <= query.endDate
            var dptFilter
            if (query.dpt !== "all") {
              dptFilter = Number(data.departement) === Number(query.dpt)
            } else {
              dptFilter = true
            }
            return dateFilter && dptFilter
          })
        }

        loadEvents()
      }
    ]
  });
