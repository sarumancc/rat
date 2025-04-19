
function getImageUploaded(page = 1) {
  $.ajax({
    url: `/api/gallery/gallerypaginated?page=${page}`,
    type: "GET",
    success: function (response) {
      if (response.status === "OK") {
        const images = response.data;
        const gallery = $(".gallery");
        const totalPage = response.totalPages;
        const currentPage = response.currentPage;
        const totalImages  = response.totalItems;

        $("#totalImages").text(totalImages);

        gallery.empty();
        $.each(images, function (index, imgSrc) {
          gallery.append(`<a href="/imageviewer?id=${imgSrc}"><img src="images/thumbnail/${imgSrc}" id="${imgSrc}_thumb" alt="${imgSrc}" class="thumbnail"></a>`);
        });

        $('li a[id^="pageNumber"]').parent().remove();
        for (let i = totalPage; i >= 1; i--) {
          $("#prevPage").after(`<li class="page-item"><a id="pageNumber${i}" class="page-link" onClick="getImageUploaded(${i})"  href="javascript:void(0)">${i}</a></li>`);
          
          if (i == currentPage ){
            $(`#pageNumber${i}`).addClass("bg-secondary").addClass("text-white");
          }
        }

        if (currentPage < totalPage) {
          const nextPage = currentPage + 1;
          $("#nextPage").attr("onClick", `getImageUploaded(${nextPage})`);
          $("#nextPage").removeClass("disabled");
        } else {
          $("#nextPage").addClass("disabled");
        }

        if (currentPage > 1) {
          const prevPage = currentPage - 1;
          $("#prevPage").attr("onClick", `getImageUploaded(${prevPage})`);
          $("#prevPage").removeClass("disabled");
        } else {
          $("#prevPage").addClass("disabled");
        }

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

  getImageUploaded(1);

});