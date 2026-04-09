const e = require("express");

// Global variables
let $productForm, $productId, $productDesc, $category, $unit, $price, $weight, $color, $details;
let $cartTable;
let categories, units;
let formWidgets, formItems;
const sessionId = localStorage.getItem("cart_session") || (Math.random().toString(36).substring(2) + Date.now().toString(36));
localStorage.setItem("cart_session", sessionId);

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
        } else if (prop == "weight" || prop == "color" || prop == "details") {
            setError($widget, false); // Not required fields, so no error
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

    $.ajax({
        url: '/api/products',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(product),
        success: function() {
            clearForm();
            loadProducts();
            alert("Product added successfully!");
        }
    });

   
}

function loadCart() {
    $.ajax({
        url: `/api/cart/${sessionId}`,
        type: 'GET',
        success: function(cartItems) {
            $cartTable.empty();
            setCartTotal(cartItems);

            if (!cartItems || cartItems.length === 0) {
                $cartTable.append('<tr><td colspan="5" class="text-center text-muted">Your cart is empty.</td></tr>');
            } else {
                cartItems.forEach(item => {
                    
                        const price = parseFloat(item.price) || 0;
                        const quantity = parseInt(item.quantity) || 0;
                        const itemTotal = price * quantity;
                        total += itemTotal;


                    $cartTable.append(`<tr>
                        <td>${item.productId}</td>
                        <td>${item.description}</td>
                        <td>${item.quantity}</td>
                        <td>$${item.price * item.quantity}</td>
                        <td class="text-end">
                            <button class="btn btn-sm btn-outline-danger removeCartBtn" data-id="${item.productId}">Remove</button>
                        </td>
                    </tr>`);
                });
                    }
                    $("#cartTotal").text(`$${total.toFixed(2)}`);
                    $(".stat-items-count").text(cartItems.length);
                    $($cartTable.find(".removeCartBtn").on("click", onRemoveFromCart));
                }
            });
        }
       
function onRemoveFromCart() {
    const productId = $(this).data("id");
    $.ajax({
        url: `/api/cart${sessionId}/product/${productId}`,
        type: 'DELETE',
        success: function() {
            loadCart();

        },
        error: function() {
            alert("Error removing product from cart. Please try again.");
        }
    });
}

function cartItemHtml(product) {
    return `
        <tr>
            <td>${product.id}</td>
            <td>${product.description}</td>
            <td>${product.category}</td>
            <td>$${parseFloat(product.price).toFixed(2)}</td>
            <td class="text-end">
            <button class="btn btn-sm btn-outline-danger removeCartBtn" data-id="${product.id}">Remove</button>
            </td>
        </tr>`;
}

function onAddToCart() {
   const productId = $(this).data("id");
    // Replace with actual session ID management

    $.ajax({
        url: `/api/cart?sessionId=${sessionId}&productId=${productId}&quantity=1`,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ sessionId, productId, quantity: 1 }),
       
        
        success: function() {
           console.log(`Added product ${productId} to cart for session ${sessionId}`);
            loadCart();
            

            },
            error: function() {
                alert("Error adding product to cart. Please try again.");
        }
   });
}

function setCartTotal(cartItems) {
    
        if (!cartItems) return;
       let total = 0;
       let totalProducts = 0;
       const uniqueProductIds = new Set();
       
       

        cartItems.forEach(item => {
            const price = parseFloat(item.price) || 0;
            const quantity = parseInt(item.quantity) || 0;
            total += price * quantity;
            totalProducts += quantity;
            uniqueProductIds.add(item.productId);
        });

    $("#cartTotal").text(`$${total.toFixed(2)}`);

    
    $(".stat-items-count").text(totalProducts);
    $("#productCount").text(`${cartItems.length} unique products`);
    $("#totalProductsCount").text(uniqueProductIds.size);
    

    

    const uniqueCartIds = [...new Set(productsArr.map(p => p.id).filter(id => cartIds.includes(id)))];
    
}

function loadProducts() {
    $.ajax({
        url: '/api/products',
        type: 'GET',
        success: function(products) {
            let html = "";
            for (let product of products) {
                html += `
                <div class="col-md-6 col-md-6 mb-3">
                    <div class="entry-card border rounded p-3 bg-white h-100" style="border-left: 3px solid brown;">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <div class="fw-bold">${product.description}</div>
                            <div class="mt-1">
                            <span class="bade text-bg-brown">${product.category}</span>
                            <span class="badge text-bg-brown-light">${product.unit}</span>
                            </div>
                        </div>
                        <button type="button" class="btn btn-sm btn-brown addToCartBtn" data-id="${product.id}">Add to Cart</button>
                        </div>
                        <div class="mt-2 fw-semibold">${product.description}</div>
                        <div class="text-muted small mt-1">$${parseFloat(product.price).toFixed(2)}</div>
                    </div>
                </div>`;
            }
            $("#productCards").html(html);
            $(".addToCartBtn").on("click", onAddToCart);
            $("#productCount").text(products.length);
            $("#jsonPreview").text(JSON.stringify(products, null, 2));

        },
        error: function() {
            $("#productCards").html('<div class="alert alert-danger">Error loading products.</div>');
        }
    });
}

$(document).ready(function() {
    
    
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

    

    $productId.on("keyup", function() { checkEmpty($(this)); });
    $productDesc.on("keyup", function() { checkEmpty($(this)); });
    $category.on("change", function() { checkOption($(this), categories); });
    $unit.on("change", function() { checkOption($(this), units); });
    $price.on("keyup", function() { checkEmpty($(this)); });
    // Not checking "Weight", "Color", or "Additional Details"
   
    $productForm.on("submit", onSave);     

    $("#searchInput").on("keyup", function() {
        const searchTerm = $(this).val().toLowerCase();
        $("#productCards .col-md-6").filter(function() {
            const cardText = $(this).text().toLowerCase();
            $(this).toggle(cardText.indexOf(searchTerm) > -1);
        });
    });

    $("#clearCartBtn").on("click", function() {
        localStorage.removeItem("cart");
        loadCart();
    });

    $("#checkoutBtn").on("click", function() {
       const checkoutData = {
        sessionId: localStorage.getItem("cart_session"),
       };

       
        $.ajax({
            url: '/api/purchase',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(checkoutData),
            success: function(response) {
                if (response.purchaseId) {
                    sessionStorage.setItem("lastPurchaseId", response.purchaseId);
                    $("#ajaxStatus").html('<div class="alert alert-success">Purchase successful! Your purchase ID is: ' + response.purchaseId + '</div>');
                    setTimeout(() => {
                        window.location.href = "billing.html";
                    }, 1500);
                }
            },
            error: function(xhr) 
            {
                $("#ajaxStatus").html('<div class="alert alert-danger">Error occurred while processing purchase.</div>');
                console.error("Purchase error:", xhr.responseText);
            }
        });   
    });

    $cartTable = $("#cartTableBody");
    loadProducts();
    loadCart();

});