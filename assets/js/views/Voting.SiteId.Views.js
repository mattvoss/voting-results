Voting.module('SiteId.Views', function(Views, App, Backbone, Marionette, $, _) {

  // Public View
  // --------------

  Views.AlertView = Marionette.ItemView.extend({
    template: Templates.alert,
    className: "alert alert-danger fade in",
  });

  Views.SiteIdAddressView = Marionette.ItemView.extend({
      template: Templates.siteIdAddress,
      tagName: "address"
  });

  Views.SiteIdView = Marionette.ItemView.extend({
      template: Templates.siteId,
      className: "row",
      events: {
        'keypress #siteid'        :   'onInputKeypress',
        'click .next'             :   'next',
        'click .prev'             :   'prev',
        'typeahead:selected #siteid'        :    'onTypeaheadSelect'
      },

      ui: {
        siteid: '.siteid'
      },

      initialize: function() {
        this.keyboardOpen = false;
      },

      modelEvents: {
        "change": 'renderAddress'
      },

      onShow: function() {
        var view = this;
        this.setupTypeAhead();

        this.ui.siteid.focus();
        //this.timeoutCb = setTimeout(this.goBack, App.timeout);

      },

      setupTypeAhead: function() {
        var view = this;
        /**
        $('#siteid', this.$el).typeahead(
            {
                minLength: 2,
                highlight: true,
            },
            {
                name: "siteid",
                displayKey: 'siteId',
                source: function (query, cb) {
                  $.get('/api/siteid/'+query, {  }, function (data) {
                    return cb(data);
                  });
                },
                templates: {
                  empty: [
                    '<div class="empty-message">',
                    'No Site IDs matching your query could be found',
                    '</div>'
                  ].join('\n'),
                  suggestion: Templates.siteIdSuggestion
                }
            }
        );
        **/

        this.ui.siteid
        .keyboard({
            layout: 'custom',
            customLayout: {
             'default' : [
              '1 2 3',
              '4 5 6',
              '7 8 9',
              ' 0 ',
              '{bksp}',
              '{accept} {cancel}'
             ]
            },
            openOn : null,
            stayOpen : true,
            css: {
              // input & preview
              input: '',
              // keyboard container
              container: 'center-block dropdown-menu', // jumbotron
              // default state
              buttonDefault: 'btn btn-default',
              // hovered button
              buttonHover: 'btn-primary',
              // Action keys (e.g. Accept, Cancel, Tab, etc);
              // this replaces "actionClass" option
              buttonAction: 'active',
              // used when disabling the decimal button {dec}
              // when a decimal exists in the input area
              buttonDisabled: 'disabled'
            }
        })
        .autocomplete({
          source: function( request, response ) {
            $.get('/api/siteid/'+request.term, {  }, function (data) {

              response( $.map( data, function( item ) {
                return _.extend(
                  item,
                  {
                    label: item.siteId + " - " + item.company ,
                    value: item.siteId
                  }
                );
              }));
            });
          },
          minLength: 2,
          select: _.bind(this.onTypeaheadSelect, {view: this})
        })
        .addAutocomplete()
        .addTyping();

        $('.keyboard', this.$el).click(function(){
          if (view.keyboardOpen) {
            view.ui.siteid.getkeyboard().close();
          } else {
            view.ui.siteid.getkeyboard().reveal();
          }
          view.keyboardOpen = (view.keyboardOpen) ? false : true;
        });
      },

      renderAddress: function() {
        this.render();
        this.setupTypeAhead();
      },

      onTypeaheadSelect: function(e, data) {
        this.view.model.set({
          "site":data.item,
          "siteId": data.item.siteId
        });
      },

      onInputKeypress: function(evt) {
        var ENTER_KEY = 13;

        if (evt.which === ENTER_KEY && this.ui.siteid.val().length == 6) {
          evt.preventDefault();
          this.next(evt);
        }
      },

      showAlert: function(model) {
        var alert = new App.SiteId.Views.AlertView({model: model});
        $("#registrantid", this.$el).removeClass("alert-danger");
        $(".alert", this.$el).remove();
        alert.render();
        $("#"+model.get("error"), this.$el).addClass("alert-danger");
        $(alert.$el).insertBefore(".login-title", this.$el);
      },

      prev: function(e) {
        App.voter.destroy(
          {
            success: function(model, response, options) {
              Backbone.history.navigate("start", { trigger: true });
            },
            error: function(model, xhr, options) {

            }
          }
        );

      },

      next: function(e) {
        var view = this;
        App.voter.set({
          siteid: this.ui.siteid.val().trim()
        });
        if (App.voter.isValid()) {
          App.voter.urlRoot = "/api/voter/siteid";

          App.voter.save(
            {},
            {
              success: function(model, response, options) {
                //App.login.$el.hide();
                App.voter.urlRoot = "/api/voter";
                Backbone.history.navigate("voter-type", { trigger: true });
              },
              error: function(model, xhr, options) {
                var alertModel = new Backbone.Model({
                      'error': 'siteid',
                      'message': 'The Site ID entered does not match any on file'
                    });
                alert = new App.SiteId.Views.AlertView({model: alertModel});
                $("#siteid", view.$el).removeClass("alert-danger");
                $(".alert", view.$el).remove();
                alert.render();
                $(alert.$el).insertBefore(".login-title", this.$el);
              }
            }
          );
        } else {
          var model = new Backbone.Model(App.voter.validationError);
          this.showAlert(model);
        }
      },

      update: function() {

      }

  });

  Views.PreviousVotersView = Marionette.ItemView.extend({
      template: Templates.previousVoter,
      tagName: "tr"
  });

  Views.VoterTypeView = Marionette.CompositeView.extend({
      template: Templates.voterType,
      itemView : Views.PreviousVotersView,
      itemViewContainer: ".voters",
      className: "row voterType",
      events: {
        'keypress #siteid'        :   'onInputKeypress',
        'click .next'             :   'next',
        'click .prev'             :   'prev',
        'ifChecked input'         :   'checked'
      },

      ui: {
        votertype: '#votertype'
      },

      initialize: function() {

      },

      onShow: function() {
        if (this.collection.length === 0) {
          $(".voter-table", this.$el).hide();
          $(".voter-label", this.$el).hide();
        }

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

        if (this.collection.length == 2) {
          $(".prev", this.$el).text("Start Over");
        }

      },

      onInputKeypress: function(evt) {
        var ENTER_KEY = 13;

        if (evt.which === ENTER_KEY && this.ui.registrantid.val().length > 0) {
          evt.preventDefault();
          this.next(evt);
        }
      },

      checked: function(e) {
        this.model.set({"voterType": $(e.currentTarget).val()});
        $(".next", this.$el).attr("disabled", false);
      },

      showAlert: function(model) {
        var alert = new App.SiteId.Views.AlertView({model: model});
        $("#registrantid", this.$el).removeClass("alert-danger");
        $(".alert", this.$el).remove();
        alert.render();
        $("#"+model.get("error"), this.$el).addClass("alert-danger");
        $(alert.$el).insertBefore(".login-title", this.$el);
      },

      prev: function(e) {
        if (this.collection.length == 2) {
          Backbone.history.navigate("start", { trigger: true });
        } else {
          Backbone.history.navigate("siteid", { trigger: true });
        }
      },

      next: function(e) {
        var view = this;
        if (App.voter.isValid()) {
          App.voter.urlRoot = "/api/voter/voter-type";

          App.voter.save(
            {},
            {
              success: function(model, response, options) {
                //App.login.$el.hide();
                App.voter.urlRoot = "/api/voter";
                var office = App.offices.first();
                Backbone.history.navigate("vote/"+office.get("id"), { trigger: true });
              },
              error: function(model, xhr, options) {
                var alertModel = new Backbone.Model({
                      'error': 'login',
                      'message': 'The Registrant ID entered does not match any on file'
                    });
                alert = new App.SiteId.Views.AlertView({model: alertModel});
                $("#siteid", view.$el).removeClass("alert-danger");
                $(".alert", view.$el).remove();
                alert.render();
                $(alert.$el).insertBefore(".login-title", this.$el);
              }
            }
          );
        } else {
          var model = new Backbone.Model(App.voter.validationError);
          this.showAlert(model);
        }
      },

      update: function() {

      }

  });

  // Application Event Handlers
  // --------------------------

});
