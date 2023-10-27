<template>
  <article class="rounded border border-muted shadow">
    <header class="p-2 d-md-flex">
      <h3 class="text-uppercase m-0">
        <button class="btn btn-light text-bold text-left" @click="toogleActive()">
          <span v-if="active" class="my-auto me-2">
            <i class="fas fa-chevron-up" aria-hidden="true"></i>
          </span>
          <span v-if="!active" class="my-auto me-2">
            <i class="fas fa-chevron-down" aria-hidden="true"></i>
          </span>
          {{ event.name }}
          <span v-if="event.canceled" class="badge bg-danger ms-2 my-auto">Annulée</span>
        </button>
      </h3>
      <div class="my-auto d-md-flex">
        <div class="ms-3 ms-md-3">
          <i class="far fa-calendar" aria-hidden="true"></i>
          <time class="ms-2" itemprop="startDate" :datetime="isoStringDate">
            {{ date }}
          </time>
        </div>
        <div class="ms-3 ms-md-3">
          <i class="fa fa-map-marker-alt" aria-hidden="true"></i>
          <span class="ms-2"> {{ event.departement }} - {{ event.city }} </span>
        </div>
      </div>
    </header>
    <div v-show="active" class="p-3 text-left">
      <p v-if="event.description" class="m-2">Description : {{ event.description }}</p>
      <ul class="list-none">
        <li class="d-inline-block m-2">Organisateur : {{ event.organisateur || 'NC' }}</li>
        <li class="d-inline-block m-2">Horaires : {{ event.hour || 'NC' }}</li>
        <li class="d-inline-block m-2">Lieu de rendez-vous : {{ event.place || 'NC' }}</li>
        <li class="d-inline-block m-2">Contact : {{ event.contact || 'NC' }}</li>
        <li class="d-inline-block m-2">Prix Club : {{ event.price || 'NC' }}</li>
      </ul>
      <span v-if="event.departement" class="badge rounded-pill bg-secondary m-2">
        Département : {{ event.departement }}
      </span>
    </div>
  </article>
</template>

<script lang="ts">
import { computed, ref, defineComponent } from 'vue';
import type { PropType } from 'vue';
import { dateFormatToText, getStringDate } from 'utils/src/date';
import type { CalendarEvent } from 'calendar-shared/src/types';

export default defineComponent({
  name: 'EventCard',
  props: {
    event: {
      type: Object as PropType<CalendarEvent>,
      required: true,
    },
  },
  setup(props) {
    const active = ref(false);

    const toogleActive = () => {
      active.value = !active.value;
    };

    const isoStringDate = computed(() => getStringDate(props?.event?.date));

    const date = computed(() => dateFormatToText(getStringDate(props?.event?.date)));

    return {
      active,
      toogleActive,
      isoStringDate,
      date,
    };
  },
});
</script>

<style scoped>
.text-left {
  text-align: left;
}
</style>
