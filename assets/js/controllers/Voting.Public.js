Voting.module('Public', function(Public, App, Backbone, Marionette, $, _) {

  // Public Router
  // ---------------
  //
  // Handle routes to show the active vs complete todo items

  Public.Router = Marionette.AppRouter.extend({
    appRoutes: {
      'start': 'start'
    }
  });

  // Public Controller (Mediator)
  // ------------------------------
  //
  // Control the workflow and logic that exists at the application
  // level, above the implementation detail of views and models

  Public.Controller = function() {};

  _.extend(Public.Controller.prototype, {

    // Start the app by showing the appropriate views
    // and fetching the list of todo items, if there are any
    start: function() {
      var options = {login: false};
      this.appBody = new App.Layout.Body(options);
      App.body.show(this.appBody);
      this.showHeader();
      this.showPublic();
    },

   showHeader: function() {
      var header = new App.Layout.Header();
      this.appBody.header.show(header);
    },

    showPublic: function() {
      var view = new Public.Views.PublicView({collection: App.offices});
      this.appBody.main.show(view);
    }
  });

  // Public Initializer
  // --------------------
  //
  // Get the Public up and running by initializing the mediator
  // when the the application is started.

  Public.addInitializer(function() {

    var controller = new Public.Controller();
    new Public.Router({
      controller: controller
    });

  });

});
