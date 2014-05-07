Voting.module('Models', function(Models, App, Backbone, Marionette, $, _) {

  Models.Candidate = Backbone.SuperModel.extend({
    //urlRoot: '/api/registrant',
    idAttribute: "id",
    url: function() {
      return this.collection.office.url()+'/candidate';
    }
  });

  Models.Candidates = Backbone.Collection.extend({
    model: Models.Candidate,
    idAttribute: "id"
  });

  Models.Office = Backbone.SuperModel.extend({
    idAttribute: "id",
    name: 'office',
    relations: {
      'candidates': Models.Candidates
    },
    urlRoot: "/api/office/"
  });

  Models.Offices = Backbone.Collection.extend({
    model: Models.Office,
    idAttribute: "id",
    url: "/api/offices"
  });

  Models.Vote = Backbone.SuperModel.extend({
    //urlRoot: '/api/registrant',
    idAttribute: "id",
    url: function() {
      return this.collection.voter.url()+'/vote';
    }
  });

  Models.Votes = Backbone.Collection.extend({
    urlRoot: "/api/castVotes",
    model: Models.Vote,
    idAttribute: "id",
    save: function (options) {
      Backbone.sync("create", this, options);
    }
  });

  Models.Voter = Backbone.SuperModel.extend({
    urlRoot: '/api/voter',
    idAttribute: "registrantId",
    name: 'voter',
    relations: {
      'votes': Models.Votes
    },
    validate: function(attrs, options) {
      if (attrs.registrantid === "") {
        return {
          "error": "registrant",
          "message": "A registrant id must be entered"
        };
      }
    },
    initialize: function() {
      //if (this.isNew()) this.set('created', Date.now());
    }
  });

});
