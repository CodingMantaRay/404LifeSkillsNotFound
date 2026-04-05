// Global variables
let $productName, $price, $reason, $condition, $notes;
let $returnForm, $purchaseCards;
let reasons, categories;

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

/**
 * Gets the given collection (a JSON array) from local storage.
 * If collection not found (i.e. item with key == collectionName not found 
 * in local storage), then returns undefined.
 * 
 * @param {string} collectionName - name (key) of collection to get from storage
 * @returns Array of objects converted from JSON, or undefined
 */
function getItems(collectionName, defaultValue = undefined) {
    let json = localStorage.getItem(collectionName);
    let items;
    if (json == null) {
        return defaultValue;
    }
    items = JSON.parse(json);
    if (!Array.isArray(items))
        throw new Error(`localStorage item ${collectionName} is not an array`);
    return items;
}

/**
 * Updates the item with the given ID in the given collection.
 * 
 * Note: Item must have property "id"
 * 
 * Example verifyItem function:
 *  (article) => ("id" in article && "title" in article && "category" in article 
            && "format" in article && "value" in article && "notes" in article)
 * 
 * @param {string} collectionName - name of collection to store item in
 * @param {object} newItem - object with updated properties, including a unique "id" property
 * @param {function} verifyItem - function with one param that verifies the properties of newItem
 * @returns true if item was added successfully, else false
 */
function updateItem(collectionName, newItem, verifyItem = (item) => true) {
    // Verify newItem parameter
    if (!("id" in newItem) || !verifyItem(newItem))
        throw new Error("New item missing a required property");

    let items = getItems(collectionName);
    if (items == undefined) {
        // No saved items - create new item list
        items = [newItem];
    } else {
        // Find an existing item with the given id
        let itemExists = false;
        for (let i = 0; i < items.length; i++) {
            if (items[i].id == newItem.id) {
                // If item exists, modify it
                items[i] = newItem;
                itemExists = true;
                break;
            }
        }
        if (!itemExists) {
            // If item doesn't exist, add it
            items.push(newItem);
        }
    }

    localStorage.setItem(collectionName, JSON.stringify(items));
    return true;
}

function checkEmpty($widget) {
    const value = $widget.val().trim();
    const isError = (value == "");
    setError($widget, isError);
    return [value, isError];
}

function checkOption($widget, options) {
    const value = $widget.val().trim();
    const isError = (value == "" || options.indexOf(value) == -1);
    setError($widget, isError);
    return [value, isError];
}

// --------------------------------------------------------------------------

function checkPrice($widget) {
    const value = parseFloat($widget.val().trim());
    const isError = isNaN(value) || value < 0;
    setError($widget, isError);
    return [value, isError];
}

/**
 * Checks form inputs for validity, and updates UI with any errors.
 * @returns "ArticleInfo" object
 */
function checkForm() {
    let returnReq = {};
    let isError, formIsValid = true;

    [returnReq.productName, isError] = checkEmpty($productName);
    if (isError)
        formIsValid = false;

    [returnReq.price, isError] = checkPrice($price);
    if (isError)
        formIsValid = false;

    [returnReq.reason, isError] = checkOption($reason, reasons);
    if (isError)
        formIsValid = false;

    [returnReq.condition, isError] = checkOption($condition, conditions);
    if (isError)
        formIsValid = false;

    // Add notes (no checking)
    returnReq.notes = $notes.val().trim();

    if (formIsValid) {
        return returnReq;
    }
    return null;
}

/**
 * Clears the form.
 */
function clearForm() {
    setError($productName, false);
    $productName.val("");
    setError($price, false);
    $price.val("");
    setError($reason, false);
    $reason.val("");
    setError($condition, false);
    $condition.val("");
    $notes.val("");
}

function loadPurchases() {
    let purchases = getItems("purchases");
    if (purchases == undefined)
        return;

    const searchTerm = $("#returnSearch").val().trim().toLowerCase();
    const typeFilter = $("#returnFilter").val();
    // TODO fix return filter

    let html = "";
    for (let product of purchases) {
        const matchesSearch = product.description.toLowerCase().includes(searchTerm);
        const matchesFilter = (typeFilter === "All" || product.unit.includes(typeFilter.splice(typeFilter.length - 2)));
        if (matchesSearch && matchesFilter) {
            // TODO change "Guides" to actual category
            html += `<div class="col-md-6">
                        <div class="entry-card border rounded p-3 bg-white h-100" style="border-left: 3px solid brown;">
                           <div class="d-flex justify-content-between align-items-start gap-2">
                              <div>
                                 <div class="fw-bold">${product.description}</div>
                                 <div class="mt-1 d-flex flex-wrap gap-1">
                                    <span class="badge text-bg-brown">Guides</span>
                                    <span class="badge text-bg-brown-light">${product.unit}</span>
                                 </div>
                              </div>
                              <button type="button" class="btn btn-sm btn-brown selectBtn" data-id="${product.id}">Select</button>
                           </div>
                           <div class="text-muted small mt-2">$${parseInt(product.price).toFixed(2)}</div>
                        </div>
                     </div>`;
        }
    }

    $purchaseCards.html(html);
    $purchaseCards.find(".selectBtn").on("click", onSelect);
}

/**
 * Handler for submitting the form
 */
function onSubmit(event) {
    event.preventDefault();

    let returnReq = checkForm();
    if (!returnReq) return;

    returnReq.status = "Pending";

    const jsonString = JSON.stringify(returnReq, null, 2);
    $("#returnJsonPreview").text(jsonString);
    // TODO - React transmission
    //transmitWithReact(returnReq);

    // TODO - add returnReq to database

    clearForm();
    loadPurchases();
}

/**
 * Handler for "Use Idea" button.
 */
function onSelect() {
    // Get ID of article to edit
    let id = $(this).attr("data-id");
    if (!id)
        return;

    // Clear form
    // TODO warning??
    clearForm();

    // Get product
    const purchasesWithId = getItems("purchases", []).filter((item) => item.id == id);
    const purchasedProduct = purchasesWithId.length > 0 ? purchasesWithId[0] : null;
    if (!purchasedProduct)
        return;

    $productName.val(purchasedProduct.description);
    $price.val(purchasedProduct.price);

    updatePreview();
}

function updatePreview() {
    const formData = {
        productName: $productName.val().trim(),
        price: $price.val().trim(),
        reason: $reason.val().trim(),
        condition: $condition.val().trim(),
        notes: $notes.val().trim(),
        status: "Pending"
    };
    // TODO
    /*const jsonString = JSON.stringify(formData, null, 2);
    $("#returnJsonPreview").text(jsonString);*/

    $("#previewName").text(formData.productName || "--");
    $("#previewPrice").text(formData.price || "--");
    $("#previewReason").text(formData.reason || "--");
    $("#previewCondition").text(formData.condition || "--");
};


$(document).ready(function () {
    $returnForm = $("#returnForm");
    $productName = $($returnForm.find("#productName")[0]);
    $price = $($returnForm.find("#productPrice")[0]);
    $reason = $($returnForm.find("#returnReason")[0]);
    $condition = $($returnForm.find("#productCondition")[0]);
    $notes = $($returnForm.find("#returnNotes")[0]);

    $purchaseCards = $("#returnProductCards");

    reasons = loadOptions($reason);
    conditions = loadOptions($condition);

    $productName.on("keyup", () => { checkEmpty($productName); updatePreview(); });
    $price.on("keyup", () => { checkPrice($price); updatePreview(); });
    $reason.on("change", () => { checkOption($reason, reasons); updatePreview(); });
    $condition.on("change", () => { checkOption($condition, conditions); updatePreview(); });
    $notes.on("keyup", updatePreview);

    $returnForm.on("submit", onSubmit);
    $returnForm.on("reset", clearForm);

    $("#returnSearch, #returnFilter").on("keyup change", function () {
        loadPurchases();
        updatePreview();
    });

    loadPurchases();
    updatePreview();
    $("#returnJsonPreview").text("");
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