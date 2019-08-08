'use strict';
const LISTING_PATH     = '/user/:userId/contacts/',
      VIEW_PATH        = '/user/:userId/contacts/:contactId/view',
      GET_CONTACT_PATH = '/user/:userId/contacts/:contactId',
      ANALYTICS_PATH   = '/user/:userId/contacts/:contactId/analytics/',
      IMAGE_PATH       = '/user/:userId/contacts/:contactId/photo',
      BASE_PATH        = window.location.origin;

let chart, isEdit, datatable;

const fetchData = (userId) => {
    return new Promise((resolve, reject) => {
        let authToken = getAuthToken();
        return $.ajax({
                          url    : BASE_PATH + LISTING_PATH.replace(":userId", userId),
                          headers: {"Authorization": authToken}
                      }).done(resolve).fail(reject);
    });
};

const getUserIdFromAuthToken = () => {
    let jwtData = getAuthToken().split('.')[1];
    return JSON.parse(atob(jwtData)).userId;
};

const getAuthToken = () => {
    return localStorage.getItem("authToken");
};

const renderDataTable = (dataTableData) => {
    if (datatable) {
        datatable.destroy();
    }
    datatable = $("#data").DataTable({
                                         data    : dataTableData,
                                         columns : [
                                             {title: "Contact ID", visible: false, searchable: false},
                                             {title: "Name"},
                                             {title: "Mobile Number", sortable: false},
                                             {title: "Land Line Number", sortable: false},
                                             {title: "Created On"},
                                             {title: "Last Updated On"}
                                         ],
                                         scrollY : "350px",
                                         paging  : false,
                                         language: {
                                             search           : "",
                                             searchPlaceholder: "Search Here..."
                                         },
                                         select  : {
                                             style: 'single'
                                         }
                                     }
    );
    $('#data tbody').on('click', 'tr', function () {
        let data = datatable.row(this).data();
        console.log(data);
        openModal(data);
    });
};

const configureModal = (data) => {
    let modalTitle;
    if (!data) {
        modalTitle = "Create New Contact";
        $("#noAnalytics").show();
        $("#analyticsChart").hide();
    } else {
        modalTitle = "Edit or View Contact";
        $("#noAnalytics").hide();
        $("#analyticsChart").show();
    }
    $("#modalTitle").html(modalTitle);
};

function logView(contactId) {
    return new Promise((resolve, reject) => {
        $.ajax({
                   url    : BASE_PATH + VIEW_PATH.replace(":userId", getUserIdFromAuthToken()).replace(":contactId", contactId),
                   method : "POST",
                   headers: {"Authorization": getAuthToken()}
               }).done(resolve).fail(reject);
    });
}

function getContactData(contactId) {
    return new Promise((resolve, reject) => {
        $.ajax({
                   url    : BASE_PATH + GET_CONTACT_PATH.replace(":userId", getUserIdFromAuthToken()).replace(":contactId", contactId),
                   headers: {"Authorization": getAuthToken()}
               }).done(resolve).fail(reject);
    });
}

function populateContactData(contactData) {
    return new Promise((resolve, reject) => {
        $("#contactId").val(contactData._id);
        $("#firstName").val(contactData._firstName);
        $("#middleName").val(contactData._middleName);
        $("#lastName").val(contactData._lastName);
        $("#email").val(contactData._email);
        $("#mobileNumber").val(contactData._mobileNumber);
        $("#landLineNumber").val(contactData._landLineNumber);
        $("#notes").val(contactData._notes);
        return resolve(contactData._id);
    });
}

function populateAnalytics(contactId) {
    return new Promise((resolve, reject) => {
        $.ajax({
                   url    : BASE_PATH + ANALYTICS_PATH.replace(":userId", getUserIdFromAuthToken).replace(":contactId", contactId),
                   headers: {"Authorization": getAuthToken()}
               })
         .done(analyticsData => {
             let labels = [];
             let data = [];
             $("#views").html(analyticsData.total);
             $("#viewContainer").show();
             analyticsData.dailyAnalytics.forEach(dailyAnalytic => {
                 labels.push(new Date(dailyAnalytic.onDate).toLocaleDateString());
                 data.push(dailyAnalytic.count);
             });
             let context = document.getElementById("analyticsChart").getContext('2d');
             chart = new Chart(context, {
                 type   : 'line',
                 data   : {
                     labels  : labels,
                     datasets: [{
                         label: 'Views',
                         data : data
                     }]
                 },
                 options: {
                     responsive: true,
                     title     : {
                         display: true,
                         text   : 'Daily Views'
                     },
                     tooltips  : {
                         mode     : 'index',
                         intersect: false,
                     },
                     hover     : {
                         mode     : 'nearest',
                         intersect: true
                     }
                 }
             });
             resolve(contactId);
         }).fail(reject);
    });
}

function populateImage(contactId) {
    return new Promise((resolve, reject) => {
        let authToken = getAuthToken();
        fetch(BASE_PATH + IMAGE_PATH.replace(":userId", getUserIdFromAuthToken()).replace(":contactId", contactId),
              {
                  headers: {
                      "Authorization": authToken // this header is just an example, put your token here
                  }
              })
            .then(response => {
                if (response.status !== 200) {
                    $('#imagePreview').css('background-image', "url('/images/no_image.jpg')");
                    return null;
                } else {
                    return response.blob();
                }
            })
            .then(blob => {
                if (blob) {
                    let url = URL.createObjectURL(blob);
                    $('#imagePreview').css('background-image', 'url(' + url + ')');
                }
                resolve();
            });
    });
}

function populateModal(data) {
    let contactId = data[0];
    return logView(contactId).then(() => getContactData(contactId)).then(populateContactData).then(populateAnalytics).then(populateImage).catch((error) => {
    });
}

function resetModal() {
    document.getElementById("modalForm").reset();
    $("#viewContainer").hide();
    $('#imagePreview').css('background-image', "url('/images/no_image.jpg')");
    if (chart && chart instanceof Chart) {
        chart.destroy();
    }
}

const openModal = (data) => {
    resetModal();
    configureModal(data);
    if (data) {
        isEdit = true;
        populateModal(data).then(() => {
            $("#itemModal").modal({keyboard: false});
        }).catch(error => {
            console.log(error);
        });
    } else {
        isEdit = false;
        $("#itemModal").modal({keyboard: false});
    }
};

const readURL = (input) => {
    if (input.files && input.files[0]) {
        let reader = new FileReader();
        reader.onload = (e) => {
            $('#imagePreview').css('background-image', 'url(' + e.target.result + ')');
            $('#imagePreview').hide();
            $('#imagePreview').fadeIn(650);
        };
        reader.readAsDataURL(input.files[0]);
    }
};

const loadData = () => {
    fetchData(getUserIdFromAuthToken(getAuthToken())).then(data => {
        if (data.length === 0) {
            $("#addButton").hide();
            $("#noDataContainer").show();
        } else {
            $("#noDataContainer").hide();
            $("#addButton").show();
        }
        let dataTableData = [];
        data.forEach(dataPoint => {
            dataTableData.push([dataPoint._id,
                                `${dataPoint._firstName} ${dataPoint._middleName ? " " + dataPoint._middleName : ""} ${dataPoint._lastName}`,
                                dataPoint._mobileNumber,
                                dataPoint._landLineNumber,
                                new Date(dataPoint._createdAt).toLocaleDateString(),
                                new Date(dataPoint._updatedAt).toLocaleDateString()
                               ]);
        });
        renderDataTable(dataTableData);
    });
};

const showMessage = (id, message) => {
    let $errorBox = $(id);
    $errorBox.html(message);
    $errorBox.show();
    setTimeout(() => {
        $errorBox.html("");
        $errorBox.hide();
    }, 2000);
};


const saveModal = () => {

    let form = new FormData();
    form.append("firstName", $("#firstName").val());
    form.append("middleName", $("#middleName").val());
    form.append("lastName", $("#lastName").val());
    form.append("email", $("#email").val());
    form.append("mobileNumber", $("#mobileNumber").val());
    form.append("landLineNumber", $("#landLineNumber").val());
    form.append("notes", $("#notes").val());
    form.append("profilePhoto", $("#imageUpload")[0].files[0]);

    let url;
    if (isEdit) {
        let contactId = $("#contactId").val();
        url = BASE_PATH + GET_CONTACT_PATH.replace(":userId", getUserIdFromAuthToken).replace(":contactId", contactId);
    } else {
        url = BASE_PATH + LISTING_PATH.replace(":userId", getUserIdFromAuthToken());
    }

    $.ajax({
               url        : url,
               type       : isEdit ? "PUT" : "POST",
               data       : form,
               processData: false,
               contentType: false,
               headers    : {
                   "Authorization": getAuthToken()
               }
           }).done(() => {
        showMessage("#successBox", "Data Saved Successfully");
        setTimeout(() => {
            $('#itemModal').modal('hide');
            loadData();
        }, 2000);
    }).fail((error) => {
        if (error) {
            let response = error.responseJSON;
            if (response) {
                showMessage("#errorBox", response.message);
            }
        }
    });
};

const logoutUser = () => {
    localStorage.removeItem("authToken");
    window.location.href = "/";
};

$(document).ready(() => {
    if (!getAuthToken()) {
        window.location.href = "/";
        return;
    }
    loadData();
    $("#imageUpload").change(function () {
        readURL(this);
    });
});
