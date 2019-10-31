import eventModule from './event.module'

export default angular
  .module(eventModule.name)
  .factory('Event', ['$http', '$q',
    function ($http, $q) {
      return {
        all: function(){
          var defered= $q.defer()
          $http({
            url: 'api/events.json',
            method:'GET'
          }).then(function(events){
            defered.resolve(events.data);
          },function(err){
            defered.reject(err);
          })
          return defered.promise;;
        }
      }
    }
  ]);
