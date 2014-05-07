Voting.module('SiteId', function(SiteId, App, Backbone, Marionette, $, _) {

  // SiteId Router
  // ---------------
  //
  // Handle routes to show the active vs complete todo items

  SiteId.Router = Marionette.AppRouter.extend({
    appRoutes: {
      'siteid'      : 'init',
      'voter-type'  : 'voterType',
      'voter-type-prev'  : 'voterTypePrev'
    }
  });




  // SiteId Controller (Mediator)
  // ------------------------------
  //
  // Control the workflow and logic that exists at the application
  // level, above the implementation detail of views and models

  SiteId.Controller = function() {};

  _.extend(SiteId.Controller.prototype, {

    init: function() {
      App.startPage = false;
      if (typeof App.voter == 'undefined') {
        Backbone.history.navigate("start", { trigger: true });
      } else {
        var options = {login: true};
        this.appBody = new App.Layout.Body(options);
        App.body.show(this.appBody);
        this.showSiteId();
      }
    },

    showSiteId: function() {
      var siteIdView = new SiteId.Views.SiteIdView({model: App.voter});
      this.appBody.login.show(siteIdView);
      this.appBody.login.$el.show();
      //$("#dash-container").show();
    },

    voterType: function() {
      var management = _.where(App.voter.get("site").get("voters").toJSON(), {voterType: "management"}),
          nonmanagement = _.where(App.voter.get("site").get("voters").toJSON(), {voterType: "non-management"});

      App.voter.set({
        management: management,
        nonmanagement: nonmanagement
      });

      var voterTypeView = new SiteId.Views.VoterTypeView({model: App.voter, collection: App.voter.get("site").get("voters")});
      this.appBody.login.show(voterTypeView);
      //this.appBody.login.$el.show();
      //$("#dash-container").show();
    },

    voterTypePrev: function() {
      var options = {login: true};
      this.appBody = new App.Layout.Body(options);
      App.body.show(this.appBody);
      this.voterType();
    }

  });

  // SiteId Initializer
  // --------------------
  //
  // Get the SiteId up and running by initializing the mediator
  // when the the application is started.

  SiteId.addInitializer(function() {

    var controller = new SiteId.Controller();
    new SiteId.Router({
      controller: controller
    });

    controller.init();

  });

});
