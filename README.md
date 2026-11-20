# Meal Ledger

A dining dashboard with two main pages: **Dining places** ranks locations by spending and visits, while **Mobile orders** tracks receipt-based meals, flavors, and ordering history.

## Your data stays on your device

This repository contains the website code, labeled sample data, and an aggregate eAccounts dining summary that the site owner explicitly authorized for public sharing. It contains no raw receipt text, card numbers, email credentials, access tokens, or private backups. Receipt processing and storage happen in your browser using IndexedDB. Microsoft access tokens stay in memory and are lost on refresh. Each signed-in mailbox has a separate local ledger. Use your own browser profile on shared computers.

GitHub serves the app files. When you connect Outlook, the app talks directly to Microsoft Graph using your own account's delegated permissions. Imported receipt files are read on your device; they are not uploaded to GitHub. There is no shared database or cloud backup, and clearing your browser's site data removes your local ledger. Download a private receipt backup before changing browsers or devices.

## Get started

1. Open **Dining places** to see the owner-authorized **Public eAccounts summary**. The spending and visit rankings appear side by side. Visits use purchase transaction counts, so several purchases during one stop count separately. Use **Import my own summary** for your own browser-local summary.
2. Use **Import receipts** to add `.eml` receipt emails, paste receipt text, paste a batch, or restore your own Meal Ledger `.json` backup.
3. The default view is **All time**. Year buttons make last year's orders easy to find.
4. Open **Mobile orders** to see your most common mobile meal, ranked by the number of separate confirmed receipt orders containing it. Item quantities are shown separately. Use **My meals** on that page and expand **Flavors**, **Fillings**, or **Variations** beneath each meal. Milkshake flavors count toward one Milkshake total; Sazon quesadillas count toward one Quesadilla total.

The two main pages have shareable addresses ending in `#dining-places` and `#mobile-orders`. Receipt management and email setup remain available as tools. The public site contains no owner receipt history: the mobile page starts empty in a fresh browser until receipts are imported or an email scan completes. Dining totals already include mobile purchases and are never added to the mobile receipt totals.

## Connect your own Outlook / Duke email

Microsoft requires an approved app registration. In **Connections**, follow the setup instructions using **Single-page application (SPA)** and the exact redirect URI shown there (the website's root URL, including any repository path and trailing slash). Add Microsoft Graph **delegated** `Mail.Read` and `User.Read`, then enter the public Application (client) ID. Do not create or enter a client secret. Use an app registration that allows the account type you intend to connect.

After signing in with your own Microsoft account, leave the scan date empty to scan all available mail, including previous years. A school or workplace can block app registration or consent; if so, use receipt imports. The site does not bypass institutional policies, and a live Microsoft connection is not preconfigured in this repository.

## Backups and moving existing history

Use **Import receipts → Download my receipt backup** on the device holding your data. On your new device, use **Import receipts** and choose that `.json` file. Keep backups private: they contain receipt text. CSV Export downloads the current filtered meal and variation tally without counting both parent and child rows twice.

## Accuracy

The parser supports Duke Transact receipts plus generic priced receipt rows. Uncertain receipts and refund notices go to review. Refund pairs deduplicate by transaction identity, and you can exclude confirmed refunds. Review unfamiliar receipt formats before relying on totals. Spending reflects USD receipt totals, including any meal-plan tender, taxes, and fees; it is not necessarily out-of-pocket cash spending.

This is the compiled static website. No server, mailbox credentials, or database needs to be deployed. GitHub Pages can serve these files directly from the repository root.

## Public dining summary

The public default covers August 17, 2025 through November 20, 2026: 524 reported dining purchases at 26 locations, $4,950.22 gross charges less $16.97 in refunds, for $4,933.25 net. Meal swipes, printing, deposits, adjustments, and top-ups are excluded. These are owner-supplied aggregate figures; individual transaction rows and item names are not included. Your own imported data remains browser-local and replaces the public example in your view.
