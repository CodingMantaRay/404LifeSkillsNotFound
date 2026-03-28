// Global variables
let $articleIdeaCards;

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

function loadArticleIdeas() {
    let articleIdeas = getItems("articleIdeas");
    if (articleIdeas == undefined)
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
    let articleIdea = getItems("articleIdeas", []).filter((item)=>item.id==articleId);
    if (articleIdea.length == 0)
        return;
    articleIdea = articleIdea[0];
    updatePreview(articleIdea, status);
    articleIdea["status"] = status;
    $("#jsonPreview").text(JSON.stringify(articleIdea, null, 2));
    updateItem("articleIdeas", articleIdea);
    loadArticleIdeas();
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
    // TODO remove
    if (!localStorage.getItem("articleIdeas")) {
        const initialData = [
            { id: "HS301", title: "Sunday Reset Routine", author: "Lauren", category: "Home Organization", contentSnippet: "A simple routine to prepare the home for the week ahead.", preferredDistChannel: "", notes: "", status: "Pending" },
            { id: "HS302", title: "5-Minute Kitchen Reset", author: "Lauren", category: "Kitchen Resources", contentSnippet: "Quick habits that help keep the kitchen clean and calm.", preferredDistChannel: "", notes: "", status: "Pending" },
            { id: "HS303", title: "Weekly Cleaning Checklist", author: "Lauren", category: "Printable Planners", contentSnippet: "A printable guide readers can use to stay on track all week.", preferredDistChannel: "", notes: "", status: "Pending" }
        ];
        localStorage.setItem("articleIdeas", JSON.stringify(initialData));
    }

    $articleIdeaCards = $("#submissionCards");

    $("#refreshBtn").on("click", loadArticleIdeas);
    $("#clearFiltersBtn").on("click", clearFilters);

    $("#approvalSearch, #statusFilter, #categoryFilter").on("keyup change", function () {
        loadArticleIdeas();
    });

    loadArticleIdeas();
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