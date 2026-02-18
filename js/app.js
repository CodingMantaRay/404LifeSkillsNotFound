function emailIsValid(email) {
    // Source: https://emailregex.com/
    let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

function phoneNumberIsValid(phoneNum) {
    let re = /^\s*(\(?\d\d\d\)?\s*-?\s*\d\d\d\s*-?\s*\d\d\d\d)?\s*$/;
    return re.test(phoneNum);
}

function ageIsValid(age) {
    age = parseInt(age);
    return !isNaN(age) && age >= 0 && age < 200;
}

function addressIsValid(addr) {
    let re = /\w+/i;
    return re.test(addr);
}

function nameIsValid(name) {
    let re = /\w+/i
    return re.test(name);
}

function checkWidget(widget, validator) {
    if (typeof(widget) != "HTMLElement" && typeof(validator) != "function")
        return false;

    let widgetVal = widget.value.trim();
    let isValid = validator(widgetVal);
    if (isValid) {
        widget.setCustomValidity(''); // :valid
        widget.classList.add("is-valid"); // .is-valid
        widget.classList.remove("is-invalid"); // .is-valid
    } else {
        widget.setCustomValidity(false); // :invalid
        widget.classList.add("is-invalid"); // .is-invalid
        widget.classList.remove("is-valid"); // .is-valid
    }
    return isValid;
}

function checkEmail() {
    return checkWidget(emailWidget, emailIsValid);
}

// optional
function checkPhoneNumber() {
    return checkWidget(phoneWidget, phoneNumberIsValid);
}

function checkAge() {
    return checkWidget(ageWidget, ageIsValid);
}

function checkAddressOrAffiliation() {
    return checkWidget(addressWidget, addressIsValid);
}

function checkFullName() {
    return checkWidget(nameWidget, nameIsValid);
}

function checkForm(event) {
    console.log("check form");
    if (!checkEmail() || !checkPhoneNumber() || !checkAge() || !checkAddressOrAffiliation() || !checkFullName()) {
        console.log("invalid");
        signupForm.classList.add('was-validated');
        event.preventDefault();
    }
}

function clearForm(event) {
//     nameWidget.value = "";
//     emailWidget.value = "";
//     phoneWidget.value = "";
//     ageWidget.value = "";
//     addressWidget.value = "";

//     widget.setCustomValidity(false); // :invalid
//     widget.classList.remove("is-invalid"); // .is-invalid
//     widget.classList.remove("is-valid"); // .is-valid
}

let signupForm = document.getElementById("subscriberForm");
signupForm.addEventListener("submit", checkForm);

let nameWidget = document.querySelector("#fullName");
nameWidget.addEventListener("input", checkFullName);
nameWidget.noValidate = true;

let emailWidget = document.getElementById("email");
emailWidget.addEventListener("input", checkEmail);

let phoneWidget = document.getElementById("phone");
phoneWidget.addEventListener("input", checkPhoneNumber);

let ageWidget = document.getElementById("age");
ageWidget.addEventListener("input", checkAge);

let addressWidget = document.getElementById("address");
addressWidget.addEventListener("input", checkAddressOrAffiliation);

let clearButton = document.getElementById("resetBtn");
clearButton.addEventListener("click", clearForm);






