// Global variables
let $articleId, $articleTitle, $category, $format, $value, $notes;
let categories, formats, values;

// function assignRandomID() {
//     // TODO check if ID is unique
//     return Math.floor(Math.random() * 256);
// }

function setError(widget, isError) {
    // TODO - update UI to reflect error
    console.log("error " + isError);
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

function checkForm(event) {
    event.preventDefault();
    
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
        addArticle(article);
        clearForm();
        loadArticles();
    }
}

function clearForm() {
    setError($articleId, false);
    $articleId.val("");
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
    let articlesJSON = localStorage.getItem("articles");
    if (articlesJSON == null)
        return;
    let articles = JSON.parse(articlesJSON);
    if (!Array.isArray(articles))
        throw new Error("localStorage item \"articles\" is not an array");

    // TODO
    let html = '<div class="row g-3">';
        for (article of articles) {
            html += '<div class="col-md-6"><div class="border rounded p-3 h-100 bg-white">';
            html += `<div class="fw-bold">${article.id}</div>`;
            html += `<div class="text-muted small">${article.category} • ${article.format} • ${article.value}</div>`;
            html += `<div class="mt-2">${article.title}</div>`;
            html += "</div></div>";
        }
    html += "</div>";
    $("#articleEntries").html(html);
}

$(document).ready(function() {
    let $articleForm = $("#articleForm");
    $articleForm.on("submit", checkForm);

    $articleId = $($articleForm.find("#articleId")[0]);
    $articleTitle = $($articleForm.find("#articleTitle")[0]);
    $category = $($articleForm.find("#category")[0]);
    $format = $($articleForm.find("#format")[0]);
    $value = $($articleForm.find("#value")[0]);
    $notes = $($articleForm.find("#notes")[0]);
    
    categories = loadOptions($category);
    formats = loadOptions($format);
    values = loadOptions($value);

    loadArticles();
});
