export default {
	data () {
		return {
			query: {dpt:"all"}
		}
	},
  methods: {
    deleteQuery: function () {
      this.query = {
        query: {dpt:"all"}
      }
      this.$parent.searchResult = []
      this.$parent.displayNoResults = false
    }
  },
	template: '<form id="search" v-on:submit.prevent="$emit(\'search-submit\', query)">' +
          '<div class="row">' +
            '<div class="col-md-6 my-2">' +
              '<div class="d-block">Debut</div>' +
              '<div class="d-block">' +
                '<datepicker :bootstrap-styling="true" :typeable="true" :required="true" v-model="query.startDate"></datepicker>' +
              '</div>' +
            '</div>' +
            '<div class="col-md-6 my-2">' +
              '<div class="d-block">Fin</div>' +
              '<div class="d-block">' +
                '<datepicker :bootstrap-styling="true" :typeable="true" :required="true" v-model="query.endDate"></datepicker>' +
              '</div>' +
            '</div>' +
          '</div>'+
          '<div class="row">'+
            '<div class="col-12 my-2">Département</div>'+
          '</div>'+
          '<div class="row">'+
            '<div class="col-12 my-2">'+
              '<select v-model="query.dpt" name="departement" id="" class="form-control">'+
                '<option v-bind:value="query.dpt" selected>Tous les départements</option>'+
                '<option value="22">Côtes d\'Armor</option>'+
                '<option value="29">Finistère</option>'  +
                '<option value="35">Ille et Vilaine</option>'+
                '<option value="44">Loire Atlantique</option>' + 
                '<option value="56">Morbihan</option>' +       
              '</select>' +
            '</div>' +
          '</div>' +
          '<div class="row">' +
            '<div class="col-12 my-2">' +
              '<a href="#calendar" v-on:click="deleteQuery" class="btn btn-sm btn-outline-danger shadow m-2">X Réinitialiser</a>' +
              '<button type="submit" class="btn btn-primary float-none float-xl-right shadow m-2 rounded-pill" id="search_button">Rechercher →</button>' +
            '</div>' +
          '</div>' +
        '</form>'
}
