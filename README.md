# Expense Splitter

## Overview
Expense Splitter is a mathematically accurate, offline-capable mobile and web application designed to eliminate confusion in managing shared group expenses. It calculates who owes whom instantly using an optimized greedy algorithm. 

## Features
- **PWA Offline Support**: 100% functional without an internet connection after the first load. 
- **Accurate Mathematical Balancing**: Distributes debts cleanly without arbitrary rounding errors.
- **Optimized Transactions**: Reduces the overall number of payments to be made using a smart Greedy Algorithm.
- **CRUD Entities**: Full tracking and modification capability for members and expenses. 
- **Sleek UI**: Modern, card-based interface styled cleanly with Vanilla CSS.

## How to Use
1. Enter member names under "1. Members".
2. After members are added, select who paid and how much under "2. Expenses".
3. Once all expenses are logged, press **Calculate Settlement**.
4. The system groups exactly who owes money, to whom, and precisely how much.

## Installation
Since the app features Progressive Web App (PWA) architecture:
1. Navigate to the hosted site (e.g., via GitHub Pages) using a mobile or desktop browser.
2. In your browser option menu, click "Add to Home screen".
3. The app will install onto your device locally just like a native app. 
Alternatively, clone this repository locally and simply double-click `index.html`.

## File Structure
- `index.html`: The structural map and markup outlining layout sections.
- `styles.css`: Pure responsive, modern vanilla CSS logic with CSS variables. 
- `app.js`: Core logic for managing local state, math balancing, and DOM updating.
- `manifest.json`: Web app mapping definition enabling "Add to Home screen" functionality.
- `sw.js`: The Service Worker handling local caching protocols to grant fully offline network abilities.

## Example Use Case
Imagine a trip with 4 members: A, B, C, and D, where everyday expenses are shared equally.
- A pays ₹120
- B pays ₹160
- C pays ₹40
- D pays ₹0

**Calculation:**
*Total Expenditure* translates to ₹320 (*Share*: ₹80 per individual).

**Resulting Output:**
- D pays ₹80
    → B ₹40.0
    → A ₹40.0
- C pays ₹40
    → B ₹40.0

## Technologies Used
- HTML5
- CSS3 (Flexbox geometry, shadow models)
- Vanilla Javascript ES6 (Data routing, Greed algorithms)
- PWA Architecture
