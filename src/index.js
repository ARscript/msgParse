(function(){
  'use strict'
  var hasRequire = typeof require !== 'undefined'
  if(hasRequire) {
    var _ = require('underscore')
    var bcrypt = require('bcryptjs')
  } else {
    var root = this
    var _ = root._
    var bcypt = root.bcryptjs
  }

  var msgParse = {};


  /*********************
   * Private Functions *
   ********************/

  //Lighweight Storage Wrapper
  var Storage =
  { data: {}
  , storage_id: 'ARscript_'
  , get: function(key){
      var data, result;
      try {
        data = localStorage.getItem(this.storage_id+key)
      } catch(e) {

      }

      try {
        result = JSON.parse(data)
      } catch(e) {
        result = data
      }

      return result
    }
  , set: function(key, data){
      if (typeof data === "object") {
        data = JSON.stringify(data)
      }

      try {
        localStorage.setItem(this.storage_id+key, data)
      } catch(e){
        console.error('!!msgParse-storage - Could not store data in local storage', e)
      }
    }
  }

  /**
   * Create a initilization message from the server.
   * Sends the user a session hash that can be used
   * by other devices to pass data
   */
  var createServerInit = function(options){
    options = (options || {})
    var msg =
    { type: 'keyResponeFromServer'
    , sockId: ((options.conn || {}).id || '')
    , data:
      { roomKey: genHash(8)
      }
    }
    msg = JSON.stringify(msg)
    console.log('<--' + msg)
    options.conn.write(msg)
  }

  var genHash = function(length){
    var word = '';
    var possible="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    for (var i in _.range(length)) {
      word += possible[Math.floor((Math.random() * possible.length))].toString()
    }
    return word
  }

  var reconnectClient = function(options, cb){
    options = options || {}
    var res = {},
        type = ''
    if(!options.roomKey)
      genKeyRequest(cb)
    else
      genReconnectRequest(options, cb)

  }

  var genReconnectRequest = function(roomKey){
    return {
      type: 'clientReconnectRequest',
      data:
      { roomKey: roomKey
      }
    }
  }

  var genKeyRequest = function(cb){
    var msgObj =
    { type: 'keyRequest'
    }
    if(typeof cb === "function")
      cb.call(this, msgObj)
  }


  /********************
   * Public Functions *
   *******************/
  msgParse.deviceType = '';
  msgParse.sock = {};
  msgParse.initConn = function(initiate, options, cb) {
    initiate = (initiate || 'SERVER')
    switch(initiate) {
      case 'SERVER':
        createServerInit(options)
        break;
      case 'CLIENT':
        reconnectClient(options, cb)
        break;
      default:
        return initationFailed()
    }
  }

  msgParse.requestKeyFromServer = function() {

  }

  msgParse.commParse = function(msg, conn, cb){
    msg = JSON.parse(msg)
    if(typeof conn === "function"){
      cb = conn
      conn = {}
    }

    switch(msg.type) {
      case 'clientReconnectRequest':

        break;
      case 'keyResponeFromServer':
        Storage.set('roomKey', msg.data.roomKey)
        var roomKeyUpdateEvent = new CustomEvent('roomKeyUpdate', {roomKey: msg.data.roomKey})
        window.addListener('roomKeyUpdate', function(){
          console.log('room key updated')
        })
        window.dispatchEvent(roomKeyUpdateEvent)
        break;
      case 'keyRequest':
        return createServerInit({msg: msg, conn: conn})
        break;
    }
  }

  if( typeof exports !== 'undefined' ) {
    if( typeof module !== 'undefined' && module.exports ) {
      exports = module.exports = msgParse
    }
    exports.msgParse = msgParse
  } else {
    root.msgParse = msgParse
  }
}).call(this)

