// Global variables
let $articleId, $articleTitle, $articleAuthor, $category, $contentSnippet, $prefDistChannel, $notes;
let $submissionForm, $articleIdeaCards;
let distChannels, categories, defaultIdErrorMsg;

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

function checkEmpty($widget = $(this)) {
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

function checkIdExists($widget, collectionName, defaultErrorMsg="Please enter an ID.", idNotFoundMsg="ID not found.") {
    const id = $widget.val().trim();
    // ID cannot be empty
    if (id == "") {
        setError($widget, true, defaultErrorMsg);
        return [id, true];
    }
    // TODO - pulling from storage could increase latency if we check every time the ID field changes
    const itemsWithId = getItems(collectionName, []).filter((item) => item.id == id);
    // Article with ID must be present in "articles" list in storage
    if (itemsWithId.length == 0) {
        setError($widget, true, idNotFoundMsg);
        return [id, true];
    }
    setError($widget, false, defaultErrorMsg);
    return [id, false];
}

function checkIdUnique($widget, collectionName, defaultErrorMsg="Please enter an ID.", idExistsMsg="ID already exists.") {
    const id = $widget.val().trim();
    // ID cannot be empty
    if (id == "") {
        setError($widget, true, defaultErrorMsg);
        return [id, true];
    }
    // TODO - pulling from storage could increase latency if we check every time the ID field changes
    const itemsWithId = getItems(collectionName, []).filter((item) => item.id == id);
    // Article with ID cannot be present in "articles" list in storage
    if (itemsWithId.length > 0) {
        setError($widget, true, idExistsMsg);
        return [id, true];
    }
    setError($widget, false, defaultErrorMsg);
    return [id, false];
}

/**
 * Checks form inputs for validity, and updates UI with any errors.
 * @returns "ArticleInfo" object
 */
function checkForm() {
    let article = {};
    let isError, formIsValid = true;

    // Check article ID
    // Cannot have a duplicate ID in the "articles" list in storage
    [article.id, isError] = checkIdUnique($articleId, "articles", defaultIdErrorMsg, "Article ID already exists.");
    if (isError)
        formIsValid = false;

    // Check article title
    [article.title, isError] = checkEmpty($articleTitle);
    if (isError)
        formIsValid = false;

    // Check article author
    [article.author, isError] = checkEmpty($articleAuthor);
    if (isError)
        formIsValid = false;

    /*
    // Code from finalize.js - For checkboxes only
    // Check article distribution channel
    const selectedChannels = $(".channel-check:checked").map(function () {
        return $(this).val();
    }).get();
    articleInfo.distChannel = selectedChannels;
    if (selectedChannels.length == 0) {
        $("#channelError").removeClass("d-none");
        formIsValid = false;
    } else {
        $("#channelError").addClass("d-none");
    }
    */

    // Check article category
    [article.category, isError] = checkOption($category, categories);
    if (isError)
        formIsValid = false;

    // Check content snippet
    [article.contentSnippet, isError] = checkEmpty($contentSnippet);
    if (isError)
        formIsValid = false;

    // Add distribution preference (no checking)
    article.preferredDistChannel = $prefDistChannel.val().trim();

    // Add article notes (no checking)
    article.notes = $notes.val().trim();

    if (formIsValid) {
        return article;
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
    /* // Code from "finalize.js" - for checkboxes only
    $(".channel-check").prop("checked", false);
    $("#channelError").addClass("d-none");
    */
   setError($articleAuthor, false);
    $articleAuthor.val("");
    setError($category, false);
    $category.val("");
    setError($contentSnippet, false);
    $contentSnippet.val("");
    $prefDistChannel.val("");
    $notes.val("");

    // Enable id field
    $articleId.attr("disabled", false);

    // Clear JSON preview
    $("#jsonPreview").text("");
}

function loadArticleIdeas() {
    let articleIdeas = getItems("articleIdeas");
    if (articleIdeas == undefined)
        return;

    const searchTerm = $("#submissionSearch").val().trim().toLowerCase();
    const categoryFilter = $("#submissionFilter").val();

    let html = "";
    for (let idea of articleIdeas) {
        const matchesSearch = idea.id.toLowerCase().includes(searchTerm) || idea.title.toLowerCase().includes(searchTerm);
        const matchesCategoryFilter = (categoryFilter === "All" || idea.category === categoryFilter);
        if (matchesSearch && matchesCategoryFilter) {
            html += `<div class="col-md-6">
                        <div class="entry-card border rounded p-3 bg-white h-100" style="border-left: 3px solid brown;">
                           <div class="d-flex justify-content-between align-items-start gap-2">
                              <div>
                                 <div class="fw-bold">${idea.id}</div>
                                 <div class="mt-1 d-flex flex-wrap gap-1">
                                    <span class="badge text-bg-brown">${idea.category}</span>
                                    <span class="badge text-bg-brown-light">Draft Idea</span>
                                 </div>
                              </div>
                              <button type="button" class="btn btn-sm btn-brown useIdeaBtn" data-id=${idea.id}>Use Idea</button>
                           </div>
                           <div class="mt-2 fw-semibold">${idea.title}</div>
                           <div class="text-muted small mt-2">${idea.notes}
                           </div>
                        </div>
                     </div>`;
        }
    }

    $articleIdeaCards.html(html);
    $articleIdeaCards.find(".useIdeaBtn").on("click", onUseIdea);
}

/**
 * Handler for submitting the form
 */
function onSubmit(event) {
    event.preventDefault();
    /* // Code from "finalize.js" - for checkboxes only
    const checked = $(".channel-check:checked");
    if (checked.length == 0) {
        $("#channelError").removeClass("d-none");
        return;
    } else {
        $("#channelError").addClass("d-none");
    } */

    let article = checkForm();
    if (!article) return;

    const jsonString = JSON.stringify(article, null, 2);
    $("#jsonPreview").text(jsonString);
    // TODO - React transmission
    //transmitWithReact(article);

    // Fields in form: id, title, author, category, contentSnippet, preferredDistChannel, notes
    // Fields in article made in Content Manager: id, title, category, format, value, notes

    // Add fields from content.js so that article is backwards-compatible
    article.format = "";
    article.value = "";

    // Update storage
    updateItem("articles", article, (item) => (
        "id" in item && "title" in item && "author" in item && "category" in item
        && "contentSnippet" in item && "preferredDistChannel" in item && "notes" in item
        && "format" in item && "value" in item
    ));
    // TODO - delete article idea?
    setTimeout(() => {
        clearForm();
        loadArticleIdeas();
    }, 3000);
}

/**
 * Handler for "Use Idea" button.
 */
function onUseIdea() {
    // Get ID of article to edit
    let id = $(this).attr("data-id");
    if (!id)
        return;

    // Clear form
    // TODO warning??
    clearForm();

    // Get article idea
    const articleIdeasWithId = getItems("articleIdeas", []).filter((item) => item.id == id);
    // TODO no default article
    const articleIdea = articleIdeasWithId.length > 0 ? articleIdeasWithId[0] : null;
    if (!articleIdea)
        return;

    // Update form to reflect the current article information
    $articleId.val(id);
    $articleTitle.val(articleIdea.title);
    /* // Code from "finalize.js" - for checkboxes only
    $(".channel-check").prop("checked", false);
    if (Array.isArray(articleIdea.preferredDistChannel)) {
        articleIdea.preferredDistChannel.forEach(channel => {
            $(`.channel-check[value="${channel}"]`).prop("checked", true);
        });
    } else if (articleIdea.preferredDistChannel) {
        $(`.channel-check[value="${articleIdea.preferredDistChannel}"]`).prop("checked", true);
    }
    */
    $category.val(articleIdea.category);
    $notes.val(articleIdea.notes);

    // Disable id field
    $articleId.attr("disabled", true);

    updatePreview();
}

function updatePreview(status=null) {
    const formData = {
        id: $articleId.val(),
        title: $articleTitle.val(),
        category: $category.val(),
        author: $articleAuthor.val(),
        preferredDistChannel: $prefDistChannel.val()
    };
    // TODO
    /*const jsonString = JSON.stringify(formData, null, 2);
    $("#jsonPreview").text(jsonString);*/

    $("#previewTitle").text(formData.title || "--");
    $("#previewId").text(formData.id || "--");
    $("#previewCategory").text(formData.category || "--");
    $("#previewAuthor").text(formData.author || "--");
    $("#previewPrefDistChannel").text(formData.preferredDistChannel || "--");
    // TODO status param
    $("#previewStatus").text(status || "--");
    $("#previewStatusInfo").text(status || "--");
};


$(document).ready(function () {
    // TODO remove
    if (!localStorage.getItem("articles")) {
        const initialData = [
            { id: "HS201", title: "Spring Kitchen Reset", category: "Kitchen Resources", value: "Free" },
            { id: "HS202", title: "Closet Cleanout Weekend Guide", category: "Home Organization", value: "Premium" },
            { id: "HS203", title: "Weekly Cleaning Planner Pack", category: "Printable Planner", value: "Free" }
        ];
        localStorage.setItem("articles", JSON.stringify(initialData));
    }
    if (!localStorage.getItem("articleIdeas")) {
        const initialData = [
            { id: "HS301", title: "Sunday Reset Routine", author: "Lauren", category: "Home Organization", notes: "A simple routine to prepare the home for the week ahead." },
            { id: "HS302", title: "5-Minute Kitchen Reset", author: "Lauren", category: "Kitchen Resources", notes: "Quick habits that help keep the kitchen clean and calm." },
            { id: "HS303", title: "Weekly Cleaning Checklist", author: "Lauren", category: "Printable Planners", notes: "A printable guide readers can use to stay on track all week." }
        ];
        localStorage.setItem("articleIdeas", JSON.stringify(initialData));
    }

    $submissionForm = $("#submissionForm");
    $articleId = $($submissionForm.find("#articleId")[0]);
    $articleTitle = $($submissionForm.find("#articleTitle")[0]);
    $articleAuthor = $($submissionForm.find("#authorName")[0]);
    $category = $($submissionForm.find("#category")[0]);
    $contentSnippet = $($submissionForm.find("#contentSnippet")[0]);
    $prefDistChannel = $($submissionForm.find("#distributionPreference")[0]); // Optional
    $notes = $($submissionForm.find("#submissionNotes")[0]); // Optional

    $articleIdeaCards = $("#ideaCards");

    categories = loadOptions($category);
    distChannels = loadOptions($prefDistChannel);
    defaultIdErrorMsg = $articleId.parent().find("div.invalid-feedback").text();

    $articleId.on("keyup", () => { 
        checkIdExists($articleId, "articles", defaultIdErrorMsg, "Article ID not found."); 
        updatePreview(); });
    $articleTitle.on("keyup", () => { checkEmpty($articleTitle); updatePreview(); });
    $articleAuthor.on("keyup", () => { checkEmpty($articleAuthor); updatePreview(); });
    $category.on("change", () => { checkOption($category, categories); updatePreview(); });
    $contentSnippet.on("keyup", () => { checkEmpty($contentSnippet); updatePreview(); });
    $prefDistChannel.on("change", updatePreview);
    /* From finalize.js - for checkboxes only
    $(".channel-check").on("change", () => {
        updatePreview();
    }); */
    $notes.on("keyup", updatePreview);

    $submissionForm.on("submit", onSubmit);
    $("#clearForm").on("click", clearForm);

    $("#submissionSearch, #submissionFilter").on("keyup change", function () {
        loadArticleIdeas();
        updatePreview();
    });

    loadArticleIdeas();
    updatePreview();
    $("#jsonPreview").val("");
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