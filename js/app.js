/**
 * Checks whether an email address is of a valid format, using RegEx.
 * @param {*} email email address, String
 * @returns true if email is valid, else false
 */
function emailIsValid(email) {
    // Source: https://emailregex.com/
    let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

/**
 * Checks whether a phone number is of a valid format, using RegEx.
 * @param {*} phoneNum phone number, String
 * @returns true if phone number is valid, else false
 */
function phoneNumberIsValid(phoneNum) {
    let re = /^\s*(\(?\s*\d\s*\d\s*\d\s*\)?\s*-?\s*\d\s*\d\s*\d\s*-?\s*\d\s*\d\s*\d\s*\d)?\s*$/;
    return re.test(phoneNum);
}

/**
 * Checks whether the given age is valid, i.e. is an integer between 13 and 120, inclusive.
 * @param {*} age 
 * @returns true if age is valid, else false
 */
function ageIsValid(age) {
    age = parseInt(age);
    return !isNaN(age) && age >= 13 && age <= 120;
}

/**
 * Checks whether the given address is at least 2 characters long.
 * @param {*} addr address, String
 * @returns true if address is valid, else false
 */
function addressIsValid(addr) {
    return addr.length >= 2;
}

/**
 * Checks whether the given name is at least 2 characters long.
 * @param {*} addr name, String
 * @returns true if name is valid, else false
 */
function nameIsValid(name) {
    return name.length >= 2;
}

/**
 * Sets the given widget as neither valid nor invalid, 
 * for the purposes of Bootstrap visual display.
 * @param {*} widget type: HTMLObjectElement
 */
function clearValidity(widget) {
    widget.setCustomValidity(''); // :valid
    widget.classList.remove("is-invalid");
    widget.classList.remove("is-valid");
}

/**
 * Checks whether the given widget has valid input using the given validator function, 
 * then sets the Bootstrap UI to valid or invalid accordingly.
 * @param {*} widget type: HTMLObjectElement
 * @param {*} validator String -> boolean function that checks whether a widget's value (text input) is valid
 * @returns true if widget's input is valid, else false
 */
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

/**
 * Checks if the email inputted to the form is valid
 * and updates the Bootstrap UI accordingly.
 * @returns true if valid, else false
 */
function checkEmail() {
    return checkWidget(emailWidget, emailIsValid);
}

/**
 * Checks if the (optional) phone number inputted to the form is valid
 * and updates the Bootstrap UI accordingly.
 * @returns true if valid, else false
 */
function checkPhoneNumber() {
    return checkWidget(phoneWidget, phoneNumberIsValid);
}

/**
 * Checks if the age inputted to the form is valid
 * and updates the Bootstrap UI accordingly.
 * @returns true if valid, else false
 */
function checkAge() {
    return checkWidget(ageWidget, ageIsValid);
}

/**
 * Checks if the address/affiliation inputted to the form is valid
 * and updates the Bootstrap UI accordingly.
 * @returns true if valid, else false
 */
function checkAddressOrAffiliation() {
    return checkWidget(addressWidget, addressIsValid);
}

/**
 * Checks if the full name inputted to the form is valid
 * and updates the Bootstrap UI accordingly.
 * @returns true if valid, else false
 */
function checkFullName() {
    return checkWidget(nameWidget, nameIsValid);
}

/**
 * Checks if the submitted signup form is valid
 * and updates the Bootstrap UI accordingly.
 */
function checkForm(event) {
    if (!checkEmail() || !checkPhoneNumber() || !checkAge() || !checkAddressOrAffiliation() || !checkFullName()) {
        signupForm.classList.add('was-validated');
        event.preventDefault();
    }
}

/**
 * Click handler for "Clear" button. Resets the form to default.
 */
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