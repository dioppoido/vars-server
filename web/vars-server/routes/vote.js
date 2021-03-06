var express = require('express');
var router = express.Router();
var validator = require('validator');
var getTeam = require('../app/js/team/getTeam');
var getEvent = require('../app/js/event/getEvent');
var getAggregate = require('../app/js/aggregate/getAggregate');
var randomByte = require("../app/js/db/randomByte");
var getVote=require('../app/js/votes/getVote');
var insertVote=require('../app/js/votes/insertVote');
var todate = require("../app/js/moment/moment.js");

const PasswordCheck = function(req, res, next) {
    if(req.session.user){
        if(req.query.eventid){
            getEvent.getEvent(req.query.eventid).then(function (eventdata) {
                if(!(eventdata[0].Password)||(req.session.user.success===req.query.eventid)){
                    next();
                }else{
                    req.session.user.success="";
                    req.session.user.header=req.headers.referer;
                    console.log(req.headers);
                    req.session.user.get='vote'+req.url;
                    req.session.user.eventid=req.query.eventid;
                    res.render('password.ejs',{msg:''});
                }
            });
        }else{
            res.redirect('/eventlist');
        }
    }else{
        res.redirect('/');
    }
};

router.get('/',PasswordCheck, function(req, res) {
    if(req.session.user ){
        if(req.query.eventid) {
            var eventid = req.query.eventid;
            var msg="";
            getEvent.getEvent(eventid).then(function (eventdata) {
                //日付処理
                //当日
                var today = todate.todate("YYYY-MM-D HH:mm:ss");
                var votestart = todate.parsedate(eventdata[0].Voteperiod.Votestart,"YYYY-MM-D HH:mm:ss");
                var votefinish = todate.parsedate(eventdata[0].Voteperiod.Votefinish, "YYYY-MM-D HH:mm:ss");
                var vote_flag = todate.comparison(today,votestart,votefinish);

                if( vote_flag === false){
                    res.render('vote.ejs',{
                        eventdata: "",
                        teamdata: "",
                        votedata: "",
                        msg:"このイベントの投票は投票期間外です。"
                    });
                }else if(vote_flag === true){

                    getTeam.getTeam(eventid).then(function (teamdata) {
                        getVote.getVote(eventid).then(function (votedata) {
                            var Aggregate_JSON={
                                Eventid:eventid,
                                Address:req.session.user.address
                            }
                            getAggregate.getAggregate(Aggregate_JSON).then(function (aggregatedata) {
                                if(aggregatedata.length>0){
                                    msg="既に投票済みです。";
                                    res.render('vote.ejs',{
                                        eventdata: "",
                                        teamdata: "",
                                        votedata: "",
                                        msg:msg
                                    });
                                }else{
                                    res.render('vote.ejs', {
                                        eventdata: eventdata,
                                        teamdata: teamdata,
                                        votedata: votedata,
                                        msg: msg
                                    });
                                }
                            }).catch(function (msg) {
                                res.render('vote.ejs',{
                                    eventdata: "",
                                    teamdata: "",
                                    votedata: "",
                                    msg:msg
                                });
                            });
                        }).catch(function (msg) {
                            res.render('vote.ejs',{
                                eventdata: "",
                                teamdata: "",
                                votedata: "",
                                msg:msg
                            });
                        });
                    }).catch(function(msg){
                        res.render('vote.ejs',{
                            eventdata: "",
                            teamdata: "",
                            votedata: "",
                            msg:msg
                        });
                    });
                }
            }).catch(function(){
                res.render('confirmation.ejs',{msg:'イベントIDが存在しません',url:'/eventlist'});
            });
        }else{
            res.redirect('/eventlist');
        }

    } else{
        res.redirect('/');
    }

});


router.post('/', function(req, res) {
    if(req.session.user ) {
        var AGGREGATES = [];
        var voteid = req.body.voteid;
        var teamid = req.body.teamid;
        var teamidlength = teamid.length;
        for (i = 0; i < teamidlength; i++) {
            const WORK_JSON = {
                'aggregateid': null,
                'voteid': null,
                'eventid': null,
                'address': null,
                'teamid': null
            };
            WORK_JSON.aggregateid=randomByte.randomByte();
            WORK_JSON.voteid = req.body.voteid[i];
            WORK_JSON.eventid = req.body.eventid[i];
            WORK_JSON.address = req.session.user.address;
            WORK_JSON.teamid = req.body.teamid[i];

            AGGREGATES.push(WORK_JSON);

            console.log(AGGREGATES[i]);


        };
        insertVote.insertVote(AGGREGATES);
        res.redirect('/voteresult');
    }else{
        res.redirect('/');
    }
  

});

module.exports = router;
