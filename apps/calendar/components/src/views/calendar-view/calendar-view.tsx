import { Component, State, Watch, h } from '@stencil/core';
import eventService from '../../services/events';
import { cloneDeep } from '../../utils/utils';

const getDate = date => date.toISOString().split('T')[0];

@Component({
  tag: 'calendar-view',
  styleUrl: 'calendar-view.css',
  shadow: true,
})
export class CalendarViews {
  @State() data = [];
  @Watch('data')
  validateData(newValue: []) {
    this.count = newValue.length;
    this.isResults = newValue.length < 1;
    this.events = newValue.slice(0, this.paginator);
    this.isLoadMoreActive = newValue.length > (this.paginator || 0);
  }
  @State() paginator = 20;
  @State() searchFormQuery = null;
  @State() projection = 'date.place.name.contact.price.canceled.departement.hour.organisateur.city.description';
  @State() filter = { fromDate: `${getDate(new Date())}` };
  @State() sort = { date: 1 };
  @State() baseQuery = { projection: this.projection, filter: this.filter, sort: this.sort };
  @State() isLoadMoreActive = false;
  @State() events = [];
  @State() isResults = false;
  @State() count = 0;

  private getEvents = async () => {
    this.data = await eventService.getEvents(this.baseQuery);
  };

  private setPaginator = (event: MouseEvent) => {
    event.preventDefault();
    this.paginator += 20;
  };

  private setSearchQuery = async (event: CustomEvent) => {
    const { dpt, endDate, startDate } = event.detail;
    this.searchFormQuery = {
      dpt,
      endDate,
      startDate,
    };

    if (!dpt && !endDate && !startDate) return;

    const searchQuery = cloneDeep(this.baseQuery);

    searchQuery.filter.fromDate = getDate(startDate);
    searchQuery.filter.toDate = getDate(endDate);
    searchQuery.filter.departement = dpt === 'all' ? undefined : dpt;

    this.data = await eventService.getEvents(searchQuery);
  };

  private cancelSearchQuery = async (event: CustomEvent) => {
    const { cancel } = event.detail;
    if (!cancel) return;

    this.searchFormQuery = null;
    this.data = await eventService.getEvents(this.baseQuery);
  };

  componentWillLoad(): void {
    this.getEvents();
  }

  render() {
    return (
      <section>
        <header>
          <h1>Rechercher une rando VTT à coté de chez toi n'aura jamais été aussi simple.</h1>
          <search-form onSearch-form-launched={this.setSearchQuery} onSearch-form-canceled={this.cancelSearchQuery}></search-form>
        </header>

        <article>
          <h2>
            Calendrier des randonnées à venir
            <span>{this.count}</span>
          </h2>
          {this.isResults && <p>Aucun résultat pour cette recherche, choisissez une autre date de début et de fin.</p>}

          {this.events.map(event => (
            <event-card key={event.id} event={event}></event-card>
          ))}

          {this.isLoadMoreActive && (
            <div>
              <button onClick={this.setPaginator}>Voir +</button>
            </div>
          )}
        </article>
      </section>
    );
  }
}
