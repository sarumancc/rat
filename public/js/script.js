
function getImageUploaded() {
  $.ajax({
    url: "/api/image/lastimages",
    type: "GET",
    success: function (response) {
      if (response.status === "OK") {
        const images = response.data;
        const $gallery = $(".gallery");

        // Limpiar la galería y agregar nuevas imágenes
        $gallery.empty();
        $.each(images, function (index, imgSrc) {
          $gallery.append(`<a href="http://chupacabra.cl:5000/imageviewer?id=${imgSrc}"><img src="images/thumbnail/${imgSrc}" id="${imgSrc}_thumb" alt="Thumbnail" class="thumbnail"></a>`);
        });
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

function processObjectInfo(objectTXTInfo, objectJSONInfo) {
  // Convert text info to array and reverse it
  const reversedTXTInfo = objectTXTInfo.split('\n').reverse().slice(1);

  // Parse JSON and get annotations array in reverse order
  const originalJSON = JSON.parse(objectJSONInfo);
  const jsonObjects = [];
  for (let i = originalJSON.annotations.length - 1; i >= 0; i--) {
    jsonObjects.push(originalJSON.annotations[i]);
  }
  console.log(jsonObjects);
  console.log(reversedTXTInfo);

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

function alertBanner(input, alertType = 'alert-danger') {
  // Remove existing alert if present
  $('#alertBanner').remove();

  // Create new alert element
  const newAlert = `
    <div id="alertBanner" class="alert ${alertType} alert-dismissible fade show" role="alert">
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      <span id="alertBannerText">${input}</span>
    </div>
  `;

  // Insert the new alert at the beginning of the form
  $('#formUploadImg').prepend(newAlert);
}

$(document).ready(function () {

  $("#navMain").addClass("active");
  // Toastr configuration options
  /*   toastr.options = {
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
    } */

  $("#imgProcessSection").hide();

  const imageUpload = $("#image-upload");
  const previewImg = $("#previewimg");

  getImageUploaded();

  // Vista previa de imagen
  imageUpload.on("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => previewImg.attr("src", e.target.result);
      reader.readAsDataURL(file);

      // Update file information
      $("#fileInfo-name").text(file.name);
      $("#fileInfo-size").text((file.size / 1024).toFixed(2) + " KB");
      $("#fileInfo-type").text(file.type);
      $("#fileInfo-modified").text(new Date(file.lastModified).toLocaleString());

      // Image specific info (only available after loading)
      const img = new Image();
      img.onload = function () {
        $("#fileInfo-dimensions").text(`${this.width} x ${this.height}`);
        $("#fileInfo-aspectRatio").text((this.width / this.height).toFixed(2));
      };
      img.src = URL.createObjectURL(file);
    }
  });
});

$("form").on("submit", function (event) {
  // Show the modal
$('#modalReadme').modal('show');
  $("#imgProcessSection").hide();
  event.preventDefault(); // Evita que el formulario se envíe de manera tradicional
  const imgInput = $('#image-upload')[0].files[0];

  // Validar que se haya seleccionado una imagen
  if (!imgInput) {
    alertBanner("Please select an image before submitting.");
    return;
  }
  // Validar que el archivo sea una imagen
  if (!imgInput.type.startsWith("image/")) {
    alertBanner("Only image files are allowed.");
    return;
  }

  // Validar el tamaño del archivo (25MB = 25 * 1024 * 1024 bytes)
  if (imgInput.size > 25 * 1024 * 1024) {
    alertBanner("File size exceeds 25MB limit. Please select a smaller file.");
    return;
  }


  // Deshabilitar el botón y cambiar el texto
  $('#image-upload').prop('disabled', true);
  //$("#loadingGif").show();  // Muestra el GIF
  $('#submitImgBtn').prop('disabled', true)
  //$('#buttonText').text('Processing Image...');

  // Agregar los datos al FormData
  let formData = new FormData();
  formData.append('imgInput', imgInput)
  formData.append("fontSize", $("#font-size").val());
  formData.append("constellations", $("#constellations").is(":checked"));
  formData.append("ngcCatalog", $("#ngc-catalog").is(":checked"));
  formData.append("brightStars", $("#bright-stars").is(":checked"));
  formData.append("nBrightest", $("#n-brightest").val());
  formData.append("raDecGrid", $("#ra-dec-grid").is(":checked"));
  formData.append("gridSpacing", $("#grid-spacing").val());
  formData.append("gridColor", $("#grid-color").val());

  if (!$("#copyrightText").val() == null || !$("#copyrightText").val() == "") {
    formData.append("copyrightText", $("#copyrightText").val());
    formData.append("textPosition", $("#textPosition").find(":selected").val());
    formData.append("textColor", $("#textColor").val());
    formData.append("textOpacity", $("#textOpacity").val());
    formData.append("fontSizeCopyright", $("#fontSizeCopyright").val());
  }

  // Enviar la petición AJAX
  $.ajax({
    url: "/api/astrometry/process",
    type: "POST",
    data: formData,
    contentType: false,
    processData: false,
    xhr: function () {
      //$('#uploadDoc').prop('disabled', true);
      let xhr = new window.XMLHttpRequest();
      xhr.upload.addEventListener('progress', function (e) {
        if (e.lengthComputable) {
          let percent = Math.round((e.loaded / e.total) * 100);
          $("#percentUpload").show();
          $("#percentUpload").text(`${percent}%`);
          $('#buttonText').text('Uploading File...');
          if (percent === 100) {
            $("#loadingGif").show();
            $("#percentUpload").hide();
            $('#buttonText').text('Processing Image...');
          }
        }
      });

      return xhr;
    },
    success: function (response) {
      if (response.status === "OK") {
        let log = $('#log');
        let infoList = $('#info-list');
        let exifData = $('#exifData');
        const exifInfo = Object.entries(response.exifInfo)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
        const fileName = response.fileName;
        const objectTXTInfo = response.objectTXTInfo;
        const objectJSONInfo = response.objectJSONInfo;

        const processedList = processObjectInfo(objectTXTInfo, objectJSONInfo).join('\n');

        log.val(response.data.processLog);
        log.scrollTop(log[0].scrollHeight);

        const positionInfo = `
Field Center(RA,Dec): ${response.fieldInfo.center.radec}
Field Center(RA H:M:S, Dec D:M:S): ${response.fieldInfo.center.hmsdms}
Field Size: ${response.fieldInfo.size}
Field Rotation: ${response.fieldInfo.rotation}
Field Parity: ${response.fieldInfo.parity}\n`;

        infoList.html(`${positionInfo}\n============================\n${processedList}`);
        exifData.val(exifInfo || "No EXIF data");

        // Limpiar imagen anterior antes de cargar la nueva
        $('#sky-map img').attr('src', "").hide();
        $('#sky-map a').attr('href', "");

        // Cargar la nueva imagen
        $('#sky-map img').attr('src', `/api/image/getimage/${fileName}`).show();
        $('#sky-map a').attr('href', `/api/image/getimage/${fileName}`);

        $("#imgProcessSection").show();
        $("#imgProcessSection").focus();

        // Habilitar el botón nuevamente
        $('#image-upload').prop('disabled', false);
        $('#submitImgBtn').prop('disabled', false);
        $("#percentUpload").hide();
        $("#loadingGif").hide();
        $('#buttonText').text('Upload Image');

        getImageUploaded();
        $("#previewimg").attr("src", "images/place100.webp");
        $("#formUploadImg")[0].reset();

      } else {
        alertBanner(`${response.message}`)
        console.log(response);

        $('#image-upload').prop('disabled', false);
        $("#loadingGif").hide();
        $('#submitImgBtn').prop('disabled', false)
        $('#buttonText').text('Upload Image');
      }
    },
    error: function (error) {
      alertBanner(`<strong>Error processing image:</strong> ${error.responseJSON?.message || error.statusText}`);
      console.log(error);

      $('#image-upload').prop('disabled', false);
      $("#loadingGif").hide();
      $('#submitImgBtn').prop('disabled', false)
      $('#buttonText').text('Upload Image');
    }
  });

  // Habilitar el botón cuando se seleccione una imagen válida
  $("#image-upload").on("change", function () {
    const imgInput = this.files[0];

    if (imgInput && imgInput.type.startsWith("image/")) {
      $('#submitImgBtn').prop('disabled', false);
    } else {
      $('#submitImgBtn').prop('disabled', true);
    }
  });

});
