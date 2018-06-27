var mvs = require("Matchvs");
var GLB = require("Glb");
cc.Class({
    extends: require("uiPanel"),

    properties: {
        gun: {
            default: null,
            type: cc.Node
        },
        gunOther1: {
            default: null,
            type: cc.Node
        },
        gunOther2: {
            default: null,
            type: cc.Node
        },
        fireSmallBtn: {
            default: null,
            type: cc.Button
        },
        fireBigBtn: {
            default: null,
            type: cc.Button
        },
        timeLb: {
            default: null,
            type: cc.Label
        },
        coinLb: {
            default: null,
            type: cc.Label
        },
        bulletLb: {
            default: null,
            type: cc.Label
        },
        bulletIcon: {
            default: null,
            type: cc.Node
        },
        duckAudio: {
            default: null,
            url: cc.AudioClip
        },
        fireAudio: {
            default: null,
            url: cc.AudioClip
        },
        firePlusAudio: {
            default: null,
            url: cc.AudioClip
        },
        dirLeftMaxAngle: -45,
        dirRightMaxAngle: 45
    },

    onLoad() {
        this._super();
        this.fireCd = 0;
        this.bgmId = cc.audioEngine.play(this.duckAudio, true, 1);
        this.fireSmallBtn.node.on("click", function() {
            // 是否有子弹，子弹cd
            if (Game.GameManager.gameState !== GameState.Play) {
                return;
            }
            if (Game.BulletManager.smallBulletCnt > 0 && this.fireCd <= 0) {
                var msg = {
                    action: GLB.PLAYER_FIRE_EVENT,
                    bulletType: BulletType.Normal
                };
                Game.GameManager.sendEventEx(msg);
                cc.audioEngine.play(this.fireAudio, false, 1);
                Game.BulletManager.smallBulletCnt--;
                this.fireCd = 0.5;
                this.updateBulletLb();
                if (Game.BulletManager.smallBulletCnt <= 0) {
                    // 装弹--
                    clientEvent.dispatch(clientEvent.eventType.loadBullet);
                }
            }
        }, this);

        this.fireBigBtn.node.on("click", function() {
            // 金币兑换子弹是否足够--
            if (Game.GameManager.gameState !== GameState.Play) {
                return;
            }
            if (Game.GameManager.coin >= 1 && this.fireCd <= 0) {
                Game.GameManager.coin--;
                this.nodeDict["coin"].getComponent(cc.Animation).play();
                this.fireCd = 0.5;
                var msg = {
                    action: GLB.PLAYER_FIRE_EVENT,
                    bulletType: BulletType.Special
                };
                Game.GameManager.sendEventEx(msg);
                cc.audioEngine.play(this.firePlusAudio, false, 1);
                clientEvent.dispatch(clientEvent.eventType.updateCoin);
            }
        }, this);

        this.anim = this.bulletIcon.getComponent(cc.Animation);
        this.anim.on('finished', this.onFinished, this);
        this.updateCoin();

        clientEvent.on(clientEvent.eventType.time, this.setTime, this);
        clientEvent.on(clientEvent.eventType.updateCoin, this.updateCoin, this);
        clientEvent.on(clientEvent.eventType.loadBullet, this.loadBullet, this);
        clientEvent.on(clientEvent.eventType.roundStart, this.roundStart, this);
        clientEvent.on(clientEvent.eventType.gameOver, this.gameOver, this);
        clientEvent.on(clientEvent.eventType.leaveRoomNotify, this.leaveRoom, this);

        this.nodeDict["exit"].on("click", this.exit, this);
    },

    leaveRoom(data) {
        if (Game.GameManager.gameState !== GameState.Over) {
            uiFunc.openUI("uiTip", function(obj) {
                var uiTip = obj.getComponent("uiTip");
                if (uiTip) {
                    if (data.leaveRoomInfo.userId !== GLB.userInfo.id) {
                        uiTip.setData("对手离开了游戏");
                    }
                }
            }.bind(this));
        }
    },

    exit() {
        uiFunc.openUI("uiExit");
    },

    gameOver: function() {
        this.nodeDict['gameOver'].getComponent(cc.Animation).play();
        this.nodeDict['gameOver'].getComponent(cc.AudioSource).play();
        cc.audioEngine.stop(this.bgmId);
    },

    roundStart() {
        this.nodeDict["duckGuide"].getComponent(cc.Animation).play();
        setTimeout(function() {
            this.nodeDict['readyGo'].getComponent(cc.Animation).play();
            this.nodeDict['readyGo'].getComponent(cc.AudioSource).play();
        }.bind(this), 4500);
    },

    directionTouchMove: function(slider) {
        var range = this.dirRightMaxAngle - this.dirLeftMaxAngle;
        var rotation = this.dirLeftMaxAngle + range * (slider.progress);
        this.gun.rotation = rotation;
    },

    setTime: function(time) {
        this.timeLb.string = time;
        if (time === 10) {
            this.nodeDict["clock"].getComponent(cc.Animation).play();
        }
    },

    updateCoin: function() {
        this.coinLb.string = Math.floor(Game.GameManager.coin);
    },

    loadBullet: function() {
        this.anim.play();
    },

    updateBulletLb: function() {
        this.bulletLb.string = Game.BulletManager.smallBulletCnt;
    },

    onFinished: function() {
        Game.BulletManager.loadBullet();
        this.updateBulletLb();
    },

    update(dt) {
        if (this.fireCd > 0) {
            this.fireCd -= dt;
        }
    },

    onDestroy() {
        cc.audioEngine.stop(this.bgmId);
        clientEvent.off(clientEvent.eventType.time, this.setTime, this);
        clientEvent.off(clientEvent.eventType.updateCoin, this.updateCoin, this);
        clientEvent.off(clientEvent.eventType.loadBullet, this.loadBullet, this);
        clientEvent.off(clientEvent.eventType.roundStart, this.roundStart, this);
        clientEvent.off(clientEvent.eventType.gameOver, this.gameOver, this);
        clientEvent.off(clientEvent.eventType.leaveRoomNotify, this.leaveRoom, this);
    }
});
