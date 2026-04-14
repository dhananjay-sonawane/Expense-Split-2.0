// State
let members = JSON.parse(localStorage.getItem('expense_members')) || [];
let expenses = JSON.parse(localStorage.getItem('expense_expenses')) || [];
let history = JSON.parse(localStorage.getItem('expense_history')) || [];
let sessionTitle = localStorage.getItem('expense_title') || '';
let editMemberId = null;
let editExpenseId = null;
let currentSettlementData = null;

let selectedDataToSend = null; // Stores data picked in step 1 of send modal
let selectedTitleToSend = '';

function saveData() {
    localStorage.setItem('expense_members', JSON.stringify(members));
    localStorage.setItem('expense_expenses', JSON.stringify(expenses));
    localStorage.setItem('expense_history', JSON.stringify(history));
    localStorage.setItem('expense_title', sessionTitle);
}

// ID Generator
const generateId = () => Math.random().toString(36).substr(2, 9);

// DOM Elements
const sessionTitleInput = document.getElementById('session-title');

const memberForm = document.getElementById('member-form');
const memberNameInput = document.getElementById('member-name');
const memberList = document.getElementById('member-list');
const cancelEditMemberBtn = document.getElementById('cancel-edit-member');

const expenseForm = document.getElementById('expense-form');
const expensePayerSelect = document.getElementById('expense-payer');
const expenseAmountInput = document.getElementById('expense-amount');
const expenseDescInput = document.getElementById('expense-desc');
const expenseList = document.getElementById('expense-list');
const cancelEditExpenseBtn = document.getElementById('cancel-edit-expense');

const calculateBtn = document.getElementById('calculate-btn');
const saveBtn = document.getElementById('save-btn');
const resetBtn = document.getElementById('reset-btn');
const settlementResults = document.getElementById('settlement-results');

const homeView = document.getElementById('home-view');
const historyView = document.getElementById('history-view');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');

// Sidebar Elements
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const hamburgerBtn = document.getElementById('hamburger-btn');
const closeSidebarBtn = document.getElementById('close-sidebar');

const navHome = document.getElementById('nav-home');
const navHistory = document.getElementById('nav-history');
const navSend = document.getElementById('nav-send');

// Send Modal Elements
const sendModal = document.getElementById('send-modal');
const sendStep1 = document.getElementById('send-step-1');
const sendStep2 = document.getElementById('send-step-2');
const sendHistoryList = document.getElementById('send-history-list');

const closeSendModal = document.getElementById('close-send-modal');
const backSendModal = document.getElementById('back-send-modal');

const btnSendWhatsapp = document.getElementById('btn-send-whatsapp');
const btnSendEmail = document.getElementById('btn-send-email');
const btnSendSms = document.getElementById('btn-send-sms');

window.addEventListener('DOMContentLoaded', () => {
    sessionTitleInput.value = sessionTitle;
    renderMembers();
    renderExpenseOptions();
    renderExpenses();
    renderHistory();
    currentSettlementData = getSettlementData(members, expenses);
});

sessionTitleInput.addEventListener('input', (e) => {
    sessionTitle = e.target.value;
    saveData();
});


// --- SIDEBAR & VIEW LOGIC ---

function openSidebar() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('open');
}

function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('open');
}

hamburgerBtn.addEventListener('click', openSidebar);
closeSidebarBtn.addEventListener('click', closeSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);

function showHome() {
    homeView.classList.remove('hidden');
    historyView.classList.add('hidden');
    closeSidebar();
}

function showHistory() {
    homeView.classList.add('hidden');
    historyView.classList.remove('hidden');
    renderHistory();
    closeSidebar();
}

navHome.addEventListener('click', showHome);
navHistory.addEventListener('click', showHistory);

// --- MEMBERS LOGIC ---

memberForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = memberNameInput.value.trim();
    if (!name) return;

    if (editMemberId) {
        const member = members.find(m => m.id === editMemberId);
        const oldName = member.name;
        member.name = name;
        expenses.forEach(exp => {
            if (exp.payerName === oldName) exp.payerName = name;
        });
        editMemberId = null;
        memberForm.querySelector('button[type="submit"]').textContent = 'Add Member';
        cancelEditMemberBtn.classList.add('hidden');
    } else {
        if (members.find(m => m.name.toLowerCase() === name.toLowerCase())) {
            alert('Member already exists!');
            return;
        }
        members.push({ id: generateId(), name });
    }

    memberNameInput.value = '';
    renderMembers();
    renderExpenseOptions();
    renderExpenses();
    saveData();
});

cancelEditMemberBtn.addEventListener('click', () => {
    editMemberId = null;
    memberNameInput.value = '';
    memberForm.querySelector('button[type="submit"]').textContent = 'Add Member';
    cancelEditMemberBtn.classList.add('hidden');
});

function renderMembers() {
    memberList.innerHTML = '';
    members.forEach(member => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${member.name}</span>
            <div class="item-actions">
                <button class="edit-btn" onclick="editMember('${member.id}')">Edit</button>
                <button class="delete-btn" onclick="deleteMember('${member.id}')">Delete</button>
            </div>
        `;
        memberList.appendChild(li);
    });
}

window.editMember = (id) => {
    const member = members.find(m => m.id === id);
    if (!member) return;
    memberNameInput.value = member.name;
    editMemberId = id;
    memberForm.querySelector('button[type="submit"]').textContent = 'Update';
    cancelEditMemberBtn.classList.remove('hidden');
};

window.deleteMember = (id) => {
    const member = members.find(m => m.id === id);
    if (expenses.some(e => e.payerName === member.name)) {
        alert('Cannot delete member, they have existing expenses. Delete expenses first.');
        return;
    }
    members = members.filter(m => m.id !== id);
    renderMembers();
    renderExpenseOptions();
    saveData();
};

function renderExpenseOptions() {
    expensePayerSelect.innerHTML = '<option value="" disabled selected>Select Payer</option>';
    members.forEach(member => {
        const option = document.createElement('option');
        option.value = member.name;
        option.textContent = member.name;
        expensePayerSelect.appendChild(option);
    });
}

// --- EXPENSES LOGIC ---

expenseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const payerName = expensePayerSelect.value;
    const amount = parseFloat(expenseAmountInput.value);
    const desc = expenseDescInput.value.trim() || 'Expense';

    if (!payerName || isNaN(amount) || amount <= 0) return;

    if (editExpenseId) {
        const exp = expenses.find(e => e.id === editExpenseId);
        exp.payerName = payerName;
        exp.amount = amount;
        exp.desc = desc;

        editExpenseId = null;
        expenseForm.querySelector('button[type="submit"]').textContent = 'Add Expense';
        cancelEditExpenseBtn.classList.add('hidden');
    } else {
        expenses.push({ id: generateId(), payerName, amount, desc });
    }

    expenseAmountInput.value = '';
    expenseDescInput.value = '';
    expensePayerSelect.value = '';
    renderExpenses();
    saveData();
});

cancelEditExpenseBtn.addEventListener('click', () => {
    editExpenseId = null;
    expenseForm.reset();
    expenseForm.querySelector('button[type="submit"]').textContent = 'Add Expense';
    cancelEditExpenseBtn.classList.add('hidden');
});

function renderExpenses() {
    expenseList.innerHTML = '';
    let total = 0;
    expenses.forEach(exp => {
        total += exp.amount;
        const li = document.createElement('li');
        li.innerHTML = `
            <span><strong>${exp.payerName}</strong> paid ₹${exp.amount.toFixed(2)} <small>(${exp.desc})</small></span>
            <div class="item-actions">
                <button class="edit-btn" onclick="editExpense('${exp.id}')">Edit</button>
                <button class="delete-btn" onclick="deleteExpense('${exp.id}')">Delete</button>
            </div>
        `;
        expenseList.appendChild(li);
    });

    if (expenses.length > 0) {
        const totalLi = document.createElement('li');
        totalLi.style.fontWeight = 'bold';
        totalLi.style.justifyContent = 'center';
        totalLi.textContent = `Total Expenses: ₹${total.toFixed(2)}`;
        expenseList.appendChild(totalLi);
    }
}

window.editExpense = (id) => {
    const exp = expenses.find(e => e.id === id);
    if (!exp) return;
    expensePayerSelect.value = exp.payerName;
    expenseAmountInput.value = exp.amount;
    expenseDescInput.value = exp.desc;
    editExpenseId = id;
    expenseForm.querySelector('button[type="submit"]').textContent = 'Update';
    cancelEditExpenseBtn.classList.remove('hidden');
};

window.deleteExpense = (id) => {
    expenses = expenses.filter(e => e.id !== id);
    renderExpenses();
    saveData();
};


// --- SETTLEMENT ALGORITHM ---

function getSettlementData(memList, expList) {
    if (memList.length === 0) return null;
    
    const totalExpense = expList.reduce((sum, exp) => sum + exp.amount, 0);
    const share = totalExpense / memList.length;

    const balancesMap = {};
    memList.forEach(m => balancesMap[m.name] = -share);
    
    expList.forEach(exp => {
        if (balancesMap[exp.payerName] !== undefined) {
             balancesMap[exp.payerName] += exp.amount;
        }
    });

    const creditors = [];
    const debtors = [];
    for (const [name, balance] of Object.entries(balancesMap)) {
        const roundedBal = Math.round(balance * 100) / 100;
        if (roundedBal > 0.01) creditors.push({ name, amount: roundedBal });
        else if (roundedBal < -0.01) debtors.push({ name, amount: Math.abs(roundedBal) });
    }

    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => a.amount - b.amount);

    const transactions = [];
    let i = 0; let j = 0;

    while (i < creditors.length && j < debtors.length) {
        const creditor = creditors[i];
        const debtor = debtors[j];
        const minAmount = Math.min(creditor.amount, debtor.amount);
        const settledAmount = Math.round(minAmount * 10) / 10;

        if (settledAmount > 0) {
            transactions.push({ from: debtor.name, to: creditor.name, amount: settledAmount });
        }
        creditor.amount -= minAmount;
        debtor.amount -= minAmount;
        if (Math.abs(creditor.amount) < 0.05) i++;
        if (Math.abs(debtor.amount) < 0.05) j++;
    }

    return { transactions, totalExpense, share };
}

function renderSettlementUI(data) {
    settlementResults.innerHTML = '';
    settlementResults.classList.remove('hidden');

    if (!data) return;

    if (data.totalExpense === 0) {
        settlementResults.innerHTML = '<p>No expenses to settle!</p>';
        return;
    }

    const grouped = {};
    data.transactions.forEach(t => {
        if (!grouped[t.from]) grouped[t.from] = { total: 0, payments: [] };
        grouped[t.from].total += t.amount;
        grouped[t.from].payments.push({ to: t.to, amount: t.amount });
    });

    let html = '';
    for (const [payer, gData] of Object.entries(grouped)) {
        html += `<div class="result-block">
            <div class="payer-header">${payer} pays ₹${gData.total.toFixed(1)}</div>
        `;
        gData.payments.forEach(p => {
            html += `
                <div class="payment-line">
                    → ${p.to} <span class="amount">₹${p.amount.toFixed(1)}</span>
                </div>
            `;
        });
        html += `</div>`;
    }

    if (Object.keys(grouped).length === 0) {
        html += '<p>Everything is settled!</p>';
    }

    html += `
        <div class="summary">
            Total Spent: ₹${data.totalExpense.toFixed(2)} <br>
            Equal Share: ₹${data.share.toFixed(2)} per person
        </div>
    `;

    settlementResults.innerHTML = html;
}

calculateBtn.addEventListener('click', () => {
    const data = getSettlementData(members, expenses);
    if (!data) {
        alert("Please add members first.");
        return;
    }
    currentSettlementData = data;
    renderSettlementUI(data);
});

resetBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clean the current working split? History will be preserved.')) {
        members = [];
        expenses = [];
        sessionTitle = '';
        sessionTitleInput.value = '';
        currentSettlementData = null;
        saveData();
        renderMembers();
        renderExpenseOptions();
        renderExpenses();
        settlementResults.innerHTML = '';
        settlementResults.classList.add('hidden');
    }
});


// --- HISTORY LOGIC ---

saveBtn.addEventListener('click', () => {
    if (members.length === 0) {
        alert("Nothing to save! Add members and expenses first.");
        return;
    }

    const data = getSettlementData(members, expenses);
    
    const historyItem = {
        id: generateId(),
        title: sessionTitle || 'Untitled Split',
        date: new Date().toISOString(),
        members: [...members],
        expenses: [...expenses],
        settlement: data
    };

    history.unshift(historyItem);
    saveData();
    alert("Split successfully saved to History!");
});

function renderHistory() {
    historyList.innerHTML = '';
    if (history.length === 0) {
        historyList.innerHTML = '<p>No saved splits in history.</p>';
        return;
    }

    history.forEach(item => {
        const d = new Date(item.date);
        const dateStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
        const total = item.settlement ? item.settlement.totalExpense : 0;
        
        const container = document.createElement('div');
        container.className = 'history-item';
        container.style.cursor = 'pointer';
        
        const titleStr = item.title ? item.title : 'Untitled Split';
        
        let headerHtml = `
            <div class="history-item-header" style="align-items: center;">
                <span style="font-size: 1.1rem;">
                    ${titleStr} 
                    <small style="display:block; font-size:0.8rem; font-weight:normal; color:var(--text-muted);">${dateStr}</small>
                </span>
                <div style="text-align: right;">
                    <span style="color: var(--primary); display: block; margin-bottom: 0.25rem;">₹${total.toFixed(2)} Total</span>
                    <button class="delete-btn" onclick="event.stopPropagation(); deleteHistoryItem('${item.id}')" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;">Delete</button>
                </div>
            </div>
            <div class="history-item-details">
                Members: ${item.members.map(m=>m.name).join(', ')}<br>
                Expenses: ${item.expenses.length} item(s)
                <div style="text-align:center; font-size: 0.8rem; margin-top: 5px; color: var(--primary);">(Click to expand/collapse details)</div>
            </div>
        `;
        
        let detailsHtml = '<div class="history-expanded hidden" style="margin-top: 1rem; border-top: 1px dashed var(--border-color); padding-top: 1rem; color: var(--text-main); font-size: 0.95rem;">';
        
        detailsHtml += '<strong>Expenses:</strong><ul>';
        item.expenses.forEach(e => {
            detailsHtml += `<li style="padding: 0.25rem 0; margin:0;">${e.payerName} paid ₹${e.amount.toFixed(2)} <small>(${e.desc})</small></li>`;
        });
        detailsHtml += '</ul><br><strong>Settlements:</strong><div style="margin-top: 0.5rem; background: var(--card-bg); padding: 1rem; border-radius: 8px;">';
        
        if (!item.settlement || item.settlement.transactions.length === 0) {
            detailsHtml += '<p>Everything is settled!</p>';
        } else {
             const grouped = {};
             item.settlement.transactions.forEach(t => {
                 if (!grouped[t.from]) grouped[t.from] = [];
                 grouped[t.from].push(t);
             });
             for (const [payer, payments] of Object.entries(grouped)) {
                 detailsHtml += `<div style="margin-bottom: 0.5rem; font-weight: 600;">${payer} pays:</div>`;
                 payments.forEach(p => {
                     detailsHtml += `<div style="margin-left: 1rem; color: var(--text-muted);">→ ₹${p.amount.toFixed(1)} to <span style="font-weight: 600; color: var(--success);">${p.to}</span></div>`;
                 });
             }
        }
        detailsHtml += '</div></div>';
        
        container.innerHTML = headerHtml + detailsHtml;
        
        container.addEventListener('click', () => {
            const expanded = container.querySelector('.history-expanded');
            expanded.classList.toggle('hidden');
        });
        
        historyList.appendChild(container);
    });
}

clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear ALL history?')) {
        history = [];
        saveData();
        renderHistory();
    }
});

window.deleteHistoryItem = (id) => {
    if (confirm('Are you sure you want to delete this split?')) {
        history = history.filter(item => item.id !== id);
        saveData();
        renderHistory();
    }
};

// --- SEND / SHARE LOGIC ---

navSend.addEventListener('click', () => {
    closeSidebar();
    
    if (history.length === 0 && members.length === 0) {
        alert("No splits available to send. Please add members/expenses or check history.");
        return;
    }
    
    sendHistoryList.innerHTML = '';

    if (members.length > 0) {
        const currentData = getSettlementData(members, expenses);
        const div = document.createElement('div');
        div.className = 'history-item';
        div.style.cursor = 'pointer';
        div.style.border = '2px solid var(--success)';
        
        const titleText = sessionTitle ? sessionTitle : 'Current Unsaved Split';
        
        div.innerHTML = `
            <div class="history-item-header" style="align-items: center;">
                <span style="font-size: 1.1rem;">
                    ${titleText}
                </span>
                <span>₹${currentData ? currentData.totalExpense.toFixed(2) : 0} Total</span>
            </div>
        `;
        div.addEventListener('click', () => pickSharingMethod(members, expenses, currentData, titleText));
        sendHistoryList.appendChild(div);
    }

    history.forEach(item => {
        const d = new Date(item.date);
        const dateStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
        const div = document.createElement('div');
        div.className = 'history-item';
        div.style.cursor = 'pointer';
        const total = item.settlement ? item.settlement.totalExpense : 0;
        
        const titleText = item.title ? item.title : 'Untitled Split';
        
        div.innerHTML = `
            <div class="history-item-header" style="align-items: center;">
                <span style="font-size: 1.1rem;">
                    ${titleText}
                    <small style="display:block; font-size:0.8rem; font-weight:normal; color:var(--text-muted);">${dateStr}</small>
                </span>
                <span>₹${total.toFixed(2)} Total</span>
            </div>
            <div class="history-item-details">
                Members: ${item.members.map(m=>m.name).join(', ')}
            </div>
        `;
        div.addEventListener('click', () => pickSharingMethod(item.members, item.expenses, item.settlement, titleText));
        sendHistoryList.appendChild(div);
    });

    sendStep1.classList.remove('hidden');
    sendStep2.classList.add('hidden');
    sendModal.classList.remove('hidden');
});

closeSendModal.addEventListener('click', () => {
    sendModal.classList.add('hidden');
});

backSendModal.addEventListener('click', () => {
    sendStep2.classList.add('hidden');
    sendStep1.classList.remove('hidden');
});

function pickSharingMethod(memList, expList, data, title) {
    if (!data) data = getSettlementData(memList, expList);
    
    if (!data || data.totalExpense === 0) {
        alert("No expenses to settle in this split!");
        return;
    }
    
    selectedDataToSend = data;
    selectedTitleToSend = title;
    
    document.getElementById('send-preview').textContent = generateMessageBody(data, title);

    sendStep1.classList.add('hidden');
    sendStep2.classList.remove('hidden');
}

function generateMessageBody(data, title) {
    const formattedTitle = title && title !== 'Current Unsaved Split' && title !== 'Untitled Split' 
        ? title 
        : 'Summary';
        
    let body = "*Expense Settlement: " + formattedTitle + "*\n\n";
    body += "Total Spent: ₹" + data.totalExpense.toFixed(2) + "\n";
    body += "Equal Share: ₹" + data.share.toFixed(2) + " per person\n\n";
    body += "Settlements:\n";
    
    if (data.transactions.length === 0) {
        body += "Everything is settled!\n";
    } else {
        const grouped = {};
        data.transactions.forEach(t => {
            if (!grouped[t.from]) grouped[t.from] = [];
            grouped[t.from].push({ to: t.to, amount: t.amount });
        });
        
        for (const [payer, payments] of Object.entries(grouped)) {
            const total = payments.reduce((sum, p) => sum + p.amount, 0);
            body += "\n" + payer + " pays ₹" + total.toFixed(1) + ":\n";
            payments.forEach(p => {
                body += "  -> ₹" + p.amount.toFixed(1) + " to " + p.to + "\n";
            });
        }
    }
    return body;
}

btnSendWhatsapp.addEventListener('click', () => {
    if(!selectedDataToSend) return;
    const body = generateMessageBody(selectedDataToSend, selectedTitleToSend);
    const url = "https://wa.me/?text=" + encodeURIComponent(body);
    window.open(url, '_blank');
    sendModal.classList.add('hidden');
});

btnSendEmail.addEventListener('click', () => {
    if(!selectedDataToSend) return;
    const body = generateMessageBody(selectedDataToSend, selectedTitleToSend);
    
    const baseTitle = selectedTitleToSend && selectedTitleToSend !== 'Current Unsaved Split' && selectedTitleToSend !== 'Untitled Split' 
        ? "Expense Settlement: " + selectedTitleToSend
        : "Expense Settlement";

    const subject = encodeURIComponent(baseTitle);
    const encodedBody = encodeURIComponent(body);
    const a = document.createElement('a');
    a.href = "mailto:?subject=" + subject + "&body=" + encodedBody;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); }, 100);
    sendModal.classList.add('hidden');
});

btnSendSms.addEventListener('click', () => {
    if(!selectedDataToSend) return;
    const body = generateMessageBody(selectedDataToSend, selectedTitleToSend);
    const encodedBody = encodeURIComponent(body);
    const a = document.createElement('a');
    a.href = "sms:?&body=" + encodedBody;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); }, 100);
    sendModal.classList.add('hidden');
});
