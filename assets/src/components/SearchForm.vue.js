export default {
	data () {
		return {
			query: {dpt:"all"}
		}
	},
  methods: {
    deleteQuery: function () {
      this.$parent.searchResult = []
    }
  },
	template: '<form id="search" v-on:submit.prevent="$emit(\'search-submit\', query)">' +
          '<div class="row">' +
            '<div class="col-md-6 my-2">' +
              '<div class="d-block">Debut</div>' +
              '<div class="d-block">' +
                '<input v-model="query.startDate" class="form-control" type="date" required>' +
              '</div>' +
            '</div>' +
            '<div class="col-md-6 my-2">' +
              '<div class="d-block">Fin</div>' +
              '<div class="d-block">' +
                '<input v-model="query.endDate" class="form-control" type="date" required>' +
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
              '<a href="#" v-on:click="deleteQuery" class="btn btn-outline-danger shadow my-auto">X Réinitialiser</a>' +
              '<button type="submit" class="btn btn-primary float-right shadow my-auto" id="search_button">Rechercher →</button>' +
            '</div>' +
          '</div>' +
        '</form>'
}