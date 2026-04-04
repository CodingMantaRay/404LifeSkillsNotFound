// --------------------------------
// Subscribers - app.js           |
// --------------------------------

// Get list of all subscribers
$.ajax({
    url: '/api/subscribers',
    type: 'GET',
    success: function (response) { /* do something */ },
    error: function (xhr) { /* do something */ }
});

// Add new subscriber
const subscriber = {
    name: "Jane Doe",
    email: "jdoe@email.com",
    phone: "1112223333",
    address: "123 Main St",
    ageOrYear: 23
};
$.ajax({
    url: '/api/subscribers',
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(subscriber),
    success: function (response) { /* do something */ },
    error: function (xhr) { /* do something */ }
});

// Edit subscriber
$.ajax({
    url: '/api/subscribers',
    type: 'PUT',
    contentType: 'application/json',
    data: JSON.stringify(subscriber),
    success: function (response) { /* do something */ },
    error: function (xhr) { /* do something */ }
});

// Delete subscriber
const id = 4;
$.ajax({
    url: '/api/subscribers',
    type: 'DELETE',
    contentType: 'application/json',
    data: JSON.stringify({ id: id }),
    success: function (response) { /* do something */ },
    error: function (xhr) { /* do something */ }
});

// ------------------------------------------------------------------------

// ------------------------------------------
// Submissions - submit.js, approval.js     |
// ------------------------------------------

// Get list of all submissions
$.ajax({
    url: '/api/submissions',
    type: 'GET',
    success: function (response) { /* do something */ },
    error: function (xhr) { /* do something */ }
});

// Add or update submission
const submission = {
    "id": "HS300",
    "title": "Article Title Here",
    "author": "John Doe",
    "category": "DIY Home Tips",
    "contentSnippet": "Content is here.",
    "preferredDistChannel": ["Website Feature", "Blog Feature"],
    "notes": "N/A"
};
$.ajax({
    url: '/api/submissions',
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(submission),
    success: function (response) { /* do something */ },
    error: function (xhr) { /* do something */ }
});

// Set status of article to Approved/Rejected/etc.
$.ajax({
    url: '/api/approve',
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({
        id: "HS433",
        status: "Rejected"
    }),
    success: function (response) { /* do something */ },
    error: function (xhr) { /* do something */ }
}); 

// ----------------------------
// Articles - content.js      |
// ----------------------------

// Get list of all articles
$.ajax({
    url: '/api/articles',
    type: 'GET',
    contentType: 'application/json',
    success: function (response) { /* do something */ },
    error: function (xhr) { /* do something */ }
});

// Create or update article
const article = {
    "id": "A101",
    "title": "Fix a leaky faucet",
    "category": "DIY & Repairs",
    "format": "Blog Post",
    "value": "Free",
    "notes": "Beginner friendly"
};
$.ajax({
    url: '/api/articles',
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(article),
    success: function (response) { /* do something */ },
    error: function (xhr) { /* do something */ }
});

// Delete article
const articleId = "A101";
$.ajax({
    url: '/api/articles',
    type: 'DELETE',
    contentType: 'application/json',
    data: JSON.stringify({
        "id": articleId,
    }),
    success: function (response) { /* do something */ },
    error: function (xhr) { /* do something */ }
}); 

// -------------------------------------
// Products - cart.js, billing.js      |
// -------------------------------------

// Get list of all products
$.ajax({
    url: '/api/products',
    type: 'GET',
    success: function (response) { /* do something */ },
    error: function (xhr) { /* do something */ }
});

// Add or edit product
const product = {
    "id": "HS101",
    "description": "Desc",
    "category": "Wellness at Home",
    "unit": "Bundle",
    "price": "12.12",
    "weight": "light download",
    "color": "blue",
    "details": ""
};
$.ajax({
    url: '/api/products',
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(product),
    success: function (response) { /* do something */ },
    error: function (xhr) { /* do something */ }
});

// Delete product
const productId = "HS101";
$.ajax({
    url: '/api/products',
    type: 'DELETE',
    contentType: 'application/json',
    data: JSON.stringify({ id: productId }),
    success: function (response) { /* do something */ },
    error: function (xhr) { /* do something */ }
});