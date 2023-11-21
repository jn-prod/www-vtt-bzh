import { Component, Event, EventEmitter, State, h } from '@stencil/core';
import { cloneDeep } from '../../utils/utils';
import departementslist from '../../constants/departementslist';

const dateNow = new Date(Date.now());
const defaultQuery = {
  startDate: dateNow,
  endDate: new Date(dateNow.getFullYear() + 1, dateNow.getMonth(), dateNow.getDate()),
  dpt: 'all',
};

@Component({
  tag: 'search-form',
  styleUrl: 'search-form.css',
  shadow: true,
})
export class SearchForm {
  @State() dateRange = {
    start: cloneDeep(defaultQuery.startDate),
    end: cloneDeep(defaultQuery.endDate),
  };

  @State() options: { text: string; value: string }[] = departementslist;

  @State() dpt = defaultQuery.dpt;

  @Event({ eventName: 'search-form-launched' }) searchFormLaunched: EventEmitter<{
    dpt: string;
    startDate: string;
    endDate: string;
  }>;
  @Event({ eventName: 'search-form-canceled' }) searchFormCanceled: EventEmitter<{ cancel: boolean }>;

  private submitSearch = (event: SubmitEvent) => {
    event.preventDefault();
    event.stopPropagation();
    this.searchFormLaunched.emit({
      dpt: this.dpt,
      startDate: this.dateRange.start,
      endDate: this.dateRange.end,
    });
  };
  private deleteSearch = () => {
    this.dateRange.start = cloneDeep(defaultQuery.startDate);
    this.dateRange.end = cloneDeep(defaultQuery.endDate);
    this.dpt = cloneDeep(defaultQuery.dpt);
    this.searchFormCanceled.emit({ cancel: true });
  };

  private updateStartDate = (event: CustomEvent) => {
    this.dateRange.start = event.detail;
  };

  private updateEndDate = (event: CustomEvent) => {
    this.dateRange.end = event.detail;
  };

  private handleDepartement = (event: InputEvent & { target: HTMLSelectElement }) => {
    this.dpt = event.target.value;
  };

  render() {
    return (
      <form id="search" onSubmit={this.submitSearch}>
        <div class="my-2">
          <input-date id={'start-date'} name={'start-date'} value={this.dateRange.start} label="Debut" onInput-date={this.updateStartDate}></input-date>
        </div>
        <div class="my-2">
          <input-date id={'end-date'} name={'end-date'} value={this.dateRange.end} label="Fin" onInput-date={this.updateEndDate}></input-date>
        </div>
        <label htmlFor="departement">Département</label>
        <select id="departement" name="departement" onInput={this.handleDepartement}>
          {this.options.map(option => (
            <option key={option.value} value={option.value}>
              {option.text}
            </option>
          ))}
        </select>
        <div>
          <button type="submit">
            <i class="fas fa-search"></i> Rechercher
          </button>
          <button onClick={this.deleteSearch}>
            <span class="far fa-trash-alt"></span> Réinitialiser
          </button>
        </div>
      </form>
    );
  }
}
