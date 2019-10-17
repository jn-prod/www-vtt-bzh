import eventService from '../core/event/event.service'
import ngMaterial from 'angular-material'

// Define the `eventList` module
export default angular.module('eventList', ['ngMaterial', eventService.name]);
