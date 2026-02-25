// Global variables
let $articleId, $articleTitle, $category, $format, $value;
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
    
    // Load jQuery objects
    if (!$articleId)
        $articleId = $("#articleId");
    if (!$articleTitle)
        $articleTitle = $("#articleTitle");
    if (!$category)
        $category = $("#category");
    if (!$format)
        $format = $("#format");
    if (!$value)
        $value = $("#value");
    if (!$notes)
        $notes = $("#notes");

    // Load options of "select" inputs
    if (!categories)
        categories = loadOptions($category);
    if (!formats)
        formats = loadOptions($format);
    if (!values) 
        values = loadOptions($value);

    article.id = $articleId.val().trim();
    setError($articleId, article.id == "");

    article.title = $articleTitle.val().trim();
    setError($articleTitle, article.title == "");
    
    article.category = $category.val().trim();
    setError($category, isValidOption(article.category, categories));

    article.format = $format.val().trim();
    setError($format, isValidOption(article.format, formats));

    article.value = $value.val().trim();
    setError($value, isValidOption(article.value, values));
    // Add article notes (no checking)
    article.notes = $notes.val().trim();
}

$(document).ready(function() {
    $("#articleForm").on("submit", checkForm);
});
