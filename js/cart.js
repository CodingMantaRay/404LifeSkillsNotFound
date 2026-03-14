import * as Util from "./utilities.js";

// Global variables
let $productForm, $productId, $productDesc, $category, $unit, $price, $weight, $color, $details;
let categories, units;
let formWidgets, formItems;

function checkPosNum($widget) {
    let number = parseFloat($widget.val().trim());
    let isError = (isNaN(number) || number < 0);
    Util.setError($widget, isError);
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
            if (Util.checkOption($widget, categories))
                isError = true;
        } else if (prop == "unit") {
            if (Util.checkOption($widget, units))
                isError = true;
        } else if (prop == "price") {
            if (checkPosNum($widget))
                isError = true;
        } else {
            if (Util.checkEmpty($widget))
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
        Util.setError($widget, false);
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

    Util.addItem("products", product);
    clearForm();
    loadProducts();
}

function onAddToCart() {
    console.log("add to cart"); // TODO
}

function loadProducts() {
    let products = Util.getItems("products");
    if (!products)
        return;

    // let products = Util.filterItems("contentSearch", "filterCategory", (product, searchText) => {product.title.toLowerCase().includes(searchText) || product.id.toLowerCase().includes(searchText)})

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
                    <button type="button" class="btn btn-sm btn-brown addToCartBtn">Add to Cart</button>
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
    // TODO
    // if (!localStorage.getItem("products")) {
        const initialData = [
            {id: "HS101", description: "Kitchen Reset Guide", category: "Kitchen Resources", unit: "Download", price: 12.99, weight: "", color: "", notes: ""},
            {id: "HS102", description: "Closet Refresh Bundle", category: "Home Organization", unit: "Bundle", price: 15.99, weight: "", color: "", notes: ""},
            {id: "HS103", description: "Weekly Home Planner Pack", category: "Printable Planners", unit: "Pack", price: 8.99, weight: "", color: "", notes: ""}
        ];
        localStorage.setItem("products", JSON.stringify(initialData));
    // }

    $productForm = $("#productForm");
    $productId = $($productForm.find("#productId")[0]);
    $productDesc = $($productForm.find("#description")[0]);
    $category = $($productForm.find("#category")[0]);
    $unit = $($productForm.find("#unit")[0]);
    $price = $($productForm.find("#price")[0]);
    $weight = $($productForm.find("#weight")[0]);
    $color = $($productForm.find("#color")[0]);
    $details = $($productForm.find("#details")[0]);

    categories = Util.loadOptions($category);
    units = Util.loadOptions($unit);

    formWidgets = [$productId, $productDesc, $category, $unit,
        $price, $weight, $color, $details];
    formItems = ["id", "description", "category", "unit",
    "price", "weight", "color", "details"];

    $productForm.on("submit", onSave);
    $productId.on("keyup", () => Util.checkEmpty($(this)));
    $productDesc.on("keyup", () => Util.checkEmpty($(this)));
    $category.on("change", () => Util.checkOption($(this), categories));
    $unit.on("change", () => Util.checkOption($(this), units));
    $price.on("keyup", () => Util.checkEmpty($(this)));
    // Not checking "Weight", "Color", or "Additional Details"
   
    // $("#contentSearch, #filterCategory").on("keyup change", function () {
    //     Util.loadItems();
    // });

    loadProducts();
});