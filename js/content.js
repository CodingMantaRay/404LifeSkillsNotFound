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
        addNewArticle(article);
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

function addNewArticle(article) {
    let articlesJson = localStorage.getItem("articles");
    let articles;
    if (articlesJson == null) {
        articles = [];
    } else {
        articles = JSON.parse(articlesJson);
        if (!Array.isArray(articles))
            throw new Error("localStorage item \"articles\" is not an array");
    }
    articles.push(article);
    localStorage.setItem("articles", JSON.stringify(articles));
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

    $articleId = $articleForm.children("#articleId");
    $articleTitle = $articleForm.children("#articleTitle");
    $category = $articleForm.children("#category");
    $format = $articleForm.children("#format");
    $value = $articleForm.children("#value");
    $notes = $articleForm.children("#notes");
    
    categories = loadOptions($category);
    formats = loadOptions($format);
    values = loadOptions($value);

    loadArticles();
});
