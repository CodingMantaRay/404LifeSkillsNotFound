/**
 * Utility functions module
 */

export function getError($widget) {
    return $widget.hasClass("is-invalid");
}

export function setError($widget, isError) {
    if (isError) {
        $widget.addClass("is-invalid"); // .is-invalid
    } else {
        $widget.removeClass("is-invalid"); // .is-valid
    }
}

export function loadOptions($select) {
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

export function checkEmpty($widget) {
    let isError = ($widget.val().trim() == "");
    setError($widget, isError);
    return isError;
}

export function checkOption($widget, options) {
    let isError = isValidOption($widget.val().trim(), options);
    setError($widget, isError);
    return isError;
}

export function isValidOption(chosenOption, options) {
    return chosenOption == "" || options.indexOf(chosenOption) == -1
}

/*
getItems("articles");
*/
/**
 * Gets the given collection (a JSON array) from local storage.
 * If collection not found (i.e. item with key == collectionName not found 
 * in local storage), then returns undefined.
 * 
 * @param {string} collectionName - name (key) of collection to get from storage
 * @returns Array of objects converted from JSON, or undefined
 */
export function getItems(collectionName) {
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

/*
addItem("articles", article);
*/
/**
 * Adds new item to local storage.
 * If an item with the same ID already exists, does NOT add item.
 * 
 * @param {string} collectionName - name of collection to store item in
 * @param {object} item - object with a unique "id" property
 * @returns true if item was added successfully, else false
 */
export function addItem(collectionName, item) {
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

/*
let verifyItem = (articleJson) => {return ("id" in articleJson && "title" in articleJson && "category" in articleJson 
        && "format" in articleJson && "value" in articleJson && "notes" in articleJson)};
updateItem("articles", articleId, newItem, verifyItem);
*/
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
export function updateItem(collectionName, itemId, newItem, verifyItem = (item) => true) {
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

/*
deleteItem("articles", articleId);
*/
export function deleteItem(collectionName, itemId) {
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

/* 
let articles = filterItems("contentSearch", "filterCategory", (article, searchText) => {article.title.toLowerCase().includes(searchText) || article.id.toLowerCase().includes(searchText)})

let html = "";
for (article of articles) {
    html += '<div class="col-md-6"><div class="border rounded p-3 h-100 bg-white">';
    html += '<div class="d-flex justify-content-between align-items-start gap-2"><div>';
    html += `<div class="fw-bold">${article.id}</div>`;
    html += `<div class="text-muted small">${article.category} • ${article.format} • ${article.value}</div></div>`;
    html += '<div class="d-flex gap-2">';
    html += `<button type="button" class="btn btn-sm btn-outline-dark editBtn" data-id="${article.id}">Edit</button>`;
    html += `<button type="button" class="btn btn-sm btn-outline-danger deleteBtn" data-id="${article.id}" data-bs-toggle="modal" data-bs-target="#deleteModal">Delete</button>`;
    html += "</div></div>";
    html += `<div class="mt-2">${article.title}</div>`;
    html += `<div class="text-muted small mt-2">Notes: ${article.notes ? article.notes : "none"}</div>`;
    html += "</div></div>";
}
$contentCards = $("#contentCards");
$contentCards.html(html);

editButtons = $contentCards.find(".editBtn").on("click", onEdit);
deleteButtons = $contentCards.find(".deleteBtn").on("click", handleDeleteBtn);
*/
export function filterItems(collectionName, searchId, filterId, matchesSearchFunc) {
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