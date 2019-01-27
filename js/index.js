$(function() {
  var inputID =prompt("請輸入您的名字？","府城一哥");
  if (!inputID){
  promt("姓名要輸入呦", "大名是?"); //如何逼他們輸入?
  }

  else{
  alert("歡迎 " + inputID + "一起來掃條碼");
  }
  // Create the QuaggaJS config object for the live stream
  var liveStreamConfig = {
    inputStream: {
      type: "LiveStream",
      constraints: {
        width: { min: 640 },
        height: { min: 480 },
        aspectRatio: { min: 1, max: 100 },
        facingMode: "environment" // or "user" for the front camera
      }
    },
    locator: {
      patchSize: "medium",
      halfSample: true
    },
    numOfWorkers: navigator.hardwareConcurrency
      ? navigator.hardwareConcurrency
      : 4,
    decoder: {
      readers: [{ format: "ean_reader", config: {} }]
    },
    locate: true
  };
  // The fallback to the file API requires a different inputStream option.
  // The rest is the same
  var fileConfig = $.extend({}, liveStreamConfig, {
    inputStream: {
      size: 800
    }
  });
  // Start the live stream scanner when the modal opens
  $("#livestream_scanner").on("shown.bs.modal", function(e) {
    Quagga.init(liveStreamConfig, function(err) {
      if (err) {
        $("#livestream_scanner .modal-body .error").html(
          '<div class="alert alert-danger"><strong><i class="fa fa-exclamation-triangle"></i> ' +
            err.name +
            "</strong>: " +
            err.message +
            "</div>"
        );
        Quagga.stop();
        return;
      }
      Quagga.start();
    });
  });

  // Make sure, QuaggaJS draws frames an lines around possible
  // barcodes on the live stream
  Quagga.onProcessed(function(result) {
    var drawingCtx = Quagga.canvas.ctx.overlay,
      drawingCanvas = Quagga.canvas.dom.overlay;

    if (result) {
      if (result.boxes) {
        drawingCtx.clearRect(
          0,
          0,
          parseInt(drawingCanvas.getAttribute("width")),
          parseInt(drawingCanvas.getAttribute("height"))
        );
        result.boxes
          .filter(function(box) {
            return box !== result.box;
          })
          .forEach(function(box) {
            Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, {
              color: "green",
              lineWidth: 2
            });
          });
      }

      if (result.box) {
        Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, {
          color: "#00F",
          lineWidth: 2
        });
      }

      if (result.codeResult && result.codeResult.code) {
        Quagga.ImageDebug.drawPath(
          result.line,
          { x: "x", y: "y" },
          drawingCtx,
          { color: "red", lineWidth: 3 }
        );
      }
    }
  });

  // Once a barcode had been read successfully, stop quagga and
  // close the modal after a second to let the user notice where
  // the barcode had actually been found.
  Quagga.onDetected(function(result) {
    if (result.codeResult.code) {
      $("#scanner_input").val(result.codeResult.code);
      Quagga.stop();
      setTimeout(function() {
        $("#livestream_scanner").modal("hide");
      }, 1000);
    }
  });

  // Stop quagga in any case, when the modal is closed
  $("#livestream_scanner").on("hide.bs.modal", function() {
    if (Quagga) {
      Quagga.stop();
    }
  });
 var test = $("#scanner_input").val();
  // Call Quagga.decodeSingle() for every file selected in the
  // file input
  $("#livestream_scanner input:file").on("change", function(e) {
    if (e.target.files && e.target.files.length) {
      Quagga.decodeSingle(
        $.extend({}, fileConfig, {
          src: URL.createObjectURL(e.target.files[0])
        }),
        function(result) {
          alert(result.codeResult.code);
        }
      );
    }
  });

  $("#send-data").on("click", function() {
   const productType = $("#product-type").val(); 
   const barcodeValue = $("#scanner_input").val();
    // console.log('===productType: ' + productType)
    const createDate = getDate()
    writeBarCode({ productType, barcodeValue, inputID, createDate});
    //$("#scanner_input").val("");//
    alert("上傳完畢");
     $("#scanner_input").val("")
    // document.getElementById("#scanner_input").value = '';
  });

  //
  var config = {
    authDomain: "gochemscan.firebaseapp.com",
    databaseURL: "https://gochemscan.firebaseio.com",
    projectId: "gochemscan",
    storageBucket: "gochemscan.appspot.com",
    messagingSenderId: "661922263477"
  };

  firebase.initializeApp(config);
//test 計算掃描總數// 
// function ObjectLength( object ) {
//     var length = 0;
//     for( var key in object ) {
//         if( object.hasOwnProperty(key) ) {
//             ++length;
//         }
//     }
//     return length;
// };

  var ref = firebase.database().ref(`barcode/${inputID}/`);
      ref.on("value", function(snapshot) {
      var totalscan = Object.keys(snapshot.val()).length;
      console.log(totalscan);
      document.querySelector(".result").innerHTML=totalscan;
  });

 
  function writeBarCode(payload) {
    //console.log('===payload: ', payload)
    firebase
      .database()
      .ref(`barcode/${inputID}/${_uuid()}`)
      .set({
      // 設計資料欄位
        producttype: payload.productType,
        barcode: payload.barcodeValue,
        userName: payload.inputID,
        createDate: payload.createDate
      });
  }
});

function _uuid() {
  var d = Date.now();
  if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
    d += performance.now(); //use high-precision timer if available
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function getDate() {
  var date = new Date();
  var nowMonth = date.getMonth() + 1;

  var strDate = date.getDate();
  if (nowMonth >= 1 && nowMonth <= 9) {
    nowMonth = "0" + nowMonth;
  }
  if (strDate >= 0 && strDate <= 9) {
    strDate = "0" + strDate;
  }
  var nowDate = date.getFullYear() + '-' + nowMonth + '-' + strDate;
  return nowDate
}