function processObjectInfo(objectTXTInfo, objectJSONInfo) {
  // Convert text info to array and reverse it
  const reversedTXTInfo = objectTXTInfo.split('\n').reverse().slice(1);

  // Parse JSON and get annotations array in reverse order
  const originalJSON = JSON.parse(objectJSONInfo);
  const jsonObjects = [];
  for (let i = originalJSON.annotations.length - 1; i >= 0; i--) {
    jsonObjects.push(originalJSON.annotations[i]);
  }
  // Create new array for results
  let processedList = [];

  // Process each object
  for (let i = 0; i < Math.max(reversedTXTInfo.length, jsonObjects.length); i++) {
    if (i < jsonObjects.length) {
      // Get cosmic object name based on type
      let cosmicObject = '';
      if (jsonObjects[i].type === 'star') {
        cosmicObject = jsonObjects[i].names[jsonObjects[i].names.length - 1];
        cosmicObject = cosmicObject.split('/')[0].trim();
      } else if (jsonObjects[i].type === 'ngc') {
        cosmicObject = jsonObjects[i].names[0];
      }

      // Create link with cosmic object
      const targetUrl = `https://aladin.cds.unistra.fr/AladinLite/?target=${encodeURIComponent(cosmicObject)}&fov=0.70&survey=CDS%2FP%2FDSS2%2Fcolor`;
      processedList.push(`<a href="${targetUrl}" class="text-decoration-none" target="_blank">${reversedTXTInfo[i]}</a>`);
    } else {
      // Add remaining text items without links
      processedList.push(reversedTXTInfo[i]);
    }
  }

  // Reverse final list
  return processedList.reverse();
}

function getImageData(imageId) {
  $.ajax({
    url: `/api/image/imageviewer/${imageId}`,
    type: "GET",
    success: function (response) {
      if (response.status === "OK") {
        let imageProcessedLink = $("#imageProcessedLink");
        let imageProcessed = $("#imageProcessed");
        let imageOriginalLink = $("#imageOriginalLink");
        let imageOriginal = $("#imageOriginal");
        let infoList = $("#info-list");
        let exifData = $("#exifData");
        //let log = $("#log");
        let imgId = $("#imgId");
        let imgDatetime = $("#imgDatetime");

        var timestamp = parseInt(response.datetime);
        var date = new Date(timestamp);

        const exifInfo = Object.entries(response.exifInfo)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
        const objectTXTInfo = response.objectTXTInfo;
        const objectJSONInfo = response.objectJSONInfo;
        const processedList = processObjectInfo(objectTXTInfo, objectJSONInfo).join('\n');
        const positionInfo = `
Field Center(RA,Dec): ${response.JSONField.center.radec}
Field Center(RA H:M:S, Dec D:M:S): ${response.JSONField.center.hmsdms}
Field Size: ${response.JSONField.size}
Field Rotation: ${response.JSONField.rotation}
Field Parity: ${response.JSONField.parity}\n`;

        imgId.text(response.processedImg);
        imgDatetime.text(date);

/*         log.val(response.objectLogInfo);
        log.scrollTop(log[0].scrollHeight); */
        infoList.html(`${processedList}\n============================\n${positionInfo}`);
        exifData.val(exifInfo || "No EXIF data");
        imageProcessedLink.attr("href", `/api/image/getimage/${response.processedImg}`);
        imageProcessed.attr("src", `/api/image/getimage/${response.processedImg}`);
        imageOriginalLink.attr("href", `/api/image/getimage/${response.originalImg}`);
        imageOriginal.attr("src", `/api/image/getimage/${response.originalImg}`);

      } else {
        toastr.error("Server Error: " + response.message);
        console.log(response.error);
      }
    },
    error: function (error) {
      console.log(error);
    }
  });
}

$(document).ready(function () {
  $("#navGallery").addClass("active");

  const urlParams = new URLSearchParams(window.location.search);
  const imageId = urlParams.get('id');

  // Toastr configuration options
  toastr.options = {
    "closeButton": true,
    "debug": false,
    "newestOnTop": false,
    "progressBar": true,
    "positionClass": "toast-top-center",
    "preventDuplicates": true,
    "onclick": null,
    "showDuration": "300",
    "hideDuration": "300",
    "timeOut": "5000",
    "extendedTimeOut": "1000",
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "fadeIn",
    "hideMethod": "fadeOut"
  }

  getImageData(imageId)

});
