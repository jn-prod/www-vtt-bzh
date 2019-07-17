export default {
	data () {
		return {
			query: {}
		}
	},
	methods: {
		initSearch: function () {
			var query = {
				startDate: this.query.startDate,
				endDate: this.query.endDate,
				dpt: this.query.dpt
			}
			console.log('initSearch:' + query)
		}
	},
	template: '<form id="search" v-on:submit.prevent="initSearch">' +
          '<div class="row">' +
            '<div class="col-md-6 my-2">' +
              '<div class="d-block">Debut</div>' +
              '<div class="d-block">' +
                '<input v-model="query.startDate" class="form-control" type="date">' +
              '</div>' +
            '</div>' +
            '<div class="col-md-6 my-2">' +
              '<div class="d-block">Fin</div>' +
              '<div class="d-block">' +
                '<input v-model="query.endDate" class="form-control" type="date">' +
              '</div>' +
            '</div>' +
          '</div>'+
          '<div class="row">'+
            '<div class="col-12 my-2">Département</div>'+
          '</div>'+
          '<div class="row">'+
            '<div class="col-12 my-2">'+
              '<select v-model="query.dpt" name="departement" id="" class="form-control">'+
                '<option selected>département</option>'+
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
              '<button id="clean_search" class="btn btn-outline-dark">Réinitialiser</button>' +
              '<button type="submit" class="btn btn-primary float-right" id="search_button">Rechercher</button>' +
            '</div>' +
          '</div>' +
        '</form>'
}