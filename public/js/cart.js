

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
  let total = 0;
    $.ajax({
        url: `/api/cart/?sessionId=${sessionId}`,
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
                        

                    $cartTable.append(`<tr>
                        <td>${item.id}</td>
                        <td>${item.description}</td>
                        <td>${item.quantity}</td>
                        <td>$${item.price * item.quantity}</td>
                        <td class="text-end">
                            <button class="btn btn-sm btn-outline-danger removeCartBtn" data-id="${item.id}">Remove</button>
                        </td>
                    </tr>`);
                });
                    }
                    
                    $(".stat-items-count").text(cartItems.length);
                    $($cartTable.find(".removeCartBtn").on("click", onRemoveFromCart));
                }
            });
        }
       
function onRemoveFromCart() {
    const productId = $(this).data("id");
    $.ajax({
        url: `/api/cart?sessionId=${sessionId}&productId=${productId}`,
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
        url: `/api/cart?sessionId=${sessionId}&productId=${productId}`,
        type: 'POST',    
        
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
            uniqueProductIds.add(item.id);
        });

    $("#cartTotal").text(`$${total.toFixed(2)}`);

    
    $(".stat-items-count").text(totalProducts);
    $("#productCount").text(`${cartItems.length} unique products`);
    $("#totalProductsCount").text(uniqueProductIds.size);
    

    

   
    
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
        $.ajax({
            url: '/api/cart?' + $.param({
                sessionId: sessionId
            }),
            type: 'DELETE',
            contentType: 'application/json',
            success: function (response) {
                loadCart();
            },
            error: function (xhr) {
                console.log('AJAX error when clearing cart. Status: ' + xhr.status);
            }
        });
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