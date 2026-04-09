import { clear } from "node:console";

// Global variables
let $articleId, $articleTitle, $pubDate, $distChannel, $reviewStatus, $articleAuthor, $featured, $access, $editNotes;
let $pubOptionsForm, $articleCards;
let distChannels, reviewStatuses, featuredOptions, accessTypes, defaultIdErrorMsg;

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
    const articlesWithId = getItems("articles", []).filter((article) => article.id == id);
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
    const selectedChannels = $(".channel-check:checked").map(function() {
        return $(this).val();
    }).get();
    articleInfo.distChannel = selectedChannels;
    if (selectedChannels.length == 0) {
        $("#channelError").removeClass("d-none");
        formIsValid = false;
    } else {
        $("#channelError").addClass("d-none");
    }

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
   $(".channel-check").prop("checked", false);
   $("#channelError").addClass("d-none");
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
        "featured": "No",
        "access": "Free",
        "editNotes": ""
    };
}

async function loadPubInfo() {
    // TODO filter pubOptions
 try {
  const response = await fetch('http://localhost:3000/api/submissions');
  const articles = await response.json();

  if (!articles)     return;

const searchTerm = $("#articleSearch").val().trim().toLowerCase();
const statusFilter = $("#statusFilter").val();

    
    /**
     * Notes on structure of storage:
     * - All values except the article's category are stored in "pubOptions" in localStorage.
     * - The article's ID, title, and value/access type are stored in both "articles" and "pubOptions".
     *        - article.value == pubOptions.access
     * - The article's category is only in "articles" in localStorage. 
     */

    let html = "";
    for (let article of articles) {
        

        const matchesSearch = (article.id || "").toLowerCase().includes(searchTerm) || (article.title || "").toLowerCase().includes(searchTerm);
        const matchesStatusFilter = (statusFilter === "All" || article.reviewStatus === statusFilter);
        if (matchesSearch && matchesStatusFilter) {

        html += `<div class="col-md-6">
            <div class="entry-card border rounded p-3 bg-white h-100" style="border-left: 3px solid brown;">
                <div class="d-flex justify-content-between align-items-start gap-2">
                <div>
                    <div class="fw-bold">${article.id}</div>
                    <div class="mt-1 d-flex flex-wrap gap-1">
                    <span class="badge text-bg-brown">${article.category}</span>
                    <span class="badge text-bg-brown-light">${article.reviewStatus || "Pending"}</span>
                    </div>
                </div>
                <button type="button" class="btn btn-sm btn-brown loadBtn" data-id="${article.id}">Load</button>
                </div>
                <div class="mt-2 fw-semibold">${article.title}</div>
                <div class="text-muted small mt-2">${article.editNotes || ""}</div>
            </div>
        </div>`;
        }

    }

    $articleCards.html(html);
    $articleCards.find(".loadBtn").on("click", onLoad);

    } catch (err) {
        console.error("Error loading publication information:", err);
    }

}

function updateArticle(articleId, articleTitle, articleAccess) {
    // Find article with an identical id
    let articles = getItems("articles", []);
    let articlesWithId = articles.filter((article) => article.id == articleId);
    if (articlesWithId.length == 0) {
        throw Error(`Article with id ${articleId} not found`);
    }
    // Update article title and access - works because Object is a reference type
    articlesWithId[0].title = articleTitle;
    articlesWithId[0].value = articleAccess;
    // Save to localStorage
    localStorage.setItem("articles", JSON.stringify(articles));
}

/**
 * Handler for submitting the form
 */
function onSave(event) {
    event.preventDefault();
    
let pubOptions = checkForm();
    if (!pubOptions) return;
   
$.ajax({
    url: "http://localhost:3000/api/submissions",
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify(pubOptions),
    success: function(response) {
        transmitWithReact(pubOptions);

        alert("Publication options saved successfully!");
       
            clearForm();
            loadPubInfo();
       
    },
    error: function() {
        alert("Error saving publication options.");
    }
});
}

/**
 * Handler for "Load" button.
 */
async function onLoad() {
    // Get ID of article to edit
    let id = $(this).attr("data-id");
    if (!id)
        return;
    clearForm();

    try {
     const response = await fetch(`http://localhost:3000/api/submissions?id=${id}`);
     const articles = await response.json();
     const article = articles.find(a => a.id === id);
    // Get article from "articles" collection
    
        if (article) {

    // Update form to reflect the current article information
    $articleId.val(id);
    $articleTitle.val(article.title);
    $pubDate.val(article.pubDate || "");
    $reviewStatus.val(article.reviewStatus || "Pending");
    $articleAuthor.val(article.author || "");
    $featured.val(article.featured || "No");
    $editNotes.val(article.editNotes || "");
    $access.val(article.value || article.access || "Free");

    $(".channel-check").prop("checked", false);
    if (article.distChannel) {
        const channels = Array.isArray(article.distChannel) ? article.distChannel : [article.distChannel];
        channels.forEach(channel => $(`.channel-check[value="${channel}"]`).prop("checked", true));
    }
   

    // Disable id field
    $articleId.attr("disabled", true);

    updatePreview();
}
} catch (err) {
    console.error("Error loading article information:", err);
}
}


const updatePreview = () => {
        const formData = {
            title: $articleTitle.val(),
            pubDate: $pubDate.val(),
            reviewStatus: $reviewStatus.val(),
            access: $access.val()

        };
            const jsonString = JSON.stringify(formData, null, 2);
            $("#jsonPreview").text(jsonString);

            const $previewValues = $(".col-lg-8 .border.bg-light .fw-bold");
            $(".col-lg-8 .border.bg-light .fw-bold").eq(0).text(formData.title || "--");
            $(".col-lg-8 .border.bg-light .fw-bold").eq(1).text(formData.pubDate || "--");
            $(".col-lg-8 .border.bg-light .fw-bold").eq(2).text(formData.reviewStatus || "--");
            $(".col-lg-8 .border.bg-light .fw-bold").eq(3).text(formData.access || "--");
            };


$(document).ready(function() {
    // TODO remove
    if (!localStorage.getItem("articles")) {
        const intialData = [
            {id: "HS201", title: "Spring Kitchen Reset", category: "Kitchen Resources", value: "Free"},
            {id: "HS202", title: "Closet Cleanout Weekend Guide", category: "Home Organization", value: "Premium"},
            {id: "HS203", title: "Weekly Cleaning Planner Pack", category: "Printable Planner", value: "Free"}
        ];
        localStorage.setItem("articles", JSON.stringify(intialData));
    }

    $pubOptionsForm = $("#finalizationForm");
    $articleId = $("#articleId");
    $articleTitle = $("#articleTitle");
    $pubDate = $("#publicationDate");
    $distChannel = $("#distributionChannel");
    $reviewStatus = $("#reviewStatus");
    $articleAuthor = $("#editorName");
    $featured = $("#featuredOption");
    $access = $("#subscriberAccess");
    $editNotes = $("#editorialNotes");

    $articleCards = $("#articleCards");

    distChannels = loadOptions($distChannel);
    reviewStatuses = loadOptions($reviewStatus);
    featuredOptions = loadOptions($featured);
    accessTypes = loadOptions($access);
    defaultIdErrorMsg = $articleId.parent().find("div.invalid-feedback").text();


    $articleId.on("keyup", () => { checkArticleId($articleId); updatePreview(); });
    $articleTitle.on("keyup", () => { checkEmpty($articleTitle); updatePreview(); });
    $pubDate.on("change", () => { checkDate($pubDate); updatePreview(); });
    $(".channel-check").on("change", () => {
        updatePreview();
    });
    $reviewStatus.on("change", () => { checkOption($reviewStatus, reviewStatuses); updatePreview(); });
    $articleAuthor.on("keyup", () => { checkEmpty($articleAuthor); updatePreview(); });
    $featured.on("change", () => { checkOption($featured, featuredOptions); updatePreview(); });
    $access.on("change", () => { checkOption($access, accessTypes); updatePreview(); });
    $editNotes.on("keyup", updatePreview);
    // Not checking $editNotes

    $pubOptionsForm.on("submit", onSave);
    $("#clearForm").on("click", function() {
        clearForm();
        $("#jsonPreview").text("");
    });

   
    $("#articleSearch, #statusFilter").on("keyup change", function () {
        loadPubInfo();
            });

    loadPubInfo();
    $("#jsonPreview").text("");


});

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
