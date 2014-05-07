Voting.module('Vote.Views', function(Views, App, Backbone, Marionette, $, _) {

  // Vote View
  // --------------

  Views.CandidateView = Marionette.ItemView.extend({
      template: Templates.candidate,
      events: {
        'ifChecked input'         :   'checked'
      },

      modelEvents: {
        'change': 'fieldsChanged'
      },

      initialize: function() {
        //if (this.model.get("id")) this.model.set({uuid: this.model.get("id")});
        //this.justUpdated = false;
      },

      fieldsChanged: function() {
        //this.justUpdated = true;
        //this.render();
      },

      onShow: function(e) {
        $('input', this.$el).each(function(){
          var self = $(this),
            label = self.next(),
            label_text = label.text();

          label.remove();
          self.iCheck({
            checkboxClass: 'icheckbox_line-aero',
            radioClass: 'iradio_line-aero',
            insert: '<div class="icheck_line-icon"></div>' + label_text
          });
        });
      },

      checked: function(e) {

      }

  });

  Views.VoteView = Marionette.CompositeView.extend({
      template: Templates.office,
      itemView : Views.CandidateView,
      itemViewContainer: ".candidates",
      className: "col-md-12",

      events: {
        'click .next'             :   'next',
        'click .prev'             :   'prev',
        'ifChecked input'         :   'checked'
      },
      initialize: function() {
        this.vote = App.voter.get("votes").findWhere({"electionid": this.model.get("id")});
        if (typeof this.vote == "undefined") {
          this.candidateId = 0;
        } else {
          this.candidateId = this.vote.get("candidateid");
        }

      },

      onRender: function() {

      },

      onShow: function(e) {
        if (typeof this.vote !== "undefined") {
          $('#candidate'+this.vote.get("candidateid"), this.$el).iCheck('check');
          $(".next", this.$el).attr("disabled", false);
        }
      },

      checked: function(e) {
        this.candidateId = parseInt($(e.currentTarget).val(), 10);
        $(".next", this.$el).attr("disabled", false);
      },

      next: function(e) {
        var view = this,
            candidate = this.model.get("candidates").findWhere({"id": this.candidateId});

        if (typeof this.vote == "undefined") {
          App.voter.get("votes").add([{
            "siteid": App.voter.get("siteId"),
            "registrantid": App.voter.get("registrantId"),
            "electionid": this.model.get("id"),
            "candidateid": this.candidateId,
            "votertype": App.voter.get("voterType"),
            "electionTitle": this.model.get("title"),
            "candidateName": candidate.get("name"),
            "candidateCompany": candidate.get("company")
          }]);
        } else {
          this.vote.set({
            "candidateid": this.candidateId,
            "candidateName": candidate.get("name")
          });
        }

        if ((App.voter.get("votes").length == App.offices.length) || App.review) {
          App.review = false;
          Backbone.history.navigate("review", { trigger: true });
        } else {
          var index = App.offices.indexOf(this.model),
              nextOffice = App.offices.at(index+1);
          Backbone.history.navigate("vote/"+nextOffice.get("id"), { trigger: true });
        }
      },

      prev: function(e) {
        var index = App.offices.indexOf(this.model);
        App.review = false;
        if (index === 0) {
          Backbone.history.navigate("voter-type-prev", { trigger: true });
        } else {
          var prevOffice = App.offices.at(index-1);
          Backbone.history.navigate("vote/"+prevOffice.get("id"), { trigger: true });
        }
      }

  });

  Views.ReviewVoteView = Marionette.ItemView.extend({
      template: Templates.reviewVote,
      tagName: "tr",
      events: {
        'click .change-vote'             :   'changeVote',
        'ifChecked input'                :   'checked'
      },

      modelEvents: {
        'change': 'fieldsChanged'
      },

      initialize: function() {
        //if (this.model.get("id")) this.model.set({uuid: this.model.get("id")});
        //this.justUpdated = false;
      },

      fieldsChanged: function() {
        //this.justUpdated = true;
        //this.render();
      },

      changeVote: function(e) {
        App.review = true;
        Backbone.history.navigate("vote/"+this.model.get("electionid"), { trigger: true });
      },

      onShow: function(e) {

      }

  });


  Views.ReviewView = Marionette.CompositeView.extend({
    template: Templates.review,
    itemView : Views.ReviewVoteView,
    itemViewContainer: ".votes",
    className: "col-md-12",

    events: {
      'click .next'             :   'next',
      'click .prev'             :   'prev',
      'click .up'               :   'scrollUp',
      'click .down'             :   'scrollDown',
      'click .cast-vote'        :   'castVotes'
    },
    initialize: function() {
      this.scrolled = 0;
    },

    onRender: function() {

    },

    onShow: function(e) {
      $('.vote-table').fixedHeaderTable({ height: 200 });
    },

    scrollUp: function(e) {
      var view = this;
      this.scrolled -= (this.scrolled >= 50) ? 50 : 0;
      $(".fht-tbody", this.$el).stop().animate({
          scrollTop: view.scrolled
      });
    },

    scrollDown: function(e) {
      var view = this;
      this.scrolled += 50;
      $(".fht-tbody", this.$el).stop().animate({
          scrollTop: view.scrolled
      });
    },

    next: function(e) {
      var view = this;


      if (App.voter.get("votes").length == App.offices.length) {
        Backbone.history.navigate("review", { trigger: true });
      } else {
        var index = App.offices.indexOf(this.model),
            nextOffice = App.offices.at(index+1);
        Backbone.history.navigate("vote/"+nextOffice.get("id"), { trigger: true });
      }
    },

    prev: function(e) {
      Backbone.history.navigate("voter-type-prev", { trigger: true });
    },

    castVotes: function(e) {
      var votes = App.voter.get("votes");
      votes.url = "/api/voter/"+App.voter.id+"/castVotes";
      votes.save({success: function(votes) {
        Backbone.history.navigate("finish", { trigger: true });
      }});
    }

  });

  Views.FinishView = Marionette.ItemView.extend({
    template: Templates.finish,
    className: "col-md-12",

    events: {
      'click .done'             :   'done'
    },

    initialize: function() {

    },

    onShow: function() {
      App.timerId = setTimeout(function(){
        Backbone.history.navigate("start", { trigger: true });
      },15000);
    },

    done: function(e) {
      clearTimeout(App.timerId);
      Backbone.history.navigate("start", { trigger: true });
    },

  });


  // Application Event Handlers
  // --------------------------


});
