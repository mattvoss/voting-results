var Voting = new Backbone.Marionette.Application({
  initialize: function() {
    _.bindAll(this, "ioEvent");
  },

  ioEvent: function(data) {
    console.log(data);
    if (data.type == "results") {

      data.results.forEach(function(office) {
        var race = Voting.offices.get(office.id);
        race.set(office);
      });

      //Voting.offices.set(data.results);

    }
  }
});

var ModalRegion = Backbone.Marionette.Region.extend({
  el: "#modal",

  constructor: function(){
    _.bindAll( this, "getEl", "showModal", "hideModal" );
    Backbone.Marionette.Region.prototype.constructor.apply(this, arguments);
    this.listenTo(this, "show", this.showModal, this);
  },

  getEl: function(selector){
    var $el = $(selector);
    $el.attr("class","modal fade");
    $el.on("hidden", this.close);
    return $el;
  },

  showModal: function(view){
    this.listenTo(view, "close", this.hideModal, this);
    this.$el.modal('show');
  },

  hideModal: function(){
    this.$el.modal('hide');
  }
});

Voting.timeout = 30000;
Voting.startPage = false;

Voting.addRegions({
  body: '#body'
});

Voting.on('initialize:before', function() {
  this.collections = {};
  this.io = io.connect();
  // Listen for the talk event.
  this.io.on('talk', this.ioEvent);
});

Voting.on('initialize:after', function() {
  this.currentView = null;
  this.review = false;
  this.io.emit('ready', {'user': this.uid});
  Backbone.history.start({root: "/", pushState: true});
  if (typeof this.voter !== 'undefined' && "id" in this.voter) {
    Backbone.history.navigate("siteid", { trigger: true });
  } else {
    Backbone.history.navigate("start", { trigger: true });
  }
});

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};
