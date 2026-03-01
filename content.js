// Global variables
let $formHeader, $formModeBadge, $editModeBanner, $editId;
let $contentForm, $articleId, $articleTitle, $category, $format, $value, $notes;
let $confirmDeleteButton;
let categories, formats, values;


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
    for (option of $select.children("option")) {
        let $option = $(option);
        // Don't include options with value "" (i.e. placeholder options)
        if ($option.attr("value") != "") {
            // Add "option" text to categories
            options.push($option.text());
        }
    }
    return options; 
}

function isValidOption(chosenOption, options) {
    return chosenOption == "" || options.indexOf(chosenOption) == -1
}

/**
 * Checks form inputs for validity, and updates UI with any errors.
 * Has the same functionality for "creating" and "updating" an article.
 * @returns "Article" object
 */
function checkForm() {
    let article = {};
    let isError, formIsValid = true;

    // Check article ID
    article.id = $articleId.val().trim();
    isError = (article.id == "");
    setError($articleId, isError);
    if (isError)
        formIsValid = false;

    // Check article title
    article.title = $articleTitle.val().trim();
    isError = (article.title == "");
    setError($articleTitle, isError);
    if (isError)
        formIsValid = false;
    
    // Check article category
    article.category = $category.val().trim();
    isError = isValidOption(article.category, categories);
    setError($category, isError);
    if (isError)
        formIsValid = false;

    // Check article format
    article.format = $format.val().trim();
    isError = isValidOption(article.format, formats);
    setError($format, isError);
    if (isError)
        formIsValid = false;

    // Check article value
    article.value = $value.val().trim();
    isError = isValidOption(article.value, values);
    setError($value, isError);
    if (isError)
        formIsValid = false;

    // Add article notes (no checking)
    article.notes = $notes.val().trim();

    if (formIsValid) {
        return article;
    }
    return null;
}

function changeToAddForm() {
    $formHeader.text("Create Article");
    $formModeBadge.text("Create");
    $editModeBanner.addClass("d-none");
    $editId.val("");
    $contentForm.attr("data-mode", "add");
    $articleId.attr("disabled", false);
    $contentForm.find("#saveBtn").removeClass("d-none");
    $contentForm.find("#updateBtn").addClass("d-none");
}

function changeToEditForm(id) {
    $formHeader.text("Update Article");
    $formModeBadge.text("Update");
    $editModeBanner.removeClass("d-none");
    $editId.val(id);
    $contentForm.attr("data-mode", "edit");
    $articleId.attr("disabled", true);
    $contentForm.find("#saveBtn").addClass("d-none");
    $contentForm.find("#updateBtn").removeClass("d-none");
}

/**
 * Clears the form.
 * If form is in "edit" mode, then doesn't clear the article ID.
 */
function clearForm() {
    setError($articleId, false);
    if ($contentForm.attr("data-mode") != "edit") {
        $articleId.val("");
    }
    setError($articleTitle, false);
    $articleTitle.val("");
    setError($category, false);
    $category.val("");
    setError($format, false);
    $format.val("");
    setError($value, false);
    $value.val("");
    $notes.val("");
}

/**
 * Gets array of articles from local storage.
 * If articles not found (i.e. item with key "articles" not found 
 * in local storage), then returns undefined.
 * @returns Array of articles, or undefined
 */
function getArticles() {
    let articlesJson = localStorage.getItem("articles");
    let articles;
    if (articlesJson == null) {
        return undefined;
    }
    articles = JSON.parse(articlesJson);
    if (!Array.isArray(articles))
        throw new Error("localStorage item \"articles\" is not an array");
    return articles;
}

/**
 * Adds new article to local storage.
 * If an article with the same ID already exists, does NOT add article.
 * 
 * @param {} article 
 * @returns true if article was added successfully, else false
 */
function addArticle(article) {
    let articles = getArticles();
    if (articles == undefined)
        articles = [article];
    else {
        for (a of articles) {
            if (a.id == article.id)
                // Don't add article with duplicate ID
                return false;
        }
        articles.push(article);
    }
    localStorage.setItem("articles", JSON.stringify(articles));
    return true;
}

/**
 * Updates the article with the given ID.
 * 
 * Note: If articleId and newArticle.id differ, the existing article 
 * with id equal to articleId is removed and replaced with newArticle,
 * UNLESS another article with newArticle.id exists (in which case
 * nothing is updated).
 * 
 * @param {} article 
 * @returns true if article was added successfully, else false
 */
function updateArticle(articleId, newArticle) {
    // Verify newArticle parameter
    if (!("id" in newArticle && "title" in newArticle && "category" in newArticle 
            && "format" in newArticle && "value" in newArticle && "notes" in newArticle))
        throw new Error("New article missing a required property");
    
    let articles = getArticles();
    if (articles == undefined) {
        // No saved articles - create new article list
        articles = [newArticle];
    } else {
        let idChanged = (articleId != newArticle.id);
        // Find an existing article with the given id (articleId parameter)
        let articleIndex = null;
        for (let i = 0; i < articles.length; i++) {
            // Case 1: idChanged false. Assumes only ONE article with given ID, returns first one.
            // Case 2: idChanged true, no articles with newArticle.id. Update & return true.
            // Case 3: idChanged true, article with newArticle.id exists. Return false.
            if (articles[i].id == articleId) {
                articleIndex = i;
                if (!idChanged)
                    break;
            } if (idChanged && articles[i].id == newArticle.id) {
                // Article with given ID already exists and we are not updating it
                return false;
            }
        }
        if (articleIndex != null) {
            // If article exists, modify it
            articles[articleIndex] = newArticle;
        } else {
            // If article doesn't exist, add it
            articles.push(newArticle);
        }
    }

    localStorage.setItem("articles", JSON.stringify(articles));
    return true;
}

function deleteArticle(articleId) {
    let articles = getArticles();
    if (articles == undefined) {
        // No saved articles
        return;
    }
    
    // Delete all article with the given id (articleId parameter)
    let numArticles = articles.length;
    articles = articles.filter(function (a) {
        return a.id != articleId;
    });
    if (articles.length < numArticles) {
        localStorage.setItem("articles", JSON.stringify(articles));
    }
    
}

function loadArticles() {
    let articles = getArticles();
    if (articles == undefined)
        return;
    let searchText = $("#contentSearch").val() ? $("#contentSearch").val().toLowerCase() : "";
    let filterCat = $("#filterCategory").val() || "All";

    let html = "";
    for (article of articles) {
        let matchesSearch = article.title.toLowerCase().includes(searchText) || article.id.toLowerCase().includes(searchText);
        let matchesCategory = (filterCat === "All" || article.category === filterCat);
        if (matchesSearch && matchesCategory) {
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
    }
    $contentCards = $("#contentCards");
    $contentCards.html(html);

    editButtons = $contentCards.find(".editBtn").on("click", onEdit);
    deleteButtons = $contentCards.find(".deleteBtn").on("click", handleDeleteBtn);
}

/**
 * Handler for submitting the form,
 * whether adding a new article or updating an existing one.
 */
function onSave(event) {
    event.preventDefault();

    let article = checkForm();
    if (!article)
        return;

    if ($(this).attr("data-mode") == "edit") {
        updateArticle(article.id, article);
        changeToAddForm();
        clearForm();
        loadArticles();
    } else {
        addArticle(article);
        clearForm();
        loadArticles();
    }
}

/**
 * Handler for "edit" button.
 */
function onEdit() {
    // Get ID of article to edit
    let id = $(this).attr("data-id");
    if (!id)
        return;

    // Change form to edit form
    clearForm();
    changeToEditForm();

    // Get article to edit
    let articles = getArticles();
    let article = null;
    for (a of articles) {
        if (a.id == id) {
            article = a;
            break;
        }
    }

    // Update form to reflect the current article information
    $articleId.val(id);
    $articleTitle.val(article.title);
    $category.val(article.category);
    $format.val(article.format);
    $value.val(article.value);
    $notes.val(article.notes);
}

function onCancelEdit() {
    changeToAddForm();
    clearForm();
}

/**
 * Handler for deleting an article (in the "delete" modal).
 * Deletes the article with an ID matching the button's data-id. 
 */
function onDelete() {
    deleteArticle($("#confirmDeleteBtn").attr("data-id"));
    loadArticles();
}

/**
 * Handler for the "Delete" button. 
 * Modifies the "delete" modal.
 */
function handleDeleteBtn() {
    $deleteBtn = $(this);
    let articleId = $deleteBtn.attr("data-id");
    $confirmDeleteButton.attr("data-id", articleId);
    $("#deletedInfo").text("ID = " + articleId);
}

$(document).ready(function() {
    
   if (!localStorage.getItem("articles")) {
        const intialData = [
            {id: "A101", title: "Fix a leaky faucet", category: "DIY & Repairs", format: "Blog Post", value: "Free", notes: "Beginner friendly"},
            {id: "LS-FOOD-001", title: "30 Useful Life Hacks", category: "Food & Cooking", format: "Video", value: "Free", notes: "Quick tips"}
        ];
        localStorage.setItem("articles", JSON.stringify(intialData));
    }
    
    $formHeader = $("#formHeader");
    $formModeBadge = $("#formModeBadge");
    $editModeBanner = $("#editModeBanner");
    $editId = $("#editId");

    $contentForm = $("#contentForm");
    $articleId = $($contentForm.find("#itemId")[0]);
    $articleTitle = $($contentForm.find("#title")[0]);
    $category = $($contentForm.find("#category")[0]);
    $format = $($contentForm.find("#format")[0]);
    $value = $($contentForm.find("#value")[0]);
    $notes = $($contentForm.find("#extraInfo")[0]);
    $confirmDeleteButton = $("#confirmDeleteBtn");

    let checkEmpty = function() {
        let isError = ($(this).val().trim() == "");
        setError($(this), isError);
    };
    let checkOption = function($widget, options) {
        let isError = isValidOption($widget.val().trim(), options);
        setError($widget, isError);
    };

    $contentForm.on("submit", onSave);
    $articleId.on("keyup", checkEmpty);
    $articleTitle.on("keyup", checkEmpty);
    $category.on("change", () => checkOption($category, categories));
    $format.on("change", () => checkOption($format, formats));
    $value.on("change", () => checkOption($value, values));
    $confirmDeleteButton.on("click", onDelete);
    $("#cancelEditBtn").on("click", onCancelEdit);
   
     $("#contentSearch, #filterCategory").on("keyup change", function () {
        loadArticles();
     });
     
    categories = loadOptions($category);
    formats = loadOptions($format);
    values = loadOptions($value);

    changeToAddForm();
    loadArticles();
});
