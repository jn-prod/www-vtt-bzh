<template>
  <article class="my-2">
    <header class="d-flex">
      <button class="btn btn-light ms-auto" aria-controls="search" @click="handleToggleButton">
        <span v-if="open" class="my-auto me-2">
          <i class="fas fa-chevron-up" aria-hidden="true"></i>
        </span>
        <span v-if="!open" class="my-auto me-2">
          <i class="fas fa-chevron-down" aria-hidden="true"></i>
        </span>
        Filtrer
      </button>
    </header>
    <form id="search" :hidden="!open" :aria-expanded="open" @submit.prevent="submitSearch()">
      <div class="my-2">
        <input-date
          :id="'start-date'"
          :name="'start-date'"
          :value="dateRange.start"
          label="Debut"
          @input-date="updateStartDate"
        >
        </input-date>
      </div>
      <div class="my-2">
        <input-date :id="'end-date'" :name="'end-date'" :value="dateRange.end" label="Fin" @input-date="updateEndDate">
        </input-date>
      </div>
      <div class="my-2">
        <label for="departement"> Département </label>
        <select id="departement" v-model="dpt" name="departement" class="form-control">
          <option v-for="option in options" :key="option.value" :value="option.value">
            {{ option.text }}
          </option>
        </select>
      </div>
      <div class="my-2">
        <div class="mx-auto">
          <button id="search_button" type="submit" class="btn btn-secondary shadow m-2 rounded-pill">
            <i class="fas fa-search"></i> Rechercher
          </button>
          <button href="#calendar" class="btn btn-outline-dark rounded-pill shadow m-2" @click="deleteSearch">
            <i class="far fa-trash-alt"></i> Réinitialiser
          </button>
        </div>
      </div>
    </form>
  </article>
</template>

<script lang="js">
import { ref } from 'vue';
import { cloneDeep } from 'lodash';
import InputDate from './InputDate.vue';
import departementslist from '../constants/departementslist';

const dateNow = new Date();
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
    const open = ref(false);

    const handleToggleButton = () => {
      open.value = !open.value;
    };

    const submitSearch = () =>
      emit('submit-search-form', {
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
      open,
      submitSearch,
      deleteSearch,
      updateStartDate,
      updateEndDate,
      handleToggleButton,
    };
  },
};
</script>
