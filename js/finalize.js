// Global variables
let $articleId, $articleTitle, $pubDate, $distChannel, $reviewStatus, $articleAuthor, $featured, $access, $editNotes;
let $pubOptionsForm, $articleCards;
let distChannels, reviewStatuses, featuredOptions, accessTypes, defaultIdErrorMsg;
let articleCollectionName = "articles";
let pubOptionsCollectionName = "pubOptions";

function setError($widget, isError, errorMessage=null) {
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
function getItems(collectionName, defaultValue=undefined) {
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

function checkEmpty($widget=$(this)) {
    const value = $widget.val().trim();
    const isError = (value == "");
    const widgetId = $widget.attr("id");
    setError($widget, isError);
    return [value, isError];
}

function checkOption($widget, options) {
    const value = $widget.val().trim();
    const isError = (value == "" || options.indexOf(value) == -1);
    setError($widget, isError);
    return [value, isError];
}

function checkDate($widget) {
    // String formatted yyyy-mm-dd
    const date = $widget.val().trim();
    let dateNums = date.match(/^(\d\d\d\d)-(\d\d)-(\d\d)$/);
    let isError = true;
    if (Array.isArray(dateNums) && dateNums.length == 4) {
        dateNums = dateNums.map(num => parseInt(num));
        if (!isNaN(parseInt(dateNums[1])) && !isNaN(parseInt(dateNums[2])) && !isNaN(parseInt(dateNums[3]))
            && dateNums[1] >= 1970 // Check year
            && dateNums[2] >= 1 // Check month
            && dateNums[2] <= 12
            && dateNums[3] >= 1 // Check day
            && dateNums[3] <= 31) {
                isError = false;
        }
    }
    setError($widget, isError);
    return [date, isError];
}

function checkArticleId($widget) {
    const id = $widget.val().trim();
    // ID cannot be empty
    if (id == "") {
        setError($widget, true, defaultIdErrorMsg);
        return [id, true];
    } 
    // TODO - pulling from storage could increase latency if we check every time the ID field changes
    const articlesWithId = getItems(articleCollectionName, []).filter((article) => article.id == id);
    // Article with ID must be present in "articles" list in storage
    if (articlesWithId.length == 0) {
        setError($widget, true, "Article ID not found.");
        return [id, true]; 
    }
    setError($widget, false, defaultIdErrorMsg);
    return [id, false];
}

/**
 * Checks form inputs for validity, and updates UI with any errors.
 * @returns "ArticleInfo" object
 */
function checkForm() {
    let articleInfo = {};
    let isError, formIsValid = true;

    // Check article ID
    // An article with the given ID must be present in the "articles" list in storage
    [articleInfo.id, isError] = checkArticleId($articleId);
    if (isError)
        formIsValid = false;

    // Check article title
    [articleInfo.title, isError] = checkEmpty($articleTitle);
    if (isError)
        formIsValid = false;
    
    // Check article publication date
    [articleInfo.pubDate, isError] = checkDate($pubDate);
    if (isError)
        formIsValid = false;

    // Check article distribution channel
    [articleInfo.distChannel, isError] = checkOption($distChannel, distChannels);
    if (isError)
        formIsValid = false;

    // Check article review status
    [articleInfo.reviewStatus, isError] = checkOption($reviewStatus, reviewStatuses);
    if (isError)
        formIsValid = false;

    // Check article author/editor name
    [articleInfo.author, isError] = checkEmpty($articleAuthor);
    if (isError)
        formIsValid = false;

    // Check article featured (yes/no)
    [articleInfo.featured, isError] = checkOption($featured, featuredOptions);
    if (isError)
        formIsValid = false;

    // Check article access type
    [articleInfo.access, isError] = checkOption($access, accessTypes);
    if (isError)
        formIsValid = false;

    // Add article editorial notes (no checking)
    articleInfo.editNotes = $editNotes.val().trim();

    if (formIsValid) {
        return articleInfo;
    }
    return null;
}

/**
 * Clears the form.
 * If form is in "edit" mode, then doesn't clear the article ID.
 */
function clearForm() {
    setError($articleId, false);
    $articleId.val("");
    setError($articleTitle, false);
    $articleTitle.val("");
    setError($pubDate, false);
    $pubDate.val("");
    setError($distChannel, false);
    $distChannel.val("");
    setError($reviewStatus, false);
    $reviewStatus.val("");
    setError($articleAuthor, false);
    $articleAuthor.val("");
    setError($featured, false);
    $featured.val("");
    setError($access, false);
    $access.val("");
    $editNotes.val("");

    // Enable id field
    $articleId.attr("disabled", false);
}

function defaultPubOptions(id) {
    // Need default reviewStatus and access type
    return {
        "id": id, 
        "pubDate": "",
        "distChannel": "",
        "reviewStatus": "Draft",
        "author": "",
        "featured": "",
        "access": "Premium",
        "editNotes": ""
    };
}

function loadPubInfo() {
    let articles = getItems(articleCollectionName); // TODO filter items
    if (articles == undefined)
        return;
    let pubOptionsMap = new Map(getItems(pubOptionsCollectionName, []).map(item => [item.id, item])); // TODO filter items

    let html = "";
    for (article of articles) {
        const articleInfo = pubOptionsMap.get(article.id);
        if (!articleInfo) 
            articleInfo = defaultPubOptions(article.id);
        html += `<div class="col-md-6">
            <div class="entry-card border rounded p-3 bg-white h-100" style="border-left: 3px solid brown;">
                <div class="d-flex justify-content-between align-items-start gap-2">
                <div>
                    <div class="fw-bold">${article.id}</div>
                    <div class="mt-1 d-flex flex-wrap gap-1">
                    <span class="badge text-bg-brown">${article.category}</span>
                    <span class="badge text-bg-brown-light">${articleInfo.reviewStatus}</span>
                    </div>
                </div>
                <button type="button" class="btn btn-sm btn-brown loadBtn" data-id="${article.id}">Load</button>
                </div>
                <div class="mt-2 fw-semibold">${article.title}</div>
                <div class="text-muted small mt-2">${articleInfo.editNotes}</div>
            </div>
        </div>`;
    }

    $articleCards.html(html);
    $articleCards.find(".loadBtn").on("click", onLoad);
}

function updateArticle(articleId, articleTitle, articleAccess) {
    // Find article with an identical id
    let articles = getItems(articleCollectionName, []);
    let articlesWithId = articles.filter((article) => article.id == articleId);
    if (articlesWithId.length == 0) {
        throw Error(`Article with id ${articleId} not found`);
    }
    // Update article title and access - works because Object is a reference type
    articlesWithId[0].title = articleTitle;
    articlesWithId[0].value = articleAccess;
    // Save to localStorage
    localStorage.setItem(articleCollectionName, JSON.stringify(articles));
}

/**
 * Handler for submitting the form
 */
function onSave(event) {
    event.preventDefault();

    let pubOptions = checkForm();
    if (!pubOptions)
        return;

    updateArticle(pubOptions.id, pubOptions.title, pubOptions.access);
    updateItem(pubOptionsCollectionName, pubOptions,
        (pubOptions) => (
            "id" in pubOptions && "pubDate" in pubOptions && "distChannel" in pubOptions && "reviewStatus" in pubOptions
            && "author" in pubOptions && "featured" in pubOptions && "editNotes" in pubOptions)
    ); // Note: in local storage, pub options do not include the article's title or access type (which are stored in the "articles" collection)
    clearForm();
    loadPubInfo();
}

/**
 * Handler for "Load" button.
 */
function onLoad() {
    // Get ID of article to edit
    let id = $(this).attr("data-id");
    if (!id)
        return;

    // Get article title from "articles" collection
    const articlesWithId = getItems(articleCollectionName, []).filter((item) => item.id == id);
    if (articlesWithId.length == 0)
        return;
    const article = articlesWithId[0];

    // Clear form
    // TODO warning??
    clearForm();

    // Get publication options to edit
    let pubOptionsWithId = getItems(pubOptionsCollectionName, []).filter((item) => item.id == id);
    const pubOptions = pubOptionsWithId.length > 0
        ? pubOptionsWithId[0]
        : defaultPubOptions(id);

    // Update form to reflect the current article information
    $articleId.val(id);
    $pubDate.val(pubOptions.pubDate);
    $distChannel.val(pubOptions.distChannel);
    $reviewStatus.val(pubOptions.reviewStatus);
    $articleAuthor.val(pubOptions.author);
    $featured.val(pubOptions.featured);
    $editNotes.val(pubOptions.editNotes);
    $articleTitle.val(article.title);
    $access.val(article.value);

    // Disable id field
    $articleId.attr("disabled", true);
}

$(document).ready(function() {
    // TODO remove
    if (!localStorage.getItem(articleCollectionName)) {
        const intialData = [
            {id: "A101", title: "Fix a leaky faucet", category: "DIY & Repairs", format: "Blog Post", value: "Free", notes: "Beginner friendly"},
            {id: "LS-FOOD-001", title: "30 Useful Life Hacks", category: "Food & Cooking", format: "Video", value: "Free", notes: "Quick tips"}
        ];
        localStorage.setItem(articleCollectionName, JSON.stringify(intialData));
    }

    $pubOptionsForm = $("#finalizationForm");
    $articleId = $($pubOptionsForm.find("#articleId")[0]);
    $articleTitle = $($pubOptionsForm.find("#articleTitle")[0]);
    $pubDate = $($pubOptionsForm.find("#publicationDate")[0]);
    $distChannel = $($pubOptionsForm.find("#distributionChannel")[0]);
    $reviewStatus = $($pubOptionsForm.find("#reviewStatus")[0]);
    $articleAuthor = $($pubOptionsForm.find("#editorName")[0]);
    $featured = $($pubOptionsForm.find("#featuredOption")[0]);
    $access = $($pubOptionsForm.find("#subscriberAccess")[0]);
    $editNotes = $($pubOptionsForm.find("#editorialNotes")[0]);

    $articleCards = $("#articleCards");

    distChannels = loadOptions($distChannel);
    reviewStatuses = loadOptions($reviewStatus);
    featuredOptions = loadOptions($featured);
    accessTypes = loadOptions($access);
    defaultIdErrorMsg = $articleId.parent().find("div.invalid-feedback").text();

    $articleId.on("keyup", () => checkArticleId($articleId));
    $articleTitle.on("keyup", () => checkEmpty($articleTitle));
    $pubDate.on("change", () => checkDate($pubDate));
    $distChannel.on("change", () => checkOption($distChannel, distChannels));
    $reviewStatus.on("change", () => checkOption($reviewStatus, reviewStatuses));
    $articleAuthor.on("keyup", () => checkEmpty($articleAuthor));
    $featured.on("change", () => checkOption($featured, featuredOptions));
    $access.on("change", () => checkOption($access, accessTypes));
    // Not checking $editNotes

    $pubOptionsForm.on("submit", onSave);
    $("#clearForm").on("click", clearForm);
   
    $("#articleSearch, #statusFilter").on("keyup change", function () {
        loadPubInfo();
    });

    loadPubInfo();
});
