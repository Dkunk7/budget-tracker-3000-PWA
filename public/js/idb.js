let db;

const request = indexedDB.open(`budget_tracker_3000`, 1);

// this event will emit if the db version changes (including when its created)
request.onupgradeneeded = function(event) {
    // save a reference to the database
    const db = event.target.result;
    // create an object store (table) 
    db.createObjectStore(`new_budget`, { autoIncrement: true });
};

request.onsuccess = function(event) {
    // when db is successfully created with object store or connected successfully, save global reference to db
    db = event.target.result;

    // function to check if online, and upload data?
    if (navigator.onLine) {
        uploadBudget();
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
}

// this executes if i try to submit new transaction and there's no connection
function saveRecord(record) {
    // opn new transaction with the database
    const transaction = db.transaction([`new_budget`], `readwrite`);

    // access the new_budget object store
    const budgetObjectStore = transaction.objectStore(`new_budget`);

    // add record to store
    budgetObjectStore.add(record);
}

function uploadBudget() {
    // open transaction
    const transaction = db.transaction([`new_budget`], `readwrite`);

    // access object store
    const budgetObjectStore = transaction.objectStore(`new_budget`);

    // get all records from store and set it to a variabe
    const getAll = budgetObjectStore.getAll();

    // on successful getAll, run this
    getAll.onsuccess = function() {
        // if there's data, send it to api server
        if (getAll.result.length > 0) {
            fetch(`/api/transaction`, {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    // open another transaction
                    const transaction = db.transaction([`new_budget`], `readwrite`);
                    //access object store
                    const budgetObjectStore = transaction.objectStore(`new_budget`);
                    // clear all items in store
                    budgetObjectStore.clear();

                    alert(`All transactions have been submitted.`);
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };
};

// listen for app coming back online
window.addEventListener(`online`, uploadBudget);