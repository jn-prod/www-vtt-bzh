export default angular
  .module('core.event', [])
  .factory('Event', function Event($http) {
    return{
      all: function(){
        return $http.get("api/events.json");
      }
    }
  });
