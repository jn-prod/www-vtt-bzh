import eventModule from './event.module'

export default angular
  .module(eventModule.name)
  .factory('Event', ['$http',
    function ($http) {
      return {
        all: function(){
          return $http.get("api/events.json");
        }
      }
    }
  ]);
