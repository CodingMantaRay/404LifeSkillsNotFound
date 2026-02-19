function emailIsValid(email) {
    // Source: https://emailregex.com/
    let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

function phoneNumberIsValid(phoneNum) {
    let re = /^\s*(\(?\s*\d\s*\d\s*\d\s*\)?\s*-?\s*\d\s*\d\s*\d\s*-?\s*\d\s*\d\s*\d\s*\d)?\s*$/;
    return re.test(phoneNum);
}

function ageIsValid(age) {
    age = parseInt(age);
    return !isNaN(age) && age >= 13 && age <= 120;
}

function addressIsValid(addr) {
    return addr.length >= 2;
}

function nameIsValid(name) {
    return name.length >= 2;
}

function clearValidity(widget) {
    widget.setCustomValidity(''); // :valid
    widget.classList.remove("is-invalid");
    widget.classList.remove("is-valid");
}

function checkWidget(widget, validator) {
    if (typeof(widget) != "HTMLElement" && typeof(validator) != "function")
        return false;

    let isValid = validator(widget.value.trim());
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

function resetForm() {
    signupForm.reset();

    clearValidity(nameWidget);
    clearValidity(emailWidget);
    clearValidity(phoneWidget);
    clearValidity(ageWidget);
    clearValidity(addressWidget);
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

let resetButton = document.getElementById("resetBtn");
resetButton.addEventListener("click", resetForm);