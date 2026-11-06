const totalText = document.getElementById("total");
const whatInput = document.getElementById("what");
const costInput = document.getElementById("cost");
const categorySelect = document.getElementById("category");
const addBtn = document.getElementById("addbtn");
const list = document.getElementById("list");

const presetBox = document.getElementById("presets");
const searchInput = document.getElementById("search");
const filter = document.getElementById("filter");
const lowtohigh = document.getElementById("sortl");
const hightolow = document.getElementById("sorth");
const oldest = document.getElementById("old");

const pricyBtn = document.getElementById("pricybtn");
const pricyText = document.getElementById("pricy");
const numList = document.getElementById("numlist");
const listedTotal = document.getElementById("listtotal");
const undoBtn = document.getElementById("undobtn");

const clearListBtn = document.getElementById("clearlist");
const clearInputBtn = document.getElementById("clearinput");

const budgetInput = document.getElementById("budget");
const budgetMsg = document.getElementById("budgetmsg");

let expenses = [];
let editingId = null;
let searchText = "";
let filterCategory = "All";
let sortMode = "none";
let lastDelete = null;
let budgetLimit = null;


const presets = [
    {what: "Dinner", cost: 500, category: "Food"},
    {what: "Bus", cost: 1000, category: "Transport"},
    {what: "Water", cost: 2000, category: "Bills"}
];

const categories = ["Food", "Transport", "Bills"];

function fillSelect(select, names) {
    select.innerHTML = "";
    for (let i = 0; i < names.length; i++) {
        const option = document.createElement("option");
        option.value = names[i];
        option.textContent = names[i];
        select.appendChild(option);
    }
}

function renderCategories() {
    fillSelect(categorySelect, categories);
    fillSelect(filter, ["All"].concat(categories));
}


function formatMoney(n) {
    return "₱" + n.toFixed(2);
}

function parseCost(num) {
    const trimmed = num.trim();
    if (trimmed === "") return null;
    const cost = Number(trimmed);
    if (!Number.isFinite(cost) || cost < 0) return null;
    return cost;
}

function getBudgetMessage(total) {
    if (budgetLimit === null) {
        return "";
    }
    if (total > budgetLimit) {
        return "Over budget by " + formatMoney(total - budgetLimit);
    }
    return "Left: " + formatMoney(budgetLimit - total);
}

function updateBudget() {
    const total = getTotal(expenses);
    const isOver = budgetLimit !== null && total > budgetLimit;

    totalText.classList.toggle("over", isOver);
    budgetMsg.textContent = getBudgetMessage(total);
    budgetMsg.classList.toggle("over", isOver);
    listedTotal.classList.toggle("over", isOver);
}

function getTotal(arr) {
    let total = 0;
    for (let i = 0; i < arr.length; i++){
        total = total + arr[i].cost;
    }
    return total;
}

function makeId() {
    return Date.now().toString() + Math.random().toString(36).slice(2, 8);
}

function startEdit(id) {
    editingId = id;
    render();
}

function saveEdit(exp, newWhat, newCost, newCategory){
    exp.what = newWhat;
    exp.cost = newCost;
    exp.category = newCategory;
    editingId = null;
    saveAndRender();
}

function cancelEdit() {
    editingId = null;
    render();
}

function createEditItem(exp) {
    const li = document.createElement("li");

    const whatEdit = document.createElement("input");
    whatEdit.value = exp.what;

    const costEdit = document.createElement("input");
    costEdit.value = exp.cost;

    const categoryEdit = document.createElement("select");
    for (let i = 0; i < categorySelect.options.length; i++){
        const option = document.createElement("option");
        option.value = categorySelect.options[i].value;
        option.textContent = categorySelect.options[i].textContent;
        categoryEdit.appendChild(option);
    }
    categoryEdit.value = exp.category;

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save";
    saveBtn.addEventListener("click", function() {
        const newWhat = whatEdit.value.trim();
        const newCost = parseCost(costEdit.value);
        
        if (newWhat === "" || newCost === null){
            alert("Fill in the what and valid cost");
            return;
        }
        saveEdit(exp, newWhat, newCost, categoryEdit.value);
    });

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", cancelEdit);

    li.append(whatEdit, costEdit, categoryEdit, saveBtn, cancelBtn);
    return li;
}

function deleteExpense(id) {
    const index = expenses.findIndex(function(e) { return e.id === id; });
    if (index === -1) {
        return;
    }
    lastDelete = { exp: expenses[index], index: index };
    expenses.splice(index, 1);
    showUndo();
    saveAndRender();
}

function clearAll() {
    if (expenses.length === 0) {
        return;
    }
    if (!confirm("Delete all expenses?")) {
        return;
    }
    lastDelete = {all: expenses.slice() };
    expenses = [];
    showUndo();
    saveAndRender();
}

function showUndo() {
    undoBtn.hidden = false;
}

function hideUndo() {
    undoBtn.hidden = true;
}

function restoreOne() {
    expenses.splice(lastDelete.index, 0, lastDelete.exp);
}

function restoreAll() {
    expenses = lastDelete.all;
}

function undoDelete() {
    if (lastDelete === null){
        return;
    }
    if (lastDelete.all) {
        restoreAll();
    } else{
        restoreOne();
    }
    lastDelete = null;
    hideUndo();
    saveAndRender();
}

function formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString();
}

function createItem(exp) {
    if ( exp.id === editingId){
        return createEditItem(exp);
    }
    const li = document.createElement("li");
   
    const item = document.createElement("span");
    item.textContent = exp.what + " - " + formatMoney(exp.cost) + " (" + exp.category + ") " + formatDate(exp.date);
    
    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", function() {
        startEdit(exp.id);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", function() {
        deleteExpense(exp.id);
    });
    
    li.append(item, editBtn, deleteBtn);
    return li;
}

function getVisible() {
    const visible = [];

    for (let i = 0; i < expenses.length; i++) {
        const exp = expenses[i];

        const matchSearch = exp.what.toLowerCase().includes(searchText);
        const matchCategory = filterCategory === "All" || exp.category === filterCategory;

        if (matchSearch && matchCategory) {
            visible.push(exp);
        }
    }

    if (sortMode === "low"){
        visible.sort(function(a, b) { return a.cost - b.cost; });
    }
    if (sortMode === "high"){
        visible.sort(function(a, b) { return b.cost - a.cost; });
    }
    if (sortMode === "old"){
        visible.sort(function(a, b) { return a.date - b.date; });
    }

    return visible;
}

function getMostExpensive(arr) {
    if (arr.length === 0) {
        return null;
    }
    let top = arr[0];
    for (let i = 1; i < arr.length; i++){
        if(arr[i].cost > top.cost) {
            top = arr[i];
        }
    }
    return top;
}

function showMostExpensive() {
    const top = getMostExpensive(expenses);
    if (top === null) {
        pricyText.textContent = "No items yet";
        return;
    }
    pricyText.textContent = top.what + " - " + formatMoney(top.cost) + " (" + top.category + ")";
}

function showListedInfo(visible) {
    numList.textContent = visible.length;
    listedTotal.textContent = formatMoney(getTotal(visible));
}

function toggleSort(mode) {
    if (sortMode === mode) {
        sortMode = "none";
    } else {
        sortMode = mode;
    }
    render();
}

function updateSortButtons() {
    lowtohigh.classList.toggle("active", sortMode === "low");
    hightolow.classList.toggle("active", sortMode === "high");
    oldest.classList.toggle("active", sortMode === "old");
}

function saveExpenses() {
    try {
        localStorage.setItem("expenses", JSON.stringify(expenses));
    } catch (error) {
        console.error("could not save:", error);
    }
}

function isValidExpense(exp) {
    return exp !== null
    && typeof exp === "object"
    && typeof exp.what === "string"
    && typeof exp.cost === "number"
    && Number.isFinite(exp.cost)
    && typeof exp.category === "string";
}

function fixExpense(exp) {
    if (typeof exp.id !== "string") {
        exp.id = makeId(); 
    }
    if (typeof exp.date !== "number") {
        exp.date = Date.now();
    }
    return exp;
}

function loadExpenses() {
    try {
        const saved = localStorage.getItem("expenses");
        if (saved === null) {
            return;
        }
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) {
            return;
        }
        expenses = parsed.filter(isValidExpense).map(fixExpense);
    } catch (error) {
        console.error("could not load:", error);
        expenses = [];
    }
}

function saveAndRender() {
    saveExpenses();
    render();
}

function showEmptyMessage() {
    const li = document.createElement("li");
    li.textContent = "No expenses yet";
    list.appendChild(li);
}

function render() {
    pricyText.textContent = "";
    list.innerHTML = "";

    const visible = getVisible();
    if (visible.length === 0) {
        showEmptyMessage();
    }

    for ( let i = 0; i < visible.length; i++ ) {
        list.appendChild(createItem(visible[i]));
    }
    totalText.textContent = formatMoney(getTotal(expenses));
    showListedInfo(visible);
    updateSortButtons();
    updateBudget();
}

function clearForm() {
    whatInput.value = "";
    costInput.value = "";
    categorySelect.selectedIndex = 0;
    pricyText.textContent = "";
}

function addExpense(what, cost, category){
    lastDelete = null;
    hideUndo();
    expenses.unshift({ id:makeId(), what: what, cost: cost, category: category, date: Date.now() });
    saveAndRender();
}

function createPresetBtn(p) {
    const btn = document.createElement("button");
    btn.textContent = p.what + " - " + p.cost;
    btn.addEventListener("click", function(){
        addExpense(p.what, p.cost, p.category);
    });
    return btn;
}

function renderPreset() {
    for (let i = 0; i < presets.length; i++) {
        presetBox.appendChild(createPresetBtn(presets[i]));
    }
}

function submitForm() {
    const what = whatInput.value.trim();
    const cost = parseCost(costInput.value);
    const category = categorySelect.value;

    if ( what === "" || cost === null) {
        alert("Fill in the what and valid cost");
        return;
    }
    sortMode = "none";
    addExpense(what, cost, category);
    clearForm();
    whatInput.focus();
}

function handleEnter(event) {
    if (event.key === "Enter") {
        submitForm();
    }
}


addBtn.addEventListener("click", submitForm);
whatInput.addEventListener("keydown", handleEnter);
costInput.addEventListener("keydown", handleEnter);
categorySelect.addEventListener("keydown",  handleEnter);

searchInput.addEventListener("input", function() {
    searchText = searchInput.value.trim().toLowerCase();
    render();
});

filter.addEventListener("change", function() {
    filterCategory = filter.value;
    render();
});

lowtohigh.addEventListener("click", function() {
    toggleSort("low");
});

hightolow.addEventListener("click", function() {
    toggleSort("high");
});

oldest.addEventListener("click", function() {
    toggleSort("old");
});

pricyBtn.addEventListener("click", function() {
    showMostExpensive();
});

undoBtn.addEventListener("click", function() {
    undoDelete();
});

clearListBtn.addEventListener("click", function(){
    clearAll();
});

clearInputBtn.addEventListener("click", clearForm);

budgetInput.addEventListener("input", function() {
    budgetLimit = parseCost(budgetInput.value);
    render();
});

renderCategories();
renderPreset();
loadExpenses();
render();