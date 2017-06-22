/*
 *hichat v0.4.2
 *Wayou Mar 28,2014
 *MIT license
 *view on GitHub:https://github.com/wayou/HiChat
 *see it in action:http://hichat.herokuapp.com/
 */


var flag = true;
window.onload = function() {
    var hichat = new HiChat();
    hichat.init();
};
var HiChat = function() {
    this.socket = null;
};



HiChat.prototype = {
    init: function() {

        $('#image').click(function() {
            $('#sendImage').click();
        });
        var that = this;
        this.socket = io.connect();
        this.socket.on('connect', function() {
            document.getElementById('info').textContent = '请输入您的昵称:';
            document.getElementById('nickWrapper').style.display = 'block';
            document.getElementById('nicknameInput').focus();
        });
        this.socket.on('nickExisted', function() {
            document.getElementById('info').textContent = '昵称已存在,请重新输入!';
        });
        this.socket.on('loginSuccess', function() {
            document.title = 'hichat | ' + document.getElementById('nicknameInput').value;
            document.getElementById('loginWrapper').style.display = 'none';
            document.getElementById('messageInput').focus();
        });
        this.socket.on('error', function(err) {
            if (document.getElementById('loginWrapper').style.display == 'none') {
                document.getElementById('status').textContent = '!fail to connect :(';
            } else {
                document.getElementById('info').textContent = '!fail to connect :(';
            }
        });
        this.socket.on('system', function(nickName, userCount, type, users) {
            if (flag == true) {
                $('.content2-1').html('<p class="userName"> <i class="fa fa-user-circle-o fa-lg"></i><span>' + nickName + '</span></p>');
                flag = false;
            }


            var msg = nickName + (type == 'login' ? ' 加入了' : ' 离开了');

            if (new RegExp(' 加入了').test(msg)) {
                that._displayNewMsg('system ', msg, '#000');


            } else {
                that._displayNewMsg('system ', msg, '#979798');


            }
            var msgTo = document.createElement('div');

            for (var k = 0; k < users.length; k++) {
                var msgTo1 = document.createElement('p');
                msgTo1.textContent = users[k];

                msgTo.appendChild(msgTo1);
                console.log(msgTo);


            }
            $('#name').html(msgTo);
            document.getElementById('status').textContent = userCount + (userCount > 1 ? ' users' : ' user') + ' online';
        });

        this.socket.on('newMsg', function(user, msg, color) {
            that._displayNewMsg(user, msg, color);
        });
        this.socket.on('newImg', function(user, img, color) {
            that._displayImage(user, img, color);
        });
        document.getElementById('loginBtn').addEventListener('click', function() {
            var nickName = document.getElementById('nicknameInput').value;
            if (nickName.trim().length != 0) {
                that.socket.emit('login', nickName);
            } else {
                document.getElementById('nicknameInput').focus();
            };
        }, false);
        document.getElementById('nicknameInput').addEventListener('keyup', function(e) {
            if (e.keyCode == 13) {
                var nickName = document.getElementById('nicknameInput').value;
                if (nickName.trim().length != 0) {
                    that.socket.emit('login', nickName);
                };
            };
        }, false);
        document.getElementById('sendBtn').addEventListener('click', function() {
            var messageInput = document.getElementById('messageInput'),
                msg = messageInput.value,
                color = document.getElementById('colorStyle').value;
            messageInput.value = '';
            messageInput.focus();
            if (msg.trim().length != 0) {
                that.socket.emit('postMsg', msg, color);
                that._displayNewMsg('me', msg, color);
                return;
            };
        }, false);
        document.getElementById('messageInput').addEventListener('keyup', function(e) {
            var messageInput = document.getElementById('messageInput'),
                msg = messageInput.value,
                color = document.getElementById('colorStyle').value;
            if (e.keyCode == 13 && msg.trim().length != 0) {
                messageInput.value = '';
                that.socket.emit('postMsg', msg, color);
                that._displayNewMsg('me', msg, color);
            };
        }, false);
        document.getElementById('clearBtn').addEventListener('click', function() {
            document.getElementById('historyMsg').innerHTML = '';
        }, false);
        document.getElementById('sendImage').addEventListener('change', function() {
            if (this.files.length != 0) {
                var file = this.files[0],
                    reader = new FileReader(),
                    color = document.getElementById('colorStyle').value;
                if (!reader) {
                    that._displayNewMsg('system', '!your browser doesn\'t support fileReader', 'red');
                    this.value = '';
                    return;
                };
                reader.onload = function(e) {
                    this.value = '';
                    that.socket.emit('img', e.target.result, color);
                    that._displayImage('me', e.target.result, color);
                };
                reader.readAsDataURL(file);
            };
        }, false);
        this._initialEmoji();
        document.getElementById('emoji').addEventListener('click', function(e) {
            var emojiwrapper = document.getElementById('emojiWrapper');
            emojiwrapper.style.display = 'block';
            e.stopPropagation();
        }, false);
        document.body.addEventListener('click', function(e) {
            var emojiwrapper = document.getElementById('emojiWrapper');
            if (e.target != emojiwrapper) {
                emojiwrapper.style.display = 'none';
            };
        });
        document.getElementById('emojiWrapper').addEventListener('click', function(e) {
            var target = e.target;
            if (target.nodeName.toLowerCase() == 'img') {
                var messageInput = document.getElementById('messageInput');
                messageInput.focus();
                messageInput.value = messageInput.value + '[emoji:' + target.title + ']';
            };
        }, false);
    },
    _initialEmoji: function() {
        var emojiContainer = document.getElementById('emojiWrapper'),
            docFragment = document.createDocumentFragment();
        for (var i = 69; i > 0; i--) {
            var emojiItem = document.createElement('img');
            emojiItem.src = '../content/emoji/' + i + '.gif';
            emojiItem.title = i;
            docFragment.appendChild(emojiItem);
        };
        emojiContainer.appendChild(docFragment);
    },
    _displayNewMsg: function(user, msg, color) {
        var container = document.getElementById('historyMsg'),
            msgToDisplay = document.createElement('p'),
            date = new Date().toTimeString().substr(0, 8),
            //determine whether the msg contains emoji
            msg = this._showEmoji(msg);
        msgToDisplay.style.color = color || '#000';
        if (user == 'me') {
            msgToDisplay.innerHTML = '<p style="text-align:center;"><span class="timespan">' + date + ' </span></p>' + '<p style="text-align:right;"><span class="myMessage style="font-size:15px;margin-right:20px;">' + msg + '</span> <i style="margin-right:20px;"class="fa fa-user-circle-o fa-2x"></i></p>';
            container.appendChild(msgToDisplay);
        } else {
            if (user == "system ") {
                container = document.getElementById('inFo')
                msgToDisplay.innerHTML = '<div class="inFoMsg"><i class="fa fa-user fa-lg"></i>' + msg + '</div>';
                container.appendChild(msgToDisplay);
                $('.inFoMsg').hover(function() {

                    $(this).css('background-color', '#E5ECEF');
                }, function() {
                    $(this).css('background-color', '#F1EFEF');
                });
            } else {
                msgToDisplay.innerHTML = '<p style="text-align:center;"><span class="timespan">' + date + ' </span></p>' + '<p style="text-align:left;"><i style="margin-left:20px;"class="fa fa-user fa-2x"></i>'+user+'<span class="yourMessage style="font-size:15px;margin-left:20px;">' + msg + '</span></p>';
                container.appendChild(msgToDisplay);
            }

        }
        container.scrollTop = container.scrollHeight;
    },
    _displayImage: function(user, imgData, color) {
        var container = document.getElementById('historyMsg'),
            msgToDisplay = document.createElement('p'),
            date = new Date().toTimeString().substr(0, 8);
        msgToDisplay.style.color = color || '#000';

        if (user == 'me') {
            msgToDisplay.innerHTML = '<p style="text-align:center;"><span class="timespan">' + date + '</span></p>' + '<p style="text-align:right"><i style="margin-right:20px;"class="fa fa-user-circle-o fa-2x"></i></p><p style="text-align:right;margin-right:20px;"><a href="' + imgData + '" target="_blank"><img src="' + imgData + '"/></a></p>';
        } else {
            msgToDisplay.innerHTML = '<p style="text-align:center;"><span class="timespan">' + date + '</span></p>' + '<p style="text-align:left;"><i style="margin-left:20px;"class="fa fa-user fa-2x"></i>'+user+ '</p>' + '<p style="text-align:left;margin-left:20px;"><a href="' + imgData + '" target="_blank"><img src="' + imgData + '"/></a></p>';
        }
        container.appendChild(msgToDisplay);
        container.scrollTop = container.scrollHeight;
    },
    _showEmoji: function(msg) {
        var match, result = msg,
            reg = /\[emoji:\d+\]/g,
            emojiIndex,
            totalEmojiNum = document.getElementById('emojiWrapper').children.length;
        while (match = reg.exec(msg)) {
            emojiIndex = match[0].slice(7, -1);
            if (emojiIndex > totalEmojiNum) {
                result = result.replace(match[0], '[X]');
            } else {
                result = result.replace(match[0], '<img class="emoji" src="../content/emoji/' + emojiIndex + '.gif" />'); //todo:fix this in chrome it will cause a new request for the image
            };
        };
        return result;
    }
};


Array.prototype.indexOf = function(val) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] == val) return i;
    }
    return -1;
};


Array.prototype.remove = function(val) {
    var index = this.indexOf(val);
    if (index > -1) {
        this.splice(index, 1);
    }
};
