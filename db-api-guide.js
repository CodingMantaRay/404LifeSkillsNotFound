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

// -----------------------------------------
// Articles - content.js, finalize.js      |
// -----------------------------------------

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

// ----------------------------------
// Cart - cart.js, billing.js       |
// ----------------------------------

// Notes:
// - Will need to generate a session ID for the current user
// - Probably store the session ID in local storage (since we have no user authentication)
const sessionId = "session1";

// Example of how to generate a random session ID:
const crypto = require("crypto");
let sessionId2 = Date.now().toString(16);
sessionId2 += crypto.randomBytes(4).toString('hex');

// Get cart
$.ajax({
    url: '/api/cart?' + $.param({ sessionId: sessionId }),
    type: 'GET',
    contentType: 'application/json',
    success: function (response) { /* do something */ },
    error: function (xhr) { /* do something */ }
});

// Add product to cart (If product exists, adds 1 to quantity)
$.ajax({
    url: '/api/cart?' + $.param({
        sessionId: sessionId,
        productId: "prod1"
    }),
    type: 'POST',
    contentType: 'application/json',
    success: function (response) { /* do something */ },
    error: function (xhr) { /* do something */ }
});

// Update product quantity
$.ajax({
    url: '/api/cart?' + $.param({
        sessionId: sessionId,
        productId: "prod1",
        quantity: 3
    }),
    type: 'POST',
    contentType: 'application/json',
    success: function (response) { /* do something */ },
    error: function (xhr) { /* do something */ }
});

// Delete product from cart
$.ajax({
    url: '/api/cart?' + $.param({
        sessionId: sessionId,
        productId: "prod1"
    }),
    type: 'DELETE',
    contentType: 'application/json',
    success: function (response) {
        $pre.text(JSON.stringify(response, null, 2));
    },
    error: function (xhr) {
        $pre.text('AJAX Error: Status ' + xhr.status);
    }
});

// Clear cart
$.ajax({
    url: '/api/cart?' + $.param({
        sessionId: sessionId
    }),
    type: 'DELETE',
    contentType: 'application/json',
    success: function (response) {
        $pre.text(JSON.stringify(response, null, 2));
    },
    error: function (xhr) {
        $pre.text('AJAX Error: Status ' + xhr.status);
    }
});// -----------------------------------------
// Purchases - billing.js, returns.js      |
// -----------------------------------------

// Make purchase
let purchaseId = null;
$.ajax({
    url: '/api/purchase',
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({ sessionId: 'ses1' }),
    success: function (response) {
        // Save purchaseId for sending billing info
        purchaseId = response.purchaseId;
        // do something
    },
    error: function (xhr) { /* do something */ }
});

// Add billing info
// - Need purchaseId from making the purchase
$.ajax({
    url: '/api/billing',
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({
        "purchaseId": purchaseId,
        "fullName": "John Doe",
        "address": "123 Main St",
        "city": "NYC",
        "state": "NY",
        "zip": "11208",
        "creditCardNum": "1111111111111111",
        "expDate": "11/11",
        "secCode": "333",
        "shippingDetails": ""
    }),
    success: function (response) { /* do something */ },
    error: function (xhr) { /* do something */ }
});
