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
        // config
        var self = this;
        self.events = []
        self.paginator = 20;
        self.search = {
          query: { dpt: "all"},
          active: false,
          results: []
        }
    
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
          if(self.search.active) {
            return self.search.results.slice(0,self.paginator)
          } else if (self.events.length > 0) {
            return self.events.slice(0,self.paginator)
          } else {
            return self.events
          }
        }

        // search event
        self.searchEvents = function() {
          // initialize query
          var query = {}

          self.paginator = 20;
          self.search.active = true

          // set start date query
          if (query.startDate === undefined || query.startDate === null) {
            query.startDate = dateNow
          } else {
            query.startDate = self.search.query.startDate
          }

          // set end date query
          if (query.endDate === undefined || query.endDate === null) {
            query.endDate = new Date(dateNow.getFullYear() + 1, dateNow.getMonth(), dateNow.getDate());
          } else {
            query.endDate = self.search.query.endDate
          }

          // set departement query
          query.dpt = self.search.query.dpt
          
          // query on events data
          self.search.results = self.events.filter(function(data) {
            var dptFilter
            var eventDate = dateFormat(data.date)
            var dateFilter = (eventDate >= query.startDate) && (eventDate <= query.endDate)

            if (query.dpt !== "all") {
              dptFilter = Number(data.departement) === Number(query.dpt)
            } else {
              dptFilter = true
            }

            return dateFilter && dptFilter
          })
        }

        // reset search
        self.searchReset = function() {
          self.paginator = 20;
          self.search.active = false
        }

        // display button load more
        self.loadMoreIsActive = function () {
          if(self.search.active) {
            return self.paginator < self.search.results.length
          } else {
            return self.paginator < self.events.length
          }         
        }

        loadEvents()
      }
    ]
  });
