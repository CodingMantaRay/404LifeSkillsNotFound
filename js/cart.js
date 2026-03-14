// Global variables
let $productForm, $productId, $productDesc, $category, $unit, $price, $weight, $color, $details;
let $cartTable;
let categories, units;
let formWidgets, formItems;

// -----------------------------------------------------------------------------------------------
// Utility functions:                                                                            |
// -----------------------------------------------------------------------------------------------

function getError($widget) {
    return $widget.hasClass("is-invalid");
}

function setError($widget, isError) {
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
            // Add "option" text to categories
            options.push($option.text());
        }
    }
    return options; 
}

function checkEmpty($widget) {
    let isError = ($widget.val().trim() == "");
    setError($widget, isError);
    return isError;
}

function checkOption($widget, options) {
    let isError = isValidOption($widget.val().trim(), options);
    setError($widget, isError);
    return isError;
}

function isValidOption(chosenOption, options) {
    return chosenOption == "" || options.indexOf(chosenOption) == -1
}

/**
 * Gets the given collection (a JSON array) from local storage.
 * If collection not found (i.e. item with key == collectionName not found 
 * in local storage), then returns undefined.
 * 
 * @param {string} collectionName - name (key) of collection to get from storage
 * @returns Array of objects converted from JSON, or undefined
 */
function getItems(collectionName) {
    let json = localStorage.getItem(collectionName);
    let items;
    if (json == null) {
        return undefined;
    }
    items = JSON.parse(json);
    if (!Array.isArray(items))
        throw new Error(`localStorage item ${collectionName} is not an array`);
    return items;
}

/**
 * Adds new item to local storage.
 * If an item with the same ID already exists, does NOT add item.
 * 
 * @param {string} collectionName - name of collection to store item in
 * @param {object} item - object with a unique "id" property
 * @returns true if item was added successfully, else false
 */
function addItem(collectionName, item) {
    let items = getItems(collectionName);
    if (items == undefined)
        items = [item];
    else {
        for (let i of items) {
            if (i.id == item.id)
                // Don't add item with duplicate ID
                return false;
        }
        items.push(item);
    }
    localStorage.setItem(collectionName, JSON.stringify(items));
    return true;
}

/**
 * Updates the item with the given ID in the given collection.
 * 
 * Note: If itemId and newItem.id differ, the existing item 
 * with id equal to itemId is removed and replaced with newItem,
 * UNLESS another item with newItem.id exists (in which case
 * nothing is updated).
 * 
 * @param {string} collectionName - name of collection to store item in
 * @param {string} itemId - id of object to update
 * @param {object} newItem - object with updated properties, including a unique "id" property
 * @param {function} verifyItem - function with one param that verifies the properties of newItem
 * @returns true if item was added successfully, else false
 */
function updateItem(collectionName, itemId, newItem, verifyItem = (item) => true) {
    // Verify newItem parameter
    if (!verifyItem(newItem))
        throw new Error("New item missing a required property");
    
    let items = getItems(collectionName);
    if (items == undefined) {
        // No saved items - create new item list
        items = [newItem];
    } else {
        let idChanged = (itemId != newItem.id);
        // Find an existing item with the given id (itemId parameter)
        let itemIndex = null;
        for (let i = 0; i < items.length; i++) {
            // Case 1: idChanged false. Assumes only ONE item with given ID, returns first one.
            // Case 2: idChanged true, no items with newItem.id. Update & return true.
            // Case 3: idChanged true, item with newItem.id exists. Return false.
            if (items[i].id == itemId) {
                itemIndex = i;
                if (!idChanged)
                    break;
            } if (idChanged && items[i].id == newItem.id) {
                // Item with given ID already exists and we are not updating it
                return false;
            }
        }
        if (itemIndex != null) {
            // If item exists, modify it
            items[itemIndex] = newItem;
        } else {
            // If item doesn't exist, add it
            items.push(newItem);
        }
    }

    localStorage.setItem(collectionName, JSON.stringify(items));
    return true;
}

function deleteItem(collectionName, itemId) {
    // Get items from the given collection
    let items = getItems(collectionName);
    if (items == undefined) {
        // No saved collection
        return;
    }
    
    // Delete all items with the given id (itemId parameter)
    let numItems = items.length;
    items = items.filter(function (a) {
        return a.id != itemId;
    });
    if (items.length < numItems) {
        localStorage.setItem(collectionName, JSON.stringify(items));
    }
}

function filterItems(collectionName, searchId, filterId, matchesSearchFunc) {
    let allItems = getItems(collectionName);
    if (!allItems)
        return;
    let searchText = $(`#${searchId}`).val() ? $(`#${searchId}`).val().toLowerCase() : "";
    let filterCat = $(`#${filterId}`).val() || "All";

    let loadedItems = [];
    for (let item of allItems) {
        let matchesSearch = matchesSearchFunc(item, searchText);
        let matchesCategory = (filterCat === "All" || item.category === filterCat);
        if (matchesSearch && matchesCategory) {
            loadedItems.push(item);
        }
    }

    return loadedItems;
}

// -----------------------------------------------------------------------------------------------

function checkPosNum($widget) {
    let number = parseFloat($widget.val().trim());
    let isError = (isNaN(number) || number < 0);
    setError($widget, isError);
    return isError;
}

/**
 * Gets the product from the "Add Product" form.
 * If form is invalid, returns null.
 *  
 * @returns "Product" object, or null
 */
function checkForm() {
    let product = {};
    let isError = false;

    // Check product ID
    for (let i = 0; i < formItems.length; i++) {
        let prop = formItems[i];
        let $widget = formWidgets[i];

        if (prop == "category") {
            if (checkOption($widget, categories))
                isError = true;
        } else if (prop == "unit") {
            if (checkOption($widget, units))
                isError = true;
        } else if (prop == "price") {
            if (checkPosNum($widget))
                isError = true;
        } else {
            if (checkEmpty($widget))
                isError = true;
        }
        
        if (!isError)
            product[prop] = $widget.val().trim();
    }

    if (isError)
        return null;
    return product;
}

/**
 * Clears the form.
 */
function clearForm() {
    for (let $widget of formWidgets) {
        setError($widget, false);
        $widget.val("");
    }
}

/**
 * Handler for submitting the "Add Product" form.
 */
function onSave(event) {
    event.preventDefault();

    let product = checkForm();
    if (!product)
        return;

    addItem("products", product);
    clearForm();
    loadProducts();
}

function loadCart() {
    // Get products from localStorage
    let productsArr = getItems("products");
    if (!productsArr)
        return;
    // Create map out of products to make it easier to search by ID
    const products = new Map(productsArr.map((o) => [o.id, o]));

    // Get cart (list of IDs) from localStorage
    const cartIds = JSON.parse(localStorage.getItem("cart"));
    if (!Array.isArray(cartIds))
        return;
    // Get product objects from cart
    const cart = new Array(cartIds.map((o) => products.get(o)));

    // Add cart to HTML table
    let html = "";
    for (let c of cart[0]) {
        html += cartItemHtml(c);
    }
    $cartTable.html(html);

    setCartTotal();
}

function cartItemHtml(product) {
    return `
        <tr>
            <td>${product.id}</td>
            <td>${product.description}</td>
            <td>${product.category}</td>
            <td>$${parseFloat(product.price).toFixed(2)}</td>
            <td class="text-end">
            <button class="btn btn-sm btn-outline-danger" data-id="${product.id}">Remove</button>
            </td>
        </tr>`;
}

function onAddToCart() {
    let productId = $(this).attr("data-id"); // TODO

    // Get product
    let products = getItems("products");
    if (!products)
        return;
    let product = null;
    for (let p of products) {
        if (p.id == productId) {
            product = p;
            break;
        }  
    }
    if (!product)
        return;

    // Add product to cart in localStorage
    let cart = JSON.parse(localStorage.getItem("cart"));
    if (!Array.isArray(cart))
        cart = [];
    cart.push(productId); // Only add ID
    localStorage.setItem("cart", JSON.stringify(cart));

    // Add product to HTML table
    $cartTable.html($cartTable.html() + cartItemHtml(product));

    setCartTotal();
}

function setCartTotal() {
    // TODO
}

function loadProducts() {
    let products = getItems("products");
    if (!products)
        return;

    // let products = filterItems("contentSearch", "filterCategory", (product, searchText) => {product.title.toLowerCase().includes(searchText) || product.id.toLowerCase().includes(searchText)})

    let html = "";
    for (let product of products) {
        html += `<div class="col-md-6">
            <div class="entry-card border rounded p-3 bg-white h-100" style="border-left: 3px solid brown;">
                <div class="d-flex justify-content-between align-items-start gap-2">
                    <div>
                        <div class="fw-bold">${product.id}</div>
                        <div class="mt-1 d-flex flex-wrap gap-1">
                        <span class="badge text-bg-brown">${product.category}</span>
                        <span class="badge text-bg-brown-light">${product.unit}</span>
                        </div>
                    </div>
                    <button type="button" class="btn btn-sm btn-brown addToCartBtn" data-id="${product.id}">Add to Cart</button>
                </div>
                <div class="mt-2 fw-semibold">${product.description}</div>
                <div class="text-muted small mt-2">$${parseFloat(product.price).toFixed(2)}</div>
            </div>
        </div>\n`;
    }
    let $productCards = $("#productCards");
    $productCards.html(html);

    $productCards.find(".addToCartBtn").on("click", onAddToCart);
}

$(document).ready(function() {
    if (!localStorage.getItem("products")) {
        const initialData = [
            {id: "HS101", description: "Kitchen Reset Guide", category: "Kitchen Resources", unit: "Download", price: 12.99, weight: "", color: "", notes: ""},
            {id: "HS102", description: "Closet Refresh Bundle", category: "Home Organization", unit: "Bundle", price: 15.99, weight: "", color: "", notes: ""},
            {id: "HS103", description: "Weekly Home Planner Pack", category: "Printable Planners", unit: "Pack", price: 8.99, weight: "", color: "", notes: ""}
        ];
        localStorage.setItem("products", JSON.stringify(initialData));
    }
    if (!localStorage.getItem("cart")) {
        const cart = ["HS102", "HS103"];
        localStorage.setItem("cart", JSON.stringify(cart));
    }

    $productForm = $("#productForm");
    $productId = $($productForm.find("#productId")[0]);
    $productDesc = $($productForm.find("#description")[0]);
    $category = $($productForm.find("#category")[0]);
    $unit = $($productForm.find("#unit")[0]);
    $price = $($productForm.find("#price")[0]);
    $weight = $($productForm.find("#weight")[0]);
    $color = $($productForm.find("#color")[0]);
    $details = $($productForm.find("#details")[0]);

    categories = loadOptions($category);
    units = loadOptions($unit);

    formWidgets = [$productId, $productDesc, $category, $unit,
        $price, $weight, $color, $details];
    formItems = ["id", "description", "category", "unit",
    "price", "weight", "color", "details"];

    $productForm.on("submit", onSave);
    $productId.on("keyup", () => checkEmpty($(this)));
    $productDesc.on("keyup", () => checkEmpty($(this)));
    $category.on("change", () => checkOption($(this), categories));
    $unit.on("change", () => checkOption($(this), units));
    $price.on("keyup", () => checkEmpty($(this)));
    // Not checking "Weight", "Color", or "Additional Details"
   
    // $("#contentSearch, #filterCategory").on("keyup change", function () {
    //     loadItems();
    // });

    $cartTable = $("#cartTableBody");

    loadProducts();
    loadCart();
});