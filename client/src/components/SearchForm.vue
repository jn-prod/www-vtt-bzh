<template>
  <form id="search" @submit.prevent="submitSearch()">
    <div class="row">
      <div class="col-md-6 my-2">
        <label for="start-date">
          Debut
        </label>
        <datepicker
          :bootstrap-styling="true"
          :typeable="true"
          :required="true"
          name="start-date"
          id="start-date"
          v-model="query.startDate">
        </datepicker>
      </div>
      <div class="col-md-6 my-2">
        <label for="end-date">
          Fin
        </label>
        <datepicker
            :bootstrap-styling="true"
            :typeable="true"
            :required="true"
            name="end-date"
            id="end-date"
            v-model="query.endDate">
        </datepicker>
      </div>
    </div>
    <div class="row">
      <div class="col-12 my-2">
        <label for="departement">
          Département
        </label>
        <select v-model="query.dpt" name="departement" id="departement" class="form-control">
          <option v-bind:value="query.dpt" selected>Tous les départements</option>
          <option value="22">Côtes d'Armor</option>
          <option value="29">Finistère</option>
          <option value="35">Ille et Vilaine</option>
          <option value="44">Loire Atlantique</option>
          <option value="56">Morbihan</option>
        </select>
      </div>
    </div>
    <div class="row">
      <div class="col-12 my-2">
        <button
          href="#calendar"
          v-on:click="deleteSearch"
          class="btn btn-dark rounded-pill shadow m-2">
          <i class="far fa-trash-alt"></i> Réinitialiser
        </button>
        <button
          type="submit"
          class="btn btn-secondary shadow m-2 rounded-pill"
          id="search_button">
          <i class="fas fa-search"></i> Rechercher
        </button>
      </div>
    </div>
  </form>
</template>

<script>
import Datepicker from 'vuejs-datepicker';

const dateNow = new Date(Date.now());
const defaultQuery = {
  startDate: dateNow,
  endDate: new Date(dateNow.getFullYear() + 1, dateNow.getMonth(), dateNow.getDate()),
  dpt: 'all',
};

export default {
  components: {
    Datepicker,
  },
  data() {
    return { query: { ...defaultQuery } };
  },
  methods: {
    submitSearch() {
      this.$emit('submit-search-form', this.query);
    },
    deleteSearch() {
      this.query = { ...defaultQuery };
      this.$emit('cancel-search-form', { cancel: true });
    },
  },
};
</script>
