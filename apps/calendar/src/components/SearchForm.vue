<template>
  <form id="search" @submit.prevent="submitSearch()">
    <div class="row">
      <div class="col-12 my-2">
        <label for="start-date">
          Debut
        </label>
        <input-date
          :name="'start-date'"
          :id="'start-date'"
          :value="dateRange.start"
          @input-date="updateStartDate"
        >
        </input-date>
      </div>
      <div class="col-12 my-2">
        <label for="end-date">
          Fin
        </label>
        <input-date
          :name="'end-date'"
          :id="'end-date'"
          :value="dateRange.end"
          @input-date="updateEndDate"
        >
        </input-date>
      </div>
    </div>
    <div class="row">
      <div class="col-12 my-2">
        <label for="departement">
          Département
        </label>
        <select v-model="dpt" name="departement" id="departement" class="form-control">
          <option v-for="option in options" v-bind:value="option.value" :key="option.value">
            {{ option.text }}
          </option>
        </select>
      </div>
    </div>
    <div class="row">
      <div class="col-12 my-2">
        <div class="mx-auto">
          <button
            type="submit"
            class="btn btn-secondary shadow m-2 rounded-pill"
            id="search_button">
            <i class="fas fa-search"></i> Rechercher
          </button>
          <button
            href="#calendar"
            v-on:click="deleteSearch"
            class="btn btn-outline-dark rounded-pill shadow m-2">
            <i class="far fa-trash-alt"></i> Réinitialiser
          </button>
        </div>
      </div>
    </div>
  </form>
</template>

<script lang="js">
import { ref } from 'vue';
import { cloneDeep } from 'lodash';
import InputDate from './InputDate.vue';
import departementslist from '../constants/departementslist';

const dateNow = new Date(Date.now());
const defaultQuery = {
  startDate: dateNow,
  endDate: new Date(dateNow.getFullYear() + 1, dateNow.getMonth(), dateNow.getDate()),
  dpt: 'all',
};

export default {
  name: 'SearchForm',
  components: {
    InputDate,
  },
  emits: ['submit-search-form', 'cancel-search-form'],
  setup(props, ctx) {
    const { emit } = ctx;

    const dateRange = ref({
      start: cloneDeep(defaultQuery.startDate),
      end: cloneDeep(defaultQuery.endDate),
    });

    const options = departementslist;

    const dpt = ref(defaultQuery.dpt);

    const submitSearch = () => emit('submit-search-form', {
      dpt: dpt.value,
      startDate: dateRange.value.start,
      endDate: dateRange.value.end,
    });

    const deleteSearch = () => {
      dateRange.value.start = cloneDeep(defaultQuery.startDate);
      dateRange.value.end = cloneDeep(defaultQuery.endDate);
      dpt.value = cloneDeep(defaultQuery.dpt);
      emit('cancel-search-form', { cancel: true });
    };

    const updateStartDate = (val) => {
      dateRange.value.start = val;
    };

    const updateEndDate = (val) => {
      dateRange.value.end = val;
    };

    return {
      dateRange,
      options,
      dpt,
      submitSearch,
      deleteSearch,
      updateStartDate,
      updateEndDate,
    };
  },
};
</script>
