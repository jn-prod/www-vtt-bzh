'use strict';
describe('Event', function() {
  var $httpBackend;
  var $rootScope;
  var Event;
  var eventsData = [{
    "departement":"35",
    "city":"SAINT GERMAIN EN COGLES",
    "_type":"dict",
    "name":"La Castelgermanaise",
    "hour":"13H30",
    "price":"5€",
    "organisateur":
    "Cyclo club de St Germain en Cogles",
    "website":"",
    "contact":"bersofi@laposte.net / Tél. : 06 60 35 06 08",
    "date":"28/9/2019","description":""
  }, {
    "departement":"29",
    "city":"CAST",
    "_type":"dict",
    "name":"A LA POURSUITE DES KORIGANS",
    "hour":"20h30",
    "price":"7€",
    "organisateur":"CAST VTT",
    "website":"",
    "contact":"",
    "date":"05/10/2019",
    "description":""
  }, {
    "departement":"56",
    "city":"LOCMINE",
    "_type":"dict",
    "name":"virades de l'espoir",
    "hour":"8H00",
    "price":"5€ minimum",
    "organisateur":"vaincre la mucoviscidose",
    "website":"",
    "contact":"didier256.francois@laposte.net / Tél. : 06 83 26 45 36","date":"29/9/2019","description":""
  }];

  // Add a custom equality tester before each test
  beforeEach(function() {
    jasmine.addCustomEqualityTester(angular.equals);
  });

  // Load the module that contains the `Event` service before each test
  beforeEach(angular.mock.module('core.event'));

  beforeEach(inject(function(_$httpBackend_, _$rootScope_, _Event_){

    $httpBackend = _$httpBackend_;
    $httpBackend.whenGET('api/events.json').respond(function(){
       return [200, JSON.stringify(eventsData)];
    })

    $rootScope = _$rootScope_;

    Event = _Event_;
    this.OKEvents = function() {
      var i1 = new Event();
      return [200, JSON.stringify([ i1]), {}];
    }

  }));

  afterEach(function(){

    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();

  })


  describe('.all()', function() {

    it("'Event' should have a '.all()' method", function(){

      expect(Event.all).toBeDefined()
      expect(typeof Event.all).toBe('function')

    })

    it('fetches from the API', function() {

      var result;

      Event.all().then(function(res){
        result = res;
      });

      $httpBackend.flush();

      expect(result[0]).toEqual(eventsData[0]);
      expect(result[1]).toEqual(eventsData[1]);
      expect(result[2]).toEqual(eventsData[2]);

    });
  });

});
