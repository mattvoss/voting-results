Voting.module('Vote', function(Vote, App, Backbone, Marionette, $, _) {

  // Vote Router
  // ---------------
  //
  // Handle routes to show the active vs complete todo items

  Vote.Router = Marionette.AppRouter.extend({
    appRoutes: {
      'vote/:electionId'      : 'init',
      'review'                : 'showReview',
      'finish'                : 'showFinish'
    }
  });




  // Vote Controller (Mediator)
  // ------------------------------
  //
  // Control the workflow and logic that exists at the application
  // level, above the implementation detail of views and models

  Vote.Controller = function() {};

  _.extend(Vote.Controller.prototype, {

    init: function(id) {
      if (typeof App.voter == 'undefined') {
        Backbone.history.navigate("start", { trigger: true });
      } else if (typeof id == 'undefined') {
        Backbone.history.navigate("voter-type", { trigger: true });
      } else {
        var options = {login: false};
        this.appBody = new App.Layout.Body(options);
        App.body.show(this.appBody);
        this.showHeader();
        this.showVote(id);
      }
    },

    showVote: function(id) {
      var model = Voting.offices.findWhere({"id": parseInt(id, 10)}),
          noneAbove = model.get("candidates").findWhere({"id": 0});
      if (typeof noneAbove == "undefined") {
        model.get("candidates").add([{
          "id": 0,
          "electionid": model.get("id"),
          "position": model.get("candidates").length + 1,
          "name": "None of the Above"
        }]);
      }
      var voteView = new Vote.Views.VoteView({model: model, collection: model.get("candidates")});
      $("#main").addClass("dashboard");
      this.appBody.main.show(voteView);
      $("body").removeClass();
    },

    showReview: function() {
      var reviewView = new Vote.Views.ReviewView({model: App.voter, collection: App.voter.get("votes")});
      this.appBody.main.show(reviewView);
      //this.appBody.login.$el.show();
      //$("#dash-container").show();
    },

    showFinish: function() {
      var finishView = new Vote.Views.FinishView({model: App.voter, collection: App.voter.get("votes")});
      this.appBody.main.show(finishView);
      //this.appBody.login.$el.show();
      //$("#dash-container").show();
    },

    showHeader: function() {
      var header = new App.Layout.Header({model: App.voter});
      this.appBody.header.show(header);
    }

  });

  // Vote Initializer
  // --------------------
  //
  // Get the Vote up and running by initializing the mediator
  // when the the application is started.

  Vote.addInitializer(function() {

    var controller = new Vote.Controller();
    new Vote.Router({
      controller: controller
    });

    controller.init();

  });

});
