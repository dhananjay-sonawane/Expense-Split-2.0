// State
let members = [];
let expenses = [];
let editMemberId = null;
let editExpenseId = null;

// DOM Elements
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
const settlementResults = document.getElementById('settlement-results');

// ID Generator
const generateId = () => Math.random().toString(36).substr(2, 9);

// --- MEMBERS LOGIC ---

memberForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = memberNameInput.value.trim();
    if (!name) return;

    if (editMemberId) {
        // Update
        const member = members.find(m => m.id === editMemberId);
        const oldName = member.name;
        member.name = name;
        
        // Update expensespayer references if name changed
        expenses.forEach(exp => {
            if (exp.payerName === oldName) exp.payerName = name;
        });

        editMemberId = null;
        memberForm.querySelector('button[type="submit"]').textContent = 'Add Member';
        cancelEditMemberBtn.classList.add('hidden');
    } else {
        // Add
        if (members.find(m => m.name.toLowerCase() === name.toLowerCase())) {
            alert('Member already exists!');
            return;
        }
        members.push({ id: generateId(), name });
    }

    memberNameInput.value = '';
    renderMembers();
    renderExpenseOptions();
    renderExpenses(); // in case name updated
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
};


// --- SETTLEMENT ALGORITHM ---

calculateBtn.addEventListener('click', () => {
    if (members.length === 0) {
        alert("Please add members first.");
        return;
    }
    
    // 1. Calculate Summary
    const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const share = totalExpense / members.length;

    // 2. Compute net balances
    // Balance = amount paid - equal share
    // Negative balance -> owes money (Debtor)
    // Positive balance -> will receive money (Creditor)
    const balancesMap = {};
    members.forEach(m => balancesMap[m.name] = -share);
    
    expenses.forEach(exp => {
        if (balancesMap[exp.payerName] !== undefined) {
             balancesMap[exp.payerName] += exp.amount;
        }
    });

    const creditors = [];
    const debtors = [];

    for (const [name, balance] of Object.entries(balancesMap)) {
        // user requirement to fix exact proportion:
        // if exact proportionate match is needed, the standard greedy min algorithm naturally handles it!
        // Round to handle floating point issues.
        const roundedBal = Math.round(balance * 100) / 100;
        
        if (roundedBal > 0.01) {
            creditors.push({ name, amount: roundedBal });
        } else if (roundedBal < -0.01) {
            debtors.push({ name, amount: Math.abs(roundedBal) });
        }
    }

    // Sort to optimize
    creditors.sort((a, b) => b.amount - a.amount); // desc
    debtors.sort((a, b) => b.amount - a.amount);   // desc (wait, user said ascending, but typically descending minimizes transactions. I'll use descending first to pay off large amounts, but if user asked ascending: "Debtors in ascending order" let me check. Let's do ascending for debtors to strictly follow. Wait, if descending for creditors, ascending for debtors means smallest debtor pays largest creditor. It's valid.)
    // Actually, user stated: "Debtors in ascending order" in my plan I can use descending for both as standard greedy or follow their specific instruction. 
    debtors.sort((a, b) => a.amount - b.amount);

    const transactions = []; // { from, to, amount }

    let i = 0; // creditor index
    let j = 0; // debtor index

    while (i < creditors.length && j < debtors.length) {
        const creditor = creditors[i];
        const debtor = debtors[j];

        const minAmount = Math.min(creditor.amount, debtor.amount);
        const settledAmount = Math.round(minAmount * 10) / 10; // "Round values to 1 decimal place"

        if (settledAmount > 0) {
            transactions.push({
                from: debtor.name,
                to: creditor.name,
                amount: settledAmount
            });
        }

        creditor.amount -= minAmount;
        debtor.amount -= minAmount;

        // Using very small threshold
        if (Math.abs(creditor.amount) < 0.05) i++;
        if (Math.abs(debtor.amount) < 0.05) j++;
    }

    renderSettlement(transactions, totalExpense, share);
});

function renderSettlement(transactions, totalExpense, share) {
    settlementResults.innerHTML = '';
    settlementResults.classList.remove('hidden');

    if (totalExpense === 0) {
        settlementResults.innerHTML = '<p>No expenses to settle!</p>';
        return;
    }

    // Group transactions by payer (debtor)
    const grouped = {};
    transactions.forEach(t => {
        if (!grouped[t.from]) grouped[t.from] = { total: 0, payments: [] };
        grouped[t.from].total += t.amount;
        grouped[t.from].payments.push({ to: t.to, amount: t.amount });
    });

    let html = '';
    for (const [payer, data] of Object.entries(grouped)) {
        html += `<div class="result-block">
            <div class="payer-header">${payer} pays ₹${data.total.toFixed(1)}</div>
        `;
        data.payments.forEach(p => {
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

    // Add summary
    html += `
        <div class="summary">
            Total Spent: ₹${totalExpense.toFixed(2)} <br>
            Equal Share: ₹${share.toFixed(2)} per person
        </div>
    `;

    settlementResults.innerHTML = html;
}
