// Global variables
let $articleIdeaCards;
let cachedArticles = [];

//-----------------------------------------------------
// Utility Functions                                  |
// ----------------------------------------------------

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

// --------------------------------------------------------------------------

function updateApprovalHeaderStats(articles) {
    const counts = {
        Pending: 0,
        Approved: 0,
        Rejected: 0,
        Revisions: 0
    };

    articles.forEach(article => {
        if (article.status === "Approved") {
            counts.Approved++;
        } else if (article.status === "Rejected") {
            counts.Rejected++;
        } else if (article.status === "Revisions Requested") {
            counts.Revisions++;
        } else {
            counts.Pending++;
        }
    });

    $("#statPending").text(counts.Pending);
    $("#statApproved").text(counts.Approved);
    $("#statRejected").text(counts.Rejected);
    $("#statRevisions").text(counts.Revisions);

    $("#submissionCountBadge").text(`${counts.Pending} pending items${counts.Pending === 1 ? "" : "s"}`);

}

function loadArticleIdeas(articleIdeas = cachedArticles) {
    if (!articleIdeas)
        return;

    const searchTerm = $("#approvalSearch").val().trim().toLowerCase();
    const statusFilter = $("#statusFilter").val();
    const categoryFilter = $("#categoryFilter").val();

    let html = "";
    if (articleIdeas.length == 0) {
        html = `<!-- Empty State -->
                     <div id="emptyState" class="col-12 text-center py-4 d-none">
                        <i class="bi bi-journal-x" style="font-size: 2.5rem; color: #c97a3a;"></i>
                        <p class="mt-2 text-muted mb-0">No submissions are waiting for review.</p>
                     </div>`;
    } else {
        for (let idea of articleIdeas) {
            const matchesSearch = idea.id.toLowerCase().includes(searchTerm) || idea.title.toLowerCase().includes(searchTerm) || idea.author.toLowerCase().includes(searchTerm);
            const matchesStatusFilter = (statusFilter === "All" || idea.status === statusFilter);
            const matchesCategoryFilter = (categoryFilter === "All" || idea.category === categoryFilter);
            if (matchesSearch && matchesStatusFilter && matchesCategoryFilter) {
                html += `<div class="col-12">
                            <div class="entry-card border rounded p-3 bg-white" style="border-left: 4px solid brown;">
                            <div class="d-flex justify-content-between align-items-start flex-wrap gap-3">
                                <div>
                                    <div class="fw-bold">${idea.id} — ${idea.title}</div>
                                    <div class="mt-1 d-flex flex-wrap gap-1">
                                        <span class="badge text-bg-brown">${idea.category}</span>
                                        <span class="badge text-bg-brown-light">${idea.status}</span>
                                        <span class="badge text-bg-brown-light">Author: ${idea.author}</span>
                                    </div>
                                </div>
                                <div class="d-flex flex-wrap gap-2">
                                    ${idea.status == "Approved" ?
                                        `<button type="button" class="btn btn-sm btn-brown undoStatusBtn" data-id="${idea.id}" data-status="${idea.status}">Undo Approval</button>`
                                      : (idea.status == "Rejected" ?
                                        `<button type="button" class="btn btn-sm btn-brown undoStatusBtn" data-id="${idea.id}" data-status="${idea.status}">Undo Rejection</button>`
                                      :
                                        `<button type="button" class="btn btn-sm btn-brown approveBtn" data-id="${idea.id}" data-status="${idea.status}">Approve</button>
                                         <button type="button" class="btn btn-sm btn-outline-danger rejectBtn" data-id="${idea.id}" data-status="${idea.status}">Reject</button>
                                         <button type="button" class="btn btn-sm btn-outline-brown requestRevisionsBtn" data-id="${idea.id}" data-status="${idea.status}">Request Revisions</button>`
                                      )
                                    }
                                </div>
                            </div>

                            <div class="mt-3">
                                <p class="mb-2 text-muted small">
                                    ${idea.contentSnippet}
                                </p>
                                <div class="small text-muted">
                                    ${idea.preferredDistChannel && idea.preferredDistChannel !== "" 
                                        ? "Suggested Distribution: " + idea.preferredDistChannel : ""}
                                </div>
                                <p class="mb-2 text-muted small">
                                    ${idea.notes && idea.notes !== "" 
                                        ? "Notes: " + idea.notes : ""}
                                </p>
                            </div>
                            </div>
                        </div>`;
            }
        }
    }

    $articleIdeaCards.html(html);
    $articleIdeaCards.find(".approveBtn").on("click", onApprove);
    $articleIdeaCards.find(".rejectBtn").on("click", onReject);
    $articleIdeaCards.find(".requestRevisionsBtn").on("click", onRequestRevisions);
    $articleIdeaCards.find(".undoStatusBtn").on("click", onUndoStatus);
}

function clearFilters() {
    $("#approvalSearch").val("");
    $("#statusFilter").val("All");
    $("#categoryFilter").val("All");
    loadArticleIdeas();
}

/**
 * Changes the status of a given article idea in storage
 */
function updateStatus(articleId, status) {
    
    $.ajax({
        url: "/api/submissions/status",
        type: "PUT",
        contentType: "application/json",
        data: JSON.stringify({
            id: articleId,
            status: status
        }),
        success: function(response) {
           if (response.success) {
                fetchAndLoad();
            } else {
                alert(`Failed to update status for article ${articleId}`);
            }
            $("#apiStatus").html(`
                <div class="alert alert-success mb-0">
                    <i class="bi bi-check-circle-fill me-2"></i>
                    <strong>Server Status:</strong> Succesfully updated ${articleId} to ${status}
                    </div>
            `);
        },
        error: function() {
            alert(`Failed to update status for article ${articleId}`);
            
        }
        });
    }

    
        

/**
 * Handler for "Approve" button.
 */
function onApprove() {
    const articleId = $(this).attr("data-id");
    if (!articleId)
        return;
    updateStatus(articleId, "Approved");
}

/**
 * Handler for "Reject" button.
 */
function onReject() {
    const articleId = $(this).attr("data-id");
    if (!articleId)
        return;
    updateStatus(articleId, "Rejected");
}

/**
 * Handler for "Request Revisions" button.
 */
function onRequestRevisions() {
    const articleId = $(this).attr("data-id");
    if (!articleId)
        return;
    updateStatus(articleId, "Revisions Requested");
}

function onUndoStatus() {
    const articleId = $(this).attr("data-id");
    if (!articleId)
        return;
    updateStatus(articleId, "Pending");
}

function updatePreview(articleIdea, plannedStatus) {
    // TODO
    /*const jsonString = JSON.stringify(articleIdea, null, 2);
    $("#jsonPreview").text(jsonString);*/

    $("#previewTitle").text(articleIdea.title || "--");
    $("#previewId").text(articleIdea.id || "--");
    $("#previewCategory").text(articleIdea.category || "--");
    $("#previewAuthor").text(articleIdea.author || "--");
    
    const statusText = {
        "Pending": "Pending Submission",
        "Approved": "Submission Approved",
        "Rejected": "Submission Rejected",
        "Revisions Requested": "Revisions Requested"
    }
    const statusInfo = {
        "Pending": "Awaiting backend processing",
        "Approved": "Reviewed by editor and approved",
        "Rejected": "Reviewed by editor and rejected",
        "Revisions Requested": "Editor has requested revisions"
    }

    $("#previewStatus").text(statusText[articleIdea.status] || "--");
    $("#previewStatusInfo").text(statusInfo[articleIdea.status] || "--");

    $("#previewPlannedStatus").text(statusText[plannedStatus] || "--");
    $("#previewPlannedStatusInfo").text(statusInfo[plannedStatus] || "--");
};


$(document).ready(function () {
    $articleIdeaCards = $("#submissionCards");

    // Load articles from the database via API, then render
    window.fetchAndLoad = function() {
        $.ajax({
            url: '/api/submissions',
            type: 'GET',
            success: function (data) {
               cachedArticles = data;
                loadArticleIdeas(data);
               updateApprovalHeaderStats(data); 

            },
            error: function () {
               $("#apiStatus").html(`
                    <div class="alert alert-danger mb-0">
                        <i class="bi bi-x-circle-fill me-2"></i>
                        <strong>Server Status:</strong> Failed to fetch article ideas
                    </div>
                `);
               loadArticleIdeas();
            }
        });
    }

    $("#refreshBtn").on("click", fetchAndLoad);
    $("#clearFiltersBtn").on("click", clearFilters);

    $("#approvalSearch, #statusFilter, #categoryFilter").on("keyup change", function () {
        loadArticleIdeas();
    });

    fetchAndLoad();
    $("#jsonPreview").text("");
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