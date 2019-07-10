const app = getApp()
Page({
  data: {
    qrcodeMac: "",
    searching: false,
    devicesList: []
  },

  ConnectByID: function(targetID){
    var that=this  
    console.log("ConnectByID:",targetID)
    var name,advertisData
    //获取当前的name和ad
    for (var i = 0; i < that.data.devicesList.length; i++) {
      if (targetID == that.data.devicesList[i].deviceId) {
        name=that.data.devicesList[i].name
        advertisData=that.data.devicesList[i].advertisData
        break
      }
    }

    console.log("connect:"+targetID+"|"+name+"|"+advertisData)
    wx.stopBluetoothDevicesDiscovery({
      success: function (res) {
        console.log(res)
      }
    })
    wx.showLoading({
      title: '连接蓝牙设备中...',
    })
    wx.createBLEConnection({
      deviceId: targetID,
      success: function (res) {
        console.log(res)
        wx.hideLoading()
        wx.showToast({
          title: '连接成功',
          icon: 'success',
          duration: 1000
        })
        console.log("getplatform")
        var platform = wx.getSystemInfoSync().platform
        console.log(platform)
        if(platform == "android"){          
          wx.navigateTo({
            url: '../device/device?connectedDeviceId=' + targetID +'&name='+name+'&advertisData='+advertisData
          })
        }
        else{
          console.log('ios device')
          wx.getBLEDeviceServices({
            // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接
            deviceId: targetID,
            success: function (res) {
              console.log("getBLEDeviceServices success")
              console.log(JSON.stringify(res))
              //获取设备特征对象
              wx.getBLEDeviceCharacteristics({
                deviceId: targetID,
                serviceId: '0783B03E-8535-B5A0-7140-A304D2495CB7',
                success: function(res) {
                  console.log('../device/device?connectedDeviceId=' + targetID +'&name='+name+'&advertisData='+advertisData)
                  wx.navigateTo({
                    url: '../device/device?connectedDeviceId=' + targetID +'&name='+name+'&advertisData='+advertisData
                  })
                },
                fail:function(){
                  wx.showModal({
                    title: '温馨提示',
                    content: '获取特征对象失败！',
                    showCancel: false
                  });
                  quit(obj);
                }
              })
            },
            fail:function(){
              wx.showModal({
                title: '温馨提示',
                content: '获取服务失败！',
                showCancel:false
              });
              quit(obj);
            }
          })
        }
        
        
      },
      fail: function (res) {
        console.log(res)
        wx.hideLoading()
        wx.showModal({
          title: '提示',
          content: '连接失败',
          showCancel: false
        })
      }
    })
  },
  SearchClick: function(){
    var that=this    
    that.setData({qrcodeMac:""})
    that.Search()
  },
  Search: function () {
    var that = this
    console.log("search:",that.data.searching)
    if (!that.data.searching) {
      //关闭现有的蓝牙连接
      wx.closeBluetoothAdapter({
        complete: function (res) {
          console.log(res)
          //打开蓝牙适配
          wx.openBluetoothAdapter({
            success: function (res) {
              console.log(res)
              wx.getBluetoothAdapterState({
                success: function (res) {
                  console.log(res)
                }
              })
              //开始搜索蓝牙设备
              wx.startBluetoothDevicesDiscovery({
                allowDuplicatesKey: false,
                success: function (res) {              
                  
                  console.log(res)
                  that.setData({
                    searching: true,
                    devicesList: []
                  })
                }
              })
            },
            fail: function (res) {
              console.log(res)
              wx.showModal({
                title: '提示',
                content: '请检查手机蓝牙是否打开',
                showCancel: false,
                success: function (res) {
                  that.setData({
                    searching: false
                  })
                }
              })
            }
          })
        }
      })
    }
    else {
      wx.stopBluetoothDevicesDiscovery({
        success: function (res) {
          console.log(res)
          that.setData({
            searching: false
          })
        }
      })
    }
  },

  ScanQR: function(){
    var that=this    
    that.setData({
      searching: false,
      qrcodeMac:""
    })      
    wx.scanCode({
      success(res) {
        that.setData({
          qrcodeMac:res.result,
        }) 
        //扫码成功后,搜索查找指定的蓝牙设备并连接
        that.Search()
        setTimeout(function() {
          that.ConnectByQrcode()
        }, 1500)
      }
    })
    
  },
  ConnectClick: function (e) {
    var that = this
    console.log(e.currentTarget.id)
    that.ConnectByID(e.currentTarget.id)
  },
  ConnectByQrcode: function()
  {
    var that=this
    console.log("qrcode:",that.data.qrcodeMac," devicelen:",that.data.devicesList.length)
    if(that.data.qrcodeMac!=""){
      for (var i = 0; i < that.data.devicesList.length; i++) {
        if (that.data.qrcodeMac == that.data.devicesList[i].advertisData) {
          var targetID=that.data.devicesList[i].deviceId
          //避免短时间内重复连接
          if(that.data.searching == false)
            return  
          that.setData({
            searching: false,
            qrcodeMac:""
          })      
          that.ConnectByID(targetID)
          break
        }
      }
    }   
    
    that.setData({
      searching: false,
      qrcodeMac:""
    })       
  },
  onLoad: function (options) {
    var that = this
    var list_height = ((app.globalData.SystemInfo.windowHeight - 50) * (750 / app.globalData.SystemInfo.windowWidth)) - 110
    that.setData({
      list_height: list_height
    })
    wx.onBluetoothAdapterStateChange(function (res) {
      console.log(res)
      that.setData({
        searching: res.discovering
      })
      if (!res.available) {
        that.setData({
          searching: false
        })
      }
    })
    wx.onBluetoothDeviceFound(function (devices) {
      //剔除重复设备，兼容不同设备API的不同返回值
      var isnotexist = true
      if (devices.deviceId) {
        if (devices.advertisData)
        {
          devices.advertisData = app.buf2hex(devices.advertisData)
        }
        else
        {
          devices.advertisData = ''
        }
        console.log(devices)
        for (var i = 0; i < that.data.devicesList.length; i++) {
          if (devices.deviceId == that.data.devicesList[i].deviceId) {
            isnotexist = false
          }
        }
        if (isnotexist) {
          that.data.devicesList.push(devices)
        }
      }
      else if (devices.devices) {
        if (devices.devices[0].advertisData)
        {
          devices.devices[0].advertisData = app.buf2hex(devices.devices[0].advertisData)
        }
        else
        {
          devices.devices[0].advertisData = ''
        }
        console.log(devices.devices[0])
        for (var i = 0; i < that.data.devicesList.length; i++) {
          if (devices.devices[0].deviceId == that.data.devicesList[i].deviceId) {
            isnotexist = false
          }
        }
        if (isnotexist) {
          that.data.devicesList.push(devices.devices[0])
        }
      }
      else if (devices[0]) {
        if (devices[0].advertisData)
        {
          devices[0].advertisData = app.buf2hex(devices[0].advertisData)
        }
        else
        {
          devices[0].advertisData = ''
        }
        console.log(devices[0])
        for (var i = 0; i < devices_list.length; i++) {
          if (devices[0].deviceId == that.data.devicesList[i].deviceId) {
            isnotexist = false
          }
        }
        if (isnotexist) {
          that.data.devicesList.push(devices[0])
        }
      }
      that.setData({
        devicesList: that.data.devicesList
      })
    })
  },
  onReady: function () {

  },
  onShow: function () {    
    if(this.data.qrcodeMac=="")
    {
      wx.closeBluetoothAdapter({
        complete: function (res) {
        }
      })
    }
  },
  onHide: function () {
    var that = this
    that.setData({
      devicesList: []
    })
    if (this.data.searching) {
      wx.stopBluetoothDevicesDiscovery({
        success: function (res) {
          console.log(res)
          that.setData({
            searching: false
          })
        }
      })
    }
  }
})