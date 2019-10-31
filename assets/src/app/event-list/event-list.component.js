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
        var defaultSearch = {
          query: {
            dpt: "all",
            startDate: dateNow,
            endDate: new Date(dateNow.getFullYear() + 1, dateNow.getMonth(), dateNow.getDate())
          },
          active: false,
          results: []
        }
        self.events = []
        self.paginator = 20;
        self.isOpen = false;
        self.search = formatDefaultSearch(defaultSearch);
        self.isLoading = true

        function formatDefaultSearch(defaultSearchParams) {
          var search = JSON.parse(JSON.stringify(defaultSearchParams))
          search.query.startDate = new Date(search.query.startDate)
          search.query.endDate = new Date(search.query.endDate)
          return search
        }
    
        var loadEvents = function() {
          Event.all().then(function (data) {
              // get only next events
              self.events = data.filter((val) => {
                return dateFormat(val.date) >= dateNow
              });

              // sort by dates
              self.events.sort((a, b) => {
                return dateFormat(a.date) - dateFormat(b.date)
              })
              self.isLoading = false
            }).catch(function(err) {
              self.isLoading = true
              alert("Une erreur est survenue lors du chargement du calendrier. Réactualisez la page.");              
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
          var query = self.search.query

          // ctrl config
          self.paginator = 20;
          self.search.active = true

          // return events' data wich match with the query
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
          self.search = formatDefaultSearch(defaultSearch)
        }

        // display button load more
        self.loadMoreIsActive = function () {
          if(self.search.active) {
            return self.paginator < self.search.results.length
          } else {
            return self.paginator < self.events.length
          }         
        }

        self.showHelper = function() {
          if(!self.isLoading && self.search.active && self.search.results.length < 1) {
            return true
          } else if (!self.isLoading && self.events.length < 1) {
            return true
          } else {
            return false
          }
        }

        loadEvents()
      }
    ]
  });
