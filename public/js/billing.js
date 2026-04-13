// Global variables
const form = {
    $fullName: null,
    $address: null,
    $city: null,
    $state: null,
    $zip: null,
    $creditCardNum: null,
    $expDate: null,
    $secCode: null,
    $shippingDetails: null
};
const validate = new Map();
let $billingForm;
 let currentCart = [];

//-----------------------------------------------------
// Utility Functions                                  |
// ----------------------------------------------------

function setError($widget, isError, errorMessage = null) {
    // Set error message
    if (errorMessage) {
        const $errorMessage = $widget.parent().find("div.invalid-feedback");
        if ($errorMessage.length > 0)
            $errorMessage.text(errorMessage);
    }
    // Display error
    if (isError) {
        $widget.addClass("is-invalid"); // .is-invalid
    } else {
        $widget.removeClass("is-invalid"); // .is-valid
    }
}

function loadOptions($select) {
    let options = [];
    // Loop through "option" children of $select
    for (let option of $select.children("option")) {
        let $option = $(option);
        // Don't include options with value "" (i.e. placeholder options)
        if ($option.attr("value") != "") {
            // Add "option" text to list
            options.push($option.text());
        }
    }
    return options;
}

function checkEmpty($widget) {
    const value = $widget.val().trim();
    const isError = (value == "");
    setError($widget, isError);
    return [value, isError];
}

function checkOptionOrBlank($widget, options) {
    const value = $widget.val().trim();
    const isError = (value != "" && options.indexOf(value) == -1);
    setError($widget, isError);
    return [value, isError];
}

function check($widget, isValid) {
    const value = $widget.val().trim();
    const errorStatus = !isValid(value);
    setError($widget, errorStatus);
    return [value, errorStatus];
}

// --------------------------------------------------------------------------

// TODO
function isUSState(value) {
    const states = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL",
        "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA",
        "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC",
        "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT",
        "VT", "VA", "WA", "WV", "WI", "WY"
    ];
    return states.includes(value.toUpperCase());
} 

validate.set(form.$state, {func: ()=>check(form.$state, isUSState), event: "keyup"});


function isZip(value) {
    const re = /^\d\d\d\d\d$/;
    return re.test(value);
}

function isCCNum(value) {
    value = value.replace(/\s/g, "");
    const re = /^\d\d\d\d\d\d\d\d\d\d\d\d\d\d\d\d$/;
    return re.test(value);
}

function isExpDate(value) {
    const re = /^(\d\d)\/(\d\d)$/;
    const matches = value.match(re);
    return matches && matches.length == 3 && matches[1] <= "12" && matches[1] >= "01";
}

function isSecCode(value) {
    const re = /^\d\d\d$/;
    return re.test(value);
}

/**
 * Checks form inputs for validity, and updates UI with any errors.
 * @returns "BillingInfo" object
 */
function checkForm() {
    let billingInfo = {};
    let $widget, isError, formIsValid = true;

    // Check: name, address, city, state, zip, credit card num, exp date, sec code, shipping details

    $widget = form.$fullName;
    [billingInfo.fullName, isError] = (validate.get($widget).func)($widget);
    if (isError)
        formIsValid = false;

    $widget = form.$address;
    [billingInfo.address, isError] = (validate.get($widget).func)($widget);
    if (isError)
        formIsValid = false;

    $widget = form.$city;
    [billingInfo.city, isError] = (validate.get($widget).func)($widget);
    if (isError)
        formIsValid = false;

    $widget = form.$state;
    [billingInfo.state, isError] = (validate.get($widget).func)($widget);
    if (isError)
        formIsValid = false;

    $widget = form.$zip;
    [billingInfo.zip, isError] = (validate.get($widget).func)($widget);
    if (isError)
        formIsValid = false;

    $widget = form.$creditCardNum;
    [billingInfo.creditCardNum, isError] = (validate.get($widget).func)($widget);
    if (isError)
        formIsValid = false;

    $widget = form.$expDate;
    [billingInfo.expDate, isError] = (validate.get($widget).func)($widget);
    if (isError)
        formIsValid = false;

    $widget = form.$secCode;
    [billingInfo.secCode, isError] = (validate.get($widget).func)($widget);
    if (isError)
        formIsValid = false;

    $widget = form.$shippingDetails;
    [billingInfo.shippingDetails, isError] = (validate.get($widget).func)($widget);
    if (isError)
        formIsValid = false;

    if (formIsValid) {
        return billingInfo;
    }
    return null;
}

/**
 * Clears the form.
 */
function clearForm() {
    for (let widgetName in form) {
        const $widget = form[widgetName];
        setError($widget, false);
        $widget.val("");
    }

    // Clear JSON preview
    $("#billingJsonPreview").text("");
}

function loadCart() {
 

    const sessionId = localStorage.getItem("sessionId");

    console.log("SESSION ID:", sessionId);

    if (!sessionId) {
        console.error("Missing sessionId");
        $("#cartItems").html("<div class='text-danger'>No session found.</div>");
        return;
    }

    $.ajax({
        url: "/api/cart",
        method: "GET",
        data: { sessionId },

        success: function(response) {

            console.log("RAW CART RESPONSE:", response);

            const cart = Array.isArray(response)
                ? response
                : (response.cart || response.items || []);

            const $cart = $("#cartItems");
            let html = "";
            let subtotal = 0;

            if (cart.length === 0) {
                $cart.html("<div class='text-muted'>Your cart is empty.</div>");
                $("#statItems").text("0");
                $("#statTotal").text("$0.00");
                return;
            }

            currentCart = cart;

            cart.forEach(item => {

                const price = Number(item.price ?? item.unitPrice ?? 0);
                const quantity = Number(item.quantity ?? 1);
                const description = item.description ?? item.name ?? "Item";
                const unit = item.unit ?? "";

                subtotal += price * quantity;

                html += `
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <div class="fw-semibold">${description} (x${quantity})</div>
                        <div class="small text-muted">${unit}</div>
                    </div>
                    <div class="fw-semibold">$${(price * quantity).toFixed(2)}</div>
                </div>`;
            });

            $cart.html(html);

            $("#statItems").text(cart.length);
            $("#statTotal").text("$" + subtotal.toFixed(2));
        },

        error: function(xhr) {
            console.error(xhr);
            $("#cartItems").html("<div class='text-danger'>Cart failed to load.</div>");
        }
    });
}

/**
 * Handler for submitting the form
 */
function onCompletePayment(event) {
    event.preventDefault();

    let billingInfo = checkForm();
    if (!billingInfo) return;

    billingInfo.purchaseId = sessionStorage.getItem("lastPurchaseId");
    if (!billingInfo.purchaseId) {
        alert("Error: No purchase ID found. Please try again.");
        return;
    }
    billingInfo.sessionId = localStorage.getItem("sessionId");
    billingInfo.email = "student.example@university.edu";
    billingInfo.totalAmount = parseFloat($("#total").text().replace("$", ""));

    const jsonString = JSON.stringify(billingInfo, null, 2);
    $("#billingJsonPreview").text(jsonString);
    
    let purchaseId = null;
    $.ajax({
        url: '/api/purchase',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ sessionId: localStorage.getItem("sessionId") }),
        success: function (response) {
            // Save purchaseId
            billingInfo.purchaseId = response.purchaseId;

            // Send billing info
            $.ajax({
                url: '/api/billing',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(billingInfo),
                success: function (response) {

                    const purchase = {
                        billingId: response.billingId,
                        sessionId: billingInfo.sessionId,
                        items: $("#cartItems").data() || [],
                        total: billingInfo.totalAmount
                    };

                    sessionStorage.setItem("lastPurchase", JSON.stringify(purchase));
                    $("#paymentStatus")

                        .removeClass("alert-brown")
                        .addClass("alert-success")
                        .html(`<i class="bi bi-check-circle"></i> Success! Order ID: ${response.billingId}`);

                    localStorage.setItem("cart", JSON.stringify([]));
                    loadCart();

                    setTimeout(() => {
                        window.location.href = "finalizationpage.html";
                    }, 3000);
                },
                error: function (xhr) {
                    $("#paymentStatus")
                        .removeClass("alert-brown")
                        .addClass("alert-danger")
                        .text("Payment failed. Please try again.");
                }
            });
        },
        error: function (xhr) {
            $("#paymentStatus")
            .removeClass("alert-brown")
            .addClass("alert-danger")
            .text("Purchase failed. Please try again."); }
    });
}


$(document).ready(function () {
    // TODO remove
    // if (!localStorage.getItem("products")) {
    //     const initialData = [
    //         {id: "HS101", description: "Kitchen Reset Guide", category: "Kitchen Resources", unit: "Download", price: 12.99, weight: "", color: "", details: ""},
    //         {id: "HS102", description: "Closet Refresh Bundle", category: "Home Organization", unit: "Bundle", price: 15.99, weight: "", color: "", details: ""},
    //         {id: "HS103", description: "Weekly Home Planner Pack", category: "Printable Planners", unit: "Pack", price: 8.99, weight: "", color: "", details: ""}
    //     ];
    //     localStorage.setItem("products", JSON.stringify(initialData));
    // }
    // TODO remove
    // if (!localStorage.getItem("cart")) {
    //     const initialData = ["HS101", "HS102"];
    //     localStorage.setItem("cart", JSON.stringify(initialData));
    // }
let sessionId = localStorage.getItem("sessionId");

if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("sessionId", sessionId);

}
    $billingForm = $("#billingForm");
    form.$fullName = $($billingForm.find("#fullName")[0]); 
    form.$address = $($billingForm.find("#address")[0]); 
    form.$city = $($billingForm.find("#city")[0]); 
    form.$state = $($billingForm.find("#state")[0]); 
    form.$zip = $($billingForm.find("#zipCode")[0]); 
    form.$creditCardNum = $($billingForm.find("#cardNumber")[0]); 
    form.$expDate = $($billingForm.find("#expirationDate")[0]); 
    form.$secCode = $($billingForm.find("#securityCode")[0]); 
    form.$shippingDetails = $($billingForm.find("#shippingDetails")[0]); 

    const shippingOptions = loadOptions(form.$shippingDetails);
    shippingOptions.push("");

    // Set function to check/validate each form field
    validate.set(form.$fullName, {func: ()=>checkEmpty(form.$fullName), event: "keyup"});
    validate.set(form.$address, {func: ()=>checkEmpty(form.$address), event: "keyup"});
    validate.set(form.$city, {func: ()=>checkEmpty(form.$city), event: "keyup"});
    validate.set(form.$state, {func: ()=>checkEmpty(form.$state), event: "keyup"});
    validate.set(form.$zip, {func: ()=>check(form.$zip, isZip), event: "keyup"});
    validate.set(form.$creditCardNum, {func: ()=>check(form.$creditCardNum, isCCNum), event: "keyup"});
    validate.set(form.$expDate, {func: ()=>check(form.$expDate, isExpDate), event: "keyup"});
    validate.set(form.$secCode, {func: ()=>check(form.$secCode, isSecCode), event: "keyup"});
    validate.set(form.$shippingDetails, 
        {func: ()=>checkOptionOrBlank(form.$shippingDetails, shippingOptions), event: "change keyup"});

    for (let widgetName in form) {
        $widget = form[widgetName]
        const chk = validate.get($widget);
        $widget.on(chk.event, chk.func);
    }

    $billingForm.on("submit", onCompletePayment);
    $("#clearForm").on("click", clearForm);

    $("#billingJsonPreview").val("");

    loadCart();
});

/*
// From week 9 "finalize.js" 
function transmitWithReact(pubOptions) {
    const root = ReactDOM.createRoot(document.getElementById('apiStatus'));

    const DataTransport = () => {
        const [status, setstatus] = React.useState("Preparing AJAX transport");

        React.useEffect(() => {
            const sendData = async () => {
                try {
                    const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
                        method: 'POST',
                        body: JSON.stringify(pubOptions),
                        headers: { 'Content-Type': 'application/json' }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        setstatus(`Success! REST API assigned ID: ${data.id}`);
                    }
                } catch (err) {
                    setstatus("AJAX Transport Failed.");
                }
            };
            sendData();
        }, []);

        return (
            <div className="alert alert-success mb-0">
                <i className="bi bi-check-circle-fill me-2"></i>
                <strong>React Status:</strong> {status}
            </div>
        );
    };
    root.render(<DataTransport />);
}
*/