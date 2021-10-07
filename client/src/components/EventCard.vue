<template>
  <article class="col-12 p-0 my-3">
    <div class="row">
      <div class="col-sm-3 mt-2">
        <div class="row">
          <div class=" col-sm-6 col-md-12">
            <i class="far fa-calendar" aria-hidden="true"></i>
            <span class="ms-2">
              <time itemprop="startDate" :datetime="isoStringDate">
                {{ date }}
              </time>
            </span>
          </div>
          <div class=" col-sm-6 col-md-12">
            <i class="fa fa-map-marker-alt" aria-hidden="true"></i>
            <span class="ms-2">
              {{ event.departement }}  - {{ event.city }}
            </span>
          </div>
        </div>
      </div>
      <div class="col-sm-9 rounded border border-muted shadow">
        <h3 class="mt-2 text-uppercase">
          <button
            class="btn text-bold"
            @click="toogleActive()"
          >
            <span
              class="my-auto me-3"
              v-show="active"
            >
              <i
                class="fas fa-chevron-circle-down"
                :aria-hidden="active"
              ></i>
            </span>
            <span
              class="my-auto me-3"
              v-show="!active"
            >
              <i
                class="fas fa-chevron-circle-right"
                :aria-hidden="active"
              ></i>
            </span>
            {{ event.name }}
            <span v-if="event.canceled" class="badge bg-danger ms-2 my-auto">Annulée</span>
          </button>
        </h3>
        <div class="row my-2" v-show="active">
          <div class="col-12 text-left">
            <div class="">
              <div v-if="event.description" class="text-left p-2 m-2">
                Description : {{event.description}}
              </div>
              <ul class="list-none">
                <li class="d-inline-block m-2 p-2">
                  Organisateur : {{event.organisateur || "NC"}}</li>
                <li class="d-inline-block m-2 p-2">
                  Horaires : {{event.hour || "NC"}}
                </li>
                <li class="d-inline-block m-2 p-2">
                  Lieu de rendez-vous : {{event.place || "NC"}}
                </li>
                <li class="d-inline-block m-2 p-2">
                  Contact : {{event.contact || "NC"}}
                </li>
                <li class="d-inline-block m-2 p-2">
                  Prix Club : {{event.price || "NC"}}
                </li>
              </ul>
            </div>
            <div>
              <span
                v-if="event.departement"
                class="badge rounded-pill bg-secondary ml-sm-0 ml-md-3"
              >
                Département : {{event.departement}}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>
<script>
import { computed, ref } from 'vue';
import { get as lGet } from 'lodash';
import { dateFormatToIsoString, dateFormatToText } from '@/utils/date';

export default {
  name: 'EventCard',
  props: ['event'],
  setup(props) {
    const active = ref(false);

    const toogleActive = () => {
      active.value = !active.value;
    };

    const isoStringDate = computed(() => dateFormatToIsoString(lGet(props, 'event.date')));

    const date = computed(() => dateFormatToText(lGet(props, 'event.date')));

    return {
      active,
      toogleActive,
      isoStringDate,
      date,
    };
  },
};
</script>
