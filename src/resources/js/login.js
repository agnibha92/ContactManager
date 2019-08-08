'use strict';

const SIGNUP_PATH    = "/user/signup/",
      LOGIN_PATH     = "/user/login/",
      STATUS_SUCCESS = "success";

let isLoginShowing = true;

const toggle = () => {
    isLoginShowing = !isLoginShowing;
    $("#formButton").html(isLoginShowing ? "Sign Up" : "Log In");
    $("#formHeader").html(isLoginShowing ? "Log In" : "Sign Up");
    $("#formSubmitButton").html(isLoginShowing ? "Log In" : "Sign Up");
};

const showAlert = (message) => {
    let $alertBox = $("#alertBox");
    $alertBox.html(message);
    $alertBox.show();
    setTimeout(() => {
        $alertBox.html("");
        $alertBox.hide();
    }, 2000);
};

const submitData = () => {
    let userName = $("#userName").val();
    let password = $("#password").val();
    let baseURL = window.location.origin;

    let apiPath = isLoginShowing ? LOGIN_PATH : SIGNUP_PATH;

    $.ajax({url: baseURL + apiPath, method: "POST", data: {userName, password}})
     .done(data => {
         if (isLoginShowing) {
             if (data.status === STATUS_SUCCESS) {
                 localStorage.setItem("authToken", data.authToken);
                 window.location.href = "/views/listing.html";
             }
         } else {
             $("#successBox").html("User Created Successfully");
             $("#successBox").show();
             setTimeout(() => {
                 window.location.href = "/";
             }, 1000);
         }
     }).fail((error) => {
        if (isLoginShowing) {
            showAlert("Invalid Credentials");
        } else {
            showAlert(error.responseJSON.message);
        }
    });
};

$(document).ready(() => {
    if (localStorage.getItem("authToken")) {
        window.location.href = "/views/listing.html";
    }
});
