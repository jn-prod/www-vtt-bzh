export default angular
  .module('services.event', [])
  .factory('Event', ['$http',
    function ($http) {
      return {
        all: function(){
          return $http.get("api/events.json");
        }
      }
    }
  ]);
