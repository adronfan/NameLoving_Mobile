var express = require('express');
var router = express.Router();
var http = require('http');
var url = require("url");
var querystring = require("querystring");
var AV = require('avoscloud-sdk').AV;

/* GET home page. */
router.get('/', function(req, res) {
  res.render('myHome1', {});
  //res.render('detail', {});
  //res.render('search', {});
  //res.render('dianMing', {});
  //res.render('example_Ratchet', {});
  //res.render('example', {});
});

// 启动页面
router.get('/qidong', function(req, res) {
  res.render('qidongye', {});
});

// 查询页面
router.get('/search', function(req, res) {
  res.render('search', {});
});

// 点名页面
router.get('/dianMing', function(req, res) {
  res.render('dianMing', {isLogin:checkLogin(req) ? checkLogin(req)[1] : null});
});

// 我的页面
router.get('/myHome', function(req, res) {
    if(!checkLogin(req)) {
        var detailDate = {'allSee':0,'allComment':0};
        res.render('myHome', {"isLogin":null, "detailDate":detailDate, "usersPostsArr":[]});
        return;
    }

    var query = new AV.Query(AV.User);
    query.equalTo("objectId", checkLogin(req)[0]);  // find all the women
    query.find({
      success: function(currentUser) {
          var Comment = AV.Object.extend("Comment");
          var PostData = AV.Object.extend("postData");
          var query = new AV.Query(PostData);
          query.equalTo("user", currentUser);
          query.find({
            success: function(usersPosts) {
              // userPosts contains all of the posts by the current user.
              var usersPostsArr = [];
              var usersPostsDic = {};
              for(var i = 0; i < usersPosts.length; i++) {
                  var object = usersPosts[i];
                  usersPostsDic = {};
                  usersPostsDic["id"]=object.id;
                  usersPostsDic["hisname"]=object.get('hisname');
                  usersPostsDic["myname"]=object.get('myname');
                  usersPostsDic["our"]=object.get('our');
                  usersPostsDic["myege"]=object.get('myege');
                  usersPostsDic["myword"]=object.get('myword');
                  usersPostsDic["myself"]=object.get('myself');
                  usersPostsArr.push(usersPostsDic);
              }
              var allSee = 0;
              var allComment = 0;
              var currentComment = 0;// 计数当前在异步哪一个comment
              if (usersPosts.length <= 0.1) {
                res.writeHead(200, {'Set-Cookie': ['objectId=' + currentUser[0].id,'username=' + currentUser[0].attributes.username]});
                var detailDate = {'allSee':allSee,'allComment':allComment};
                res.render('myHome', {"isLogin":checklogin(req)[1], "detailDate":detailDate, "usersPostsArr":usersPostsArr});
              }
              for(var i = 0; i < usersPosts.length; i++) {
                  allSee += usersPosts[i].get("see");
                  // 回复
                  var commentQuery = new AV.Query(Comment);
                  commentQuery.equalTo("parent", usersPosts[i]);
                  commentQuery.count({
                      success: function(count) {
                          allComment += count;
                          currentComment += 1;
                          if (currentComment == usersPosts.length) {
                              // 向客户端设置一个Cookie
                              //res.writeHead(200, {
                              //    'Set-Cookie': ['objectId=' + currentUser[0].id,'username=' + currentUser[0].attributes.username]
                              //});
                              var detailDate = {'allSee':allSee,'allComment':allComment};
                              res.render('myHome', {"isLogin":checkLogin(req)[1], "detailDate":detailDate, "usersPostsArr":usersPostsArr});
                              return;
                          }
                      }
                  });
              }
            }
          });
      },
      error: function(error) {
          console.log("Error: " + error.code + " " + error.message);
      }
    });
});

// 登录
router.post('/login', function(req, res) {
    AV.User.logIn(req.body.name, req.body.password, {
      success: function(user) {
          // 回复和浏览数
          // 浏览数
          var Comment = AV.Object.extend("Comment");
          var PostData = AV.Object.extend("postData");
          var query = new AV.Query(PostData);
          query.equalTo("user", user);
          query.find({
            success: function(usersPosts) {
                // 用户的表白信息
              var usersPostsArr = [];
              var usersPostsDic = {};
              for(var i = 0; i < usersPosts.length; i++) {
                  var object = usersPosts[i];
                  usersPostsDic = {};
                  usersPostsDic["id"]=object.id;
                  usersPostsDic["hisname"]=object.get('hisname');
                  usersPostsDic["myname"]=object.get('myname');
                  usersPostsDic["our"]=object.get('our');
                  usersPostsDic["myege"]=object.get('myege');
                  usersPostsDic["myword"]=object.get('myword');
                  usersPostsDic["myself"]=object.get('myself');
                  usersPostsArr.push(usersPostsDic);
              }
              // userPosts contains all of the posts by the current user.
              var allSee = 0;
              var allComment = 0;
              var currentComment = 0;// 计数当前在异步哪一个comment
              for(var i = 0; i < usersPosts.length; i++) {
                  allSee += usersPosts[i].get("see");

                  // 回复
                    var commentQuery = new AV.Query(Comment);
                    commentQuery.equalTo("parent", usersPosts[i]);
                    commentQuery.find({
                        success: function(comments) {
                            allComment += comments.length;
                            currentComment += 1;
                            if (currentComment == usersPosts.length) {
                                console.log("NIHAO");
                                console.log(allSee);
                                console.log(allComment);
                                // 向客户端设置一个Cookie
                                res.writeHead(200, {
                                    'Set-Cookie': ['objectId=' + user.id,'username=' + user.attributes.username]
                                });
                                var returnStr = {'allSee':allSee,'allComment':allComment,'usersPostsArr':usersPostsArr};
                                res.end(JSON.stringify(returnStr));
                            }
                        }
                    });
              }
            }
          });
      },
      error: function(user, error) {
          res.end(null);
      }
    });
});

// 注册
router.post('/regist', function(req, res) {
    var user = new AV.User();
    user.set("username", req.body.name);
    user.set("password", req.body.password);
    user.signUp(null, {
      success: function(user) {
        res.end("OK");
      },
      error: function(user, error) {
        res.end("error");
      }
    });
});


// 表白内容
router.post('/postData', function(req, res) {
    if (checkLogin(req) == null) {
        res.end("error");
        return;
    }
    var query = new AV.Query(AV.User);
    query.equalTo("objectId", checkLogin(req)[0]);  // find all the women
    query.find({
      success: function(currentUser) {
        // Do stuff
        // 你可以用Backbone的语法.
        var postda = AV.Object.extend("postData");
        var postData = new postda();
        postData.set("user", currentUser);
        postData.set("myname",req.body.myname);
        postData.set("hisname",req.body.hisname);
        postData.set("myege",req.body.myege);
        postData.set("our",req.body.our);
        postData.set("myword",req.body.myword);
        postData.set("myself",req.body.myself);
        postData.save(null, {
          success: function(post) {
            // Execute any logic that should take place after the object is saved.
            console.log('New object created with objectId: ' + post.id);
            res.render('dianMing', {isLogin:checkLogin(req) ? checkLogin(req)[1] : null});
          },
          error: function(gameScore, error) {
            // Execute any logic that should take place if the save fails.
            // error is a AV.Error with an error code and description.
            console.log('Failed to create new object, with error code: ' + error.description);
            res.end("error");
          }
        });
      }
    });
});

// 表白内容
router.post('/searchName', function(req, res) {
    // 你可以用Backbone的语法.
    //var postda = AV.Object.extend("postData");
    var postda = AV.Object.extend("postData");
    var query = new AV.Query(postda);
    query.equalTo("hisname", req.body.searchName);
    query.find({
      success: function(results) {
        // Do something with the returned AV.Object values
        var arr = [];
        var objectForOneSearch = {};
        for (var i = 0; i < results.length; i++) {
          var object = results[i];
          objectForOneSearch = {};
          objectForOneSearch["id"]=object.id;
          objectForOneSearch["myname"]=object.get('myname');
          objectForOneSearch["our"]=object.get('our');
          objectForOneSearch["myege"]=object.get('myege');
          objectForOneSearch["myword"]=object.get('myword');
          objectForOneSearch["myself"]=object.get('myself');
          arr.push(objectForOneSearch);
        }
        res.end(JSON.stringify(arr));
      },
      error: function(error) {
        console.log("Error: " + error.code + " " + error.message);
      }
    });
});


// 查询姓名列表的详细
router.post('/detail', function(req, res) {
  // list 的id值唯一查找
  var listId = req.body.listId;
  var postda = AV.Object.extend("postData");
  var query = new AV.Query(postda);
  query.get(listId, {
    success: function(list) {
      // The object was retrieved successfully.
      var listDetail = {};
      listDetail["id"] = list.id;
      listDetail["name"] = list.get("myname");
      listDetail["myname"]=list.get('myname');
      listDetail["our"]=list.get('our');
      listDetail["myege"]=list.get('myege');
      listDetail["myword"]=list.get('myword');
      listDetail["myself"]=list.get('myself');

      list.increment("see");
      list.save();
      res.render('detail', {listDetail:listDetail});
    },
    error: function(object, error) {
      // The object was not retrieved successfully.
      // error is a AV.Error with an error code and description.
    }
  });
});

// 用户回复自己同意或者不同意
router.post('/agreeOrdisagree', function(req, res) {
  // list 的id值唯一查找
  var mywords = req.body.mywords;
  var listId = req.body.listId;
  var formIsAgree = req.body.formIsAgree;
  var sureForLover = req.body.sureForLover;

  var postda = AV.Object.extend("postData");
  var query = new AV.Query(postda);
  query.get(listId, {
    success: function(list) {
        var Comment = AV.Object.extend("Comment");
        var myComment = new Comment();
        myComment.set("sureForSelf", sureForLover);
        myComment.set("content", mywords);
        myComment.set("isAgree", !!parseInt(formIsAgree));
        myComment.set("parent", list);
        myComment.save();
        res.render('dianMing', {isLogin:checkLogin(req) ? checkLogin(req)[1] : null});
    },
    error: function(object, error) {
      // The object was not retrieved successfully.
      // error is a AV.Error with an error code and description.
    }
  });
});




function checkLogin(req) {
  var cookie = getCookies(req);
  if (cookie.objectId && cookie.username) {
      var arr = [cookie.objectId,cookie.username];
      return arr;
  } else {
      return null;
  }
}

function getCookies(req) {
     // 获得客户端的Cookie
    var Cookies = {};
    req.headers.cookie && req.headers.cookie.split(';').forEach(function( Cookie ) {
        var parts = Cookie.split('=');
        Cookies[ parts[ 0 ].trim() ] = ( parts[ 1 ] || '' ).trim();
    });
    return Cookies;
}

module.exports = router;
