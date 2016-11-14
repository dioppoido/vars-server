var express = require('express');
var router = express.Router();
/**
 * ログイン情報があるか確認する(session)
 * ログイン情報がなければlogin.jsへ遷移、あればindex.ejsへ遷移
 * req.session.user : session内ユーザーID情報
 */
const loginCheck = function(req, res, next) {
  if(req.session.user){
    next();
  }else{
    res.redirect('/login');
  }
};

router.get('/', loginCheck, function(req, res) {
  res.render('index.ejs', {user: req.session.user});
});

module.exports = router;
