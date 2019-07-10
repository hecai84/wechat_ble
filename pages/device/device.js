const app = getApp()
const md5 = require('../../assets/js/md5.js')
const SECRETKEY = 'fyJygAw3nUN4JwU'
Page({
  data: {
    inputText: '',
    receiveText: '',
    connectedDeviceId: '',
    services: {},
    characteristics: {},
    name:'',
    advertisData:'',
    connected: true,
    salt:''
  },
  bindInput: function (e) {
    this.setData({
      inputText: e.detail.value
    })
    console.log(e.detail.value)
  },
  Send10: function()
  {
    this.setData({inputText: "open10"})
    this.Send()
  },
  Send30: function()
  {
    this.setData({inputText: "open30"})
    this.Send()
  },
  Send60: function()
  {
    this.setData({inputText: "open60"})
    this.Send()
  },
  //发送指令
  Send: function () {
    var that = this
    if (that.data.connected) {
      var buffer = new ArrayBuffer(that.data.inputText.length+8+1)
      var dataView = new Uint8Array(buffer)
      //添加签名
      var hex = md5.hexMD5(that.data.inputText+that.data.salt+that.data.advertisData+SECRETKEY);
      console.log("hex:",hex)
      for(var i=0;i<8;i++)
      {
        dataView[i] = hex.charCodeAt(i+8)
      }
      for (var i = 0; i < that.data.inputText.length; i++) {
        dataView[i+8] = that.data.inputText.charCodeAt(i)
      }
      dataView[that.data.inputText.length + 8]='\0'
      console.log("send:",dataView);
      wx.writeBLECharacteristicValue({
        deviceId: that.data.connectedDeviceId,
        serviceId: '0783B03E-8535-B5A0-7140-A304D2495CB7',
        characteristicId: '0783B03E-8535-B5A0-7140-A304D2495CBA',
        value: buffer,
        success: function (res) {
          console.log('发送成功')
        }
      })
    }
    else {
      wx.showModal({
        title: '提示',
        content: '蓝牙已断开',
        showCancel: false,
        success: function (res) {
          that.setData({
            searching: false
          })
        }
      })
    }
  },
  onLoad: function (options) {
    var that = this
    console.log(options)
    that.setData({
      connectedDeviceId: options.connectedDeviceId,
      name:options.name,
      advertisData:options.advertisData
    })
    wx.getBLEDeviceServices({
      deviceId: that.data.connectedDeviceId,
      success: function (res) {
        console.log(res.services)
        that.setData({
          services: res.services
        })
        wx.getBLEDeviceCharacteristics({
          deviceId: options.connectedDeviceId,
          serviceId: res.services[0].uuid,
          success: function (res) {
            console.log(res.characteristics)
            that.setData({
              characteristics: res.characteristics
            })
            wx.notifyBLECharacteristicValueChange({
              state: true,
              deviceId: options.connectedDeviceId,
              serviceId: '0783B03E-8535-B5A0-7140-A304D2495CB7',
              characteristicId: '0783B03E-8535-B5A0-7140-A304D2495CB8',
              success: function (res) {
                console.log('启用notify成功')
              }
            })
          }
        })
      }
    })
    wx.onBLEConnectionStateChange(function (res) {
      console.log(res.connected)
      that.setData({
        connected: res.connected
      })
    })
    //注册消息之后的回调函数
    //蓝牙设备发送的消息
    wx.onBLECharacteristicValueChange(function (res) {
      
      var receiveText = app.buf2string(res.value)
      if(receiveText.indexOf('salt:')==0)
      {
        that.setData({
          salt: receiveText.substr(5)
        })
      }
      console.log('接收到数据：' + receiveText)
      that.setData({
        receiveText: receiveText
      })
    })
  },
  onReady: function () {

  },
  onShow: function () {

  },
  onHide: function () {
    console.log('hide')
  }
})