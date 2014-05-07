(function(){
  "use strict";

var fs = require('fs'),
    path = require('path'),
    email = require('nodemailer'),
    crypto = require('crypto'),
    spawn = require('child_process').spawn,
    async = require('async'),
    uuid = require("node-uuid"),
    glob = require('glob'),
    redis = require("redis"),
    underscore = require('underscore'),
    handlebars = require('handlebars'),
    Sequelize = require("sequelize"),
    Swag = require('swag'),
    Registrants = require("node-registrants"),
    registrants,
    db = {},
    Schemas = {},
    Models = {},
    DocumentTypes = {},
    Workflows = {},
    opts = {},
    config = {},
    reconnectTries = 0,
    hmac, signature, connection, client,
    transport, acl, redisClient,
    CheckinMemberFieldValues, RegMemberFieldValues, CheckinGroupMembers,
    RegGroupMembers, CheckinEventFields, CheckinBiller, RegBiller,
    CheckinBillerFieldValues, RegBillerFieldValues, RegEventFees,
    CheckinEventFees, CheckinExhibitorAttendeeNumber, CheckinExhibitorAttendees,
    ElectionOffices, ElectionOfficeCandidates, Votes, Sites;

Swag.registerHelpers(handlebars);


exports.setKey = function(key, value) {
    opts[key] = value;
};

exports.initialize = function() {
    //Initialize PGsql
    //getConnection();

    //Initialize Email Client

    transport = email.createTransport("sendmail", {
       args: ["-t", "-f", "noreply@regionvivpp.org"]
    });

    console.log(opts.configs.get("redis"));

    db.checkin = new Sequelize(
      opts.configs.get("mysql:checkin:database"),
      opts.configs.get("mysql:checkin:username"),
      opts.configs.get("mysql:checkin:password"),
      {
          dialect: 'mysql',
          omitNull: true,
          host: opts.configs.get("mysql:checkin:host") || "localhost",
          port: opts.configs.get("mysql:checkin:port") || 3306,
          pool: { maxConnections: 5, maxIdleTime: 30},
          define: {
            freezeTableName: true,
            timestamps: false
          }
    });

    registrants = Registrants.init({
      "host": opts.configs.get("mysql:checkin:host") || "localhost",
      "username": opts.configs.get("mysql:checkin:username"),
      "password": opts.configs.get("mysql:checkin:password"),
      "database": opts.configs.get("mysql:checkin:database"),
      "port": opts.configs.get("mysql:checkin:port") || 3306,
      "logging": false
    });

    redisClient = redis.createClient(opts.configs.get("redis:port"), opts.configs.get("redis:host"));
    redisClient.subscribe("voting");
    redisClient.on("subscribe", function (channel, count) {
      console.log("subscribed to", channel);
    });

    redisClient.on("message", gotMessage);

    CheckinMemberFieldValues = db.checkin.define('member_field_values', {
      id:                   { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      local_id:             { type: Sequelize.INTEGER },
      event_id:             { type: Sequelize.STRING(36) },
      field_id:             { type: Sequelize.INTEGER },
      member_id:            { type: Sequelize.INTEGER },
      value:                { type: Sequelize.TEXT }
    });

    CheckinGroupMembers = db.checkin.define('group_members', {
      id:                   { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      groupMemberId :       { type: Sequelize.INTEGER },
      event_id :            { type: Sequelize.STRING(36) },
      groupUserId :         { type: Sequelize.INTEGER },
      created :             { type: Sequelize.DATE },
      confirmnum :          { type: Sequelize.STRING(100) },
      attend:               { type: Sequelize.BOOLEAN },
      discount_code_id :    { type: Sequelize.INTEGER },
      checked_in_time :     { type: Sequelize.DATE }
    });

    CheckinEventFields = db.checkin.define('event_fields', {
      id:             { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      local_id :       { type: Sequelize.INTEGER },
      event_id :       { type: Sequelize.STRING(36) },
      field_id :       { type: Sequelize.INTEGER },
      local_event_id :       { type: Sequelize.INTEGER },
      badge_order :       { type: Sequelize.INTEGER },
      class :       { type: Sequelize.TEXT },
      name :       { type: Sequelize.STRING(50) },
      label :       { type: Sequelize.STRING(255) },
      field_size:       { type: Sequelize.INTEGER },
      description :       { type: Sequelize.STRING(255) },
      ordering :       { type: Sequelize.INTEGER },
      published :       { type: Sequelize.INTEGER },
      required:       { type: Sequelize.INTEGER },
      values :       { type: Sequelize.TEXT },
      type :       { type: Sequelize.INTEGER },
      selected :       { type: Sequelize.STRING(255) },
      rows:       { type: Sequelize.INTEGER },
      cols:       { type: Sequelize.INTEGER },
      fee_field:       { type: Sequelize.INTEGER },
      fees :       { type: Sequelize.TEXT },
      new_line:       { type: Sequelize.INTEGER },
      textual :       { type: Sequelize.TEXT },
      export_individual :       { type: Sequelize.BOOLEAN },
      export_group :       { type: Sequelize.BOOLEAN },
      attendee_list :       { type: Sequelize.BOOLEAN },
      usagelimit :       { type: Sequelize.TEXT },
      fee_type :       { type: Sequelize.BOOLEAN },
      filetypes :       { type: Sequelize.TEXT },
      upload :       { type: Sequelize.BOOLEAN },
      filesize :       { type: Sequelize.INTEGER },
      hidden :       { type: Sequelize.BOOLEAN },
      allevent :       { type: Sequelize.BOOLEAN },
      maxlength :       { type: Sequelize.INTEGER },
      date_format :       { type: Sequelize.STRING(25) },
      parent_id :       { type: Sequelize.INTEGER },
      selection_values :       { type: Sequelize.TEXT },
      textareafee :       { type: Sequelize.TEXT },
      showcharcnt :       { type: Sequelize.BOOLEAN },
      default :       { type: Sequelize.BOOLEAN },
      confirmation_field :       { type: Sequelize.BOOLEAN },
      listing :       { type: Sequelize.TEXT },
      textualdisplay :       { type: Sequelize.BOOLEAN },
      applychangefee :       { type: Sequelize.BOOLEAN },
      tag :       { type: Sequelize.STRING(255) },
      all_tag_enable :       { type: Sequelize.BOOLEAN },
      minimum_group_size :       { type: Sequelize.INTEGER },
      max_group_size :       { type: Sequelize.INTEGER },
      discountcode_depend :       { type: Sequelize.BOOLEAN },
      discount_codes :       { type: Sequelize.TEXT },
      showed :       { type: Sequelize.INTEGER },
      group_behave :       { type: Sequelize.INTEGER }
    });

    CheckinBiller = db.checkin.define('biller', {
      id:                   { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      userId :              { type: Sequelize.INTEGER },
      eventId :             { type: Sequelize.STRING(36) },
      local_eventId :       { type: Sequelize.INTEGER },
      type :                { type: Sequelize.ENUM('I','G') },
      register_date :       { type: Sequelize.DATE },
      payment_type :        { type: Sequelize.STRING(100) },
      due_amount :          { type: Sequelize.DECIMAL(10,2) },
      pay_later_option:     { type: Sequelize.INTEGER },
      confirmNum :          { type: Sequelize.STRING(50) },
      user_id :             { type: Sequelize.INTEGER },
      payment_verified :    { type: Sequelize.INTEGER },
      pay_later_paid:       { type: Sequelize.INTEGER },
      discount_code_id :    { type: Sequelize.INTEGER },
      billing_firstname :   { type: Sequelize.STRING(150) },
      billing_lastname :    { type: Sequelize.STRING(150) },
      billing_address :     { type: Sequelize.STRING(255) },
      billing_city :        { type: Sequelize.STRING(150) },
      billing_state :       { type: Sequelize.STRING(150) },
      billing_zipcode :     { type: Sequelize.STRING(10) },
      billing_email :       { type: Sequelize.STRING(150) },
      due_payment :         { type: Sequelize.DECIMAL(10,2) },
      status :              { type: Sequelize.INTEGER },
      attend :              { type: Sequelize.BOOLEAN },
      paid_amount :         { type: Sequelize.STRING(30) },
      transaction_id :      { type: Sequelize.STRING(255) },
      memtot :              { type: Sequelize.INTEGER },
      cancel :              { type: Sequelize.INTEGER }
    });

    CheckinEventFees = db.checkin.define('event_fees', {
      id:                   { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      local_id :            { type: Sequelize.INTEGER },
      event_id :            { type: Sequelize.STRING(36) },
      user_id :             { type: Sequelize.INTEGER },
      basefee :             { type: Sequelize.STRING(20) },
      memberdiscount :      { type: Sequelize.STRING(12) },
      latefee :             { type: Sequelize.STRING(12) },
      birddiscount :        { type: Sequelize.STRING(12) },
      discountcodefee :     { type: Sequelize.STRING(12) },
      customfee :           { type: Sequelize.STRING(12) },
      tax :                 { type: Sequelize.STRING(12) },
      fee :                 { type: Sequelize.STRING(12) },
      paid_amount :         { type: Sequelize.STRING(12) },
      status :              { type: Sequelize.STRING(12), defaultValue: '0' },
      due:                  { type: Sequelize.STRING(20), defaultValue: '0' },
      payment_method:       { type: Sequelize.STRING(20), defaultValue: '0' },
      feedate :             { type: Sequelize.DATE },
      changefee :           { type: Sequelize.STRING(12), defaultValue: '0' },
      cancelfee :           { type: Sequelize.STRING(12), defaultValue: '0' }
    });

    CheckinBillerFieldValues = db.checkin.define('biller_field_values', {
      id:                   { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      local_id :            { type: Sequelize.INTEGER },
      event_id :            { type: Sequelize.STRING(36) },
      field_id :            { type: Sequelize.INTEGER },
      user_id :             { type: Sequelize.INTEGER },
      value :               { type: Sequelize.TEXT }
    });

    ElectionOffices = db.checkin.define('electionOffices', {
      id :                    { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      conferenceid :          { type: Sequelize.INTEGER },
      position :              { type: Sequelize.INTEGER },
      title :                 { type: Sequelize.STRING(255) },
      description :           { type: Sequelize.STRING(255) }
    });

    ElectionOfficeCandidates = db.checkin.define('electionOfficeCandidates', {
      id :                    { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      electionid :            { type: Sequelize.INTEGER },
      position :              { type: Sequelize.INTEGER },
      name :                  { type: Sequelize.STRING(255) },
      company :               { type: Sequelize.STRING(255) }
    });

    ElectionOffices.hasMany(ElectionOfficeCandidates, {as: 'Candidates', foreignKey: 'electionid'});

    Votes = db.checkin.define('votes', {
      id :                    { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      uuid :                  { type: Sequelize.UUIDV4 },
      siteid :                { type: Sequelize.STRING(255) },
      electionid :            { type: Sequelize.INTEGER },
      registrantid :          { type: Sequelize.STRING(25) },
      candidateid :           { type: Sequelize.INTEGER },
      votertype:              { type: Sequelize.ENUM('management','non-management') },
      datecast :              { type: Sequelize.DATE }
    });

    CheckinExhibitorAttendeeNumber = db.checkin.define('exhibitorAttendeeNumber', {
      id:                   { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      userId :              { type: Sequelize.INTEGER },
      eventId :             { type: Sequelize.STRING(255) },
      attendees :           { type: Sequelize.INTEGER }
    });

    CheckinExhibitorAttendees = db.checkin.define('exhibitorAttendees', {
      id:                   { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      userId :              { type: Sequelize.INTEGER },
      eventId :             { type: Sequelize.STRING(36) },
      firstname :           { type: Sequelize.STRING(255) },
      lastname :            { type: Sequelize.STRING(255) },
      address :             { type: Sequelize.STRING(255) },
      address2 :            { type: Sequelize.STRING(255) },
      city :                { type: Sequelize.STRING(255) },
      state :               { type: Sequelize.STRING(255) },
      zip :                 { type: Sequelize.STRING(15) },
      email :               { type: Sequelize.STRING(255) },
      phone :               { type: Sequelize.STRING(25) },
      title :               { type: Sequelize.STRING(255) },
      organization :        { type: Sequelize.STRING(255) },
      created :             { type: Sequelize.DATE },
      updated :             { type: Sequelize.DATE },
      siteId :              { type: Sequelize.STRING(10) }
    });

    Sites = db.checkin.define('siteIds', {
      id:                   { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      company:              { type: Sequelize.STRING(255) },
      street1:              { type: Sequelize.STRING(255) },
      street2:              { type: Sequelize.STRING(255) },
      city:                 { type: Sequelize.STRING(255) },
      state:                { type: Sequelize.STRING(255) },
      zipCode:              { type: Sequelize.STRING(255) },
      siteId:               { type: Sequelize.STRING(255) }
    });

};

/************
* Routes
*************/

exports.index = function(req, res){
    var init = "$(document).ready(function() { Voting.start(); });";
    fs.readFile(__dirname + '/../assets/templates/index.html', 'utf8', function(error, content) {

      getRaces(function(offices) {
        init = "$(document).ready(function() {";
        init += "Voting.offices = new Voting.Models.Offices(" + JSON.stringify(offices) + ");";
        init += "Voting.start();";
        init += "});";
        var prefix = (opts.configs.get("prefix")) ? opts.configs.get("prefix") : "";
        var pageBuilder = handlebars.compile(content),
            html = pageBuilder({'init':init, 'prefix':prefix});

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(html, 'utf-8');
        res.end('\n');
      });
    });
};

exports.verifySiteId = function(req, res) {
  var member = req.body;
   async.waterfall([
    function(callback){
      getSiteInfo(member.siteId, function(site) {
        site = site.toJSON();
        callback(null, site);
      });
    },
    function(site, callback){
      getSiteVoters(site.siteId, function(voters) {
        site.voters = voters;
        callback(null, site);
      });
    }
  ],function(err, site) {
    req.session.voter.site = site;
    req.session.voter.siteId = site.siteId;
    member = req.session.voter;
    sendBack(res, member);
  });
};

exports.findSiteId = function(req, res) {
  var query = req.params.query;
  Sites
  .findAll({ where: ["siteid LIKE ?", query+"%"] })
  .success(function(siteids) {
    sendBack(res, siteids);
  });
};


var sendBack = function(res, data) {
  res.setHeader('Cache-Control', 'max-age=0, must-revalidate, no-cache, no-store');
  res.writeHead(200, { 'Content-type': 'application/json' });
  res.write(JSON.stringify(data), 'utf-8');
  res.end('\n');
};

var getSiteInfo = function(siteId, cb) {
  Sites.find({ where: { siteId: siteId } }).success(function(site) {
    cb(site);
  });
};

var getSiteVoters = function(siteId, cb) {

  async.waterfall([
    function(callback){
      Votes
      .findAll(
        {
          where: { siteid: siteId },
          group: 'registrantid'
        }
      )
      .success(function(votes) {
        callback(null, votes);
      });
    },
    function(votes, callback){
      async.map(
        votes,
        function(vote, mapCb) {
          var registrantId = vote.registrantid,
              regType = registrantId.slice(0,1),
              regId = parseInt(registrantId.slice(1), 10);

          registrants.getAttendee(registrantId, function(member) {
              member.voterType = vote.votertype;
              member.dateCast = vote.datecast;
              mapCb(null, member);
          });
        }, function(err, voters){
          if( err ) {
            callback(err, null);
          } else {
            callback(null, voters);
          }
        }
      );
    },
  ],function(err, voters) {
    if (err) console.log("error:", err);
    cb(voters);
  });


};

var gotMessage = function (channel, message) {
  console.log("message", message);
  getRaces(function(results) {
    opts.io.broadcast('talk', {type: "results", results: results});
  });
};

var getRaces = function(callback) {
  ElectionOffices
  .findAll()
  .success(function(offices) {
    var convertToJson = function(item, cback) {
          item = item.toJSON();
          getRaceResults(item.id, function(results) {
            item.results = results;
            cback(null, item);
          });

        };
    async.map(offices, convertToJson, function(err, results){
      callback(results);

    });
  });
};

var getRaceResults = function(id, callback) {
  var sql = "SELECT "+
        "  votes.electionid,  "+
        "  votes.candidateid,  "+
        "  electionOfficeCandidates.name,  "+
        "  electionOfficeCandidates.company, "+
        "  count(votes.id) as candidateVote, "+
        "  totalVotes.totalVote, "+
        "  (count(votes.id)/totalVotes.totalVote) * 100 as percent "+
        "FROM votes  "+
        "LEFT JOIN electionOfficeCandidates ON votes.candidateid = electionOfficeCandidates.id  "+
        "LEFT JOIN ( "+
        "  SELECT  "+
        "      votes.electionid,  "+
        "      count(votes.id) as totalVote "+
        "  FROM votes  "+
        "  GROUP BY electionid "+
        ") as totalVotes ON votes.electionid = totalVotes.electionid "+
        "WHERE votes.electionid = ? "+
        "GROUP BY electionid, candidateid ";

  db.checkin
  .query(
    sql, null,
    { raw: true }, [id]
  )
  .success(function(results) {
    callback(results);
  });
};

function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}

if (!String.prototype.trim) {
  String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/g, '');
  };
}

}());
