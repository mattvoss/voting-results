Voting.module('Public.Views', function(Views, App, Backbone, Marionette, $, _) {

  // Public View
  // --------------

  Views.AlertView = Marionette.ItemView.extend({
    template: Templates.alert,
    className: "alert alert-danger fade in",
  });

  Views.RaceView = Marionette.ItemView.extend({
    template: Templates.race,
    className: "col-md-12",
  });

  Views.PublicView = Marionette.CompositeView.extend({
      template: Templates.public,
      itemView : Views.RaceView,
      itemViewContainer: ".races",
      className: "row",
      events: {
        'keypress #registrantid'  :   'onInputKeypress',
        'click .next'             :   'logIn',
        'click .start-over'       :   'startOver',
      },

      collectionEvents: {
        "change": "render"
      },

      initialize: function() {
        this.keyboardOpen = false;
      },

      onShow: function() {
        var view = this;
      },

      onInputKeypress: function(evt) {
        var ENTER_KEY = 13;

        if (evt.which === ENTER_KEY && this.ui.registrantid.val().length > 0) {
          evt.preventDefault();
          this.logIn(evt);
        }
      },

      showAlert: function(model) {
        var alert = new App.Public.Views.AlertView({model: model});
        $("#registrantid", this.$el).removeClass("alert-danger");
        $(".alert", this.$el).remove();
        alert.render();
        $("#"+model.get("error"), this.$el).addClass("alert-danger");
        $(alert.$el).insertBefore(".login-title", this.$el);
      }

  });

  // Application Event Handlers
  // --------------------------

});
