<template>
  <article class="col-12 p-0 my-3">
    <div class="row">
      <div class="col-sm-3 mt-2">
        <div class="row">
          <div class=" col-sm-6 col-md-12">
            <i class="far fa-calendar mr-2" aria-hidden="true"></i>
            <time itemprop="startDate" :datetime="isoStringDate">
              {{ event.date | toDate }}
            </time>
          </div>
          <div class=" col-sm-6 col-md-12">
            <i class="fa fa-map-marker-alt mr-2" aria-hidden="true"></i>
            {{ event.departement }}  - {{ event.city }}
          </div>
        </div>
      </div>
      <div class="col-sm-9 rounded border border-muted shadow">
        <h3 class="mt-2 text-uppercase">
          <button
            class="btn d-flex text-bold"
            @click="toogleActive()"
          >
            <span
              class="my-auto mr-3"
              v-show="active"
            >
              <i
                class="fas fa-chevron-circle-down"
                :aria-hidden="active"
              ></i>
            </span>
            <span
              class="my-auto mr-3"
              v-show="!active"
            >
              <i
                class="fas fa-chevron-circle-right"
                :aria-hidden="active"
              ></i>
            </span>
            {{ event.name }}
            <span v-if="event.canceled" class="badge badge-danger ml-2 my-auto">Annulée</span>
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
                class="badge badge-pill badge-secondary ml-sm-0 ml-md-3"
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
import { getMonth, dateFormat } from '../utils/date';

export default {
  props: ['event'],
  data() {
    return {
      active: false,
    };
  },
  methods: {
    toogleActive() {
      this.active = !this.active;
    },
  },
  computed: {
    isoStringDate() {
      if (this.event.date) {
        return dateFormat(this.event.date).toISOString();
      }
      return '';
    },
  },
  filters: {
    toDate: (val) => {
      if (val) {
        const day = val.split('/')[0];
        const month = getMonth(Number(val.split('/')[1]));
        const year = val.split('/')[2];
        return `${day} ${month} ${year}`;
      }
      return '';
    },
  },
};
</script>
