'use strict';
describe('Event', function() {

  var EventData, $http;

  var eventsData = [
    {name: 'Event X'},
    {name: 'Event Y'},
    {name: 'Event Z'}
  ];

  // Load the module that contains the `Event` service before each test
  beforeEach(function(){
    angular.mock.module('core.event')
    angular.mock.inject(function(_Event_, $httpBackend){
      Event = _Event_
      $http = $httpBackend
    })
  })

  afterEach(function(){
    $http.verifyNoOutstandingExpectation();
    $http.verifyNoOutstandingRequest();
  })

  it("Should have a getAll method", function(){
   expect(Event.all).to.be.a('function')
  })

  it("Should call API", function(){
    $http.expect(Event.all).respond(false)
    Event.all()
    $http.flush()
  })

});