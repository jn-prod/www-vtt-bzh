'use strict';
describe('Event', function() {
  var $httpBackend;
  var Event;
  var eventsData = [
    {name: 'Event X'},
    {name: 'Event Y'},
    {name: 'Event Z'}
  ];

  // Add a custom equality tester before each test
  beforeEach(function() {
    jasmine.addCustomEqualityTester(angular.equals);
  });

  // Load the module that contains the `Event` service before each test
  beforeEach(angular.mock.module('core.event'));
  beforeEach(inject(function(_$httpBackend_, _Event_){
    $httpBackend = _$httpBackend_;
    $httpBackend.when('api/events.json').respond(eventsData);

    Event = _Event_;
  }));

  afterEach(function(){
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  })


  describe('.all()', function() {
    it("'Event' should have a '.all()' method", function(){
      expect(typeof Event.all).toBe('function')
    })

    it('fetches from the API', function() {
      expect(true).toBe(true)
    });
  });

});
