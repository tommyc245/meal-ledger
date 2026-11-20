# Meal Ledger

A dining dashboard with two main pages: **Dining places** ranks locations by spending and visits, while **Mobile orders** tracks receipt-based meals, flavors, and ordering history.

## Shared history and private imports

This repository contains the website code, labeled sample data, and owner-authorized public summaries for eAccounts dining history and mobile orders. The mobile summary contains daily aggregate restaurant totals, grouped meal counts, and flavor/filling breakdowns. It contains no raw receipt emails, order IDs, card numbers, email addresses, account identifiers, credentials, access tokens, or private backups. New visitor imports are processed in the browser and saved privately in IndexedDB. Microsoft access tokens stay in memory and are lost on refresh. Each signed-in mailbox has a separate local ledger.

GitHub serves the app files. When you connect Outlook, the app talks directly to Microsoft Graph using your own account's delegated permissions. Imported receipt files are read on your device; they are not uploaded to GitHub. There is no shared database or cloud backup, and clearing your browser's site data removes your local ledger. Download a private receipt backup before changing browsers or devices.

## Get started

1. **Dining places** shows the spending and visit rankings side by side, with dining locations and visits at the top. Total spending appears in small text at the bottom. Visits use purchase transaction counts, so several purchases during one stop count separately.
2. **Mobile orders** immediately displays the owner's shared history: 358 confirmed orders, 383 items, 140 grouped meals, and 19 locations, from August 22, 2025 through November 18, 2026. This is a saved snapshot; it does not automatically scan a mailbox.
3. Keep **All time** selected to include last year's mobile orders, or use **30 days / 90 days**. Rolling windows use Duke's America/New_York calendar days. Dining places uses the complete eAccounts period because its source only has location totals.
4. Mobile meals rank by separate orders, with item quantities shown alongside. Search for a meal, restaurant, or flavor; expand **Flavors**, **Fillings**, or **Variations**. Milkshake flavors stack under Milkshake, and Sazon fillings stack under Quesadilla.
5. Click **Use my own data** in the header. Choose **Mobile receipts** or **Dining history**, then choose files or drag them into the upload box. No account setup is needed. The gear menu retains advanced receipt tools, private backups, email setup, and CSV exports.

## Upload your own history

- **Mobile receipts:** select one or more original `.eml` receipt emails, or a Meal Ledger private receipt `.json` backup. Up to 500 files / 18 MB can be imported at once. Duplicates are skipped, and uncertain receipts are sent for review.
- **Dining history:** upload a `.csv`, `.tsv`, or `.txt` transaction table, paste a copied eAccounts table with its headings, or restore a Meal Ledger dining-summary `.json`. The preview shows visits, locations, and date coverage before saving. Required columns are Date/Time, Location, Transaction Type, and Amount; Account Name is optional. Use US dates and USD amounts. Food and Flex rows count; printing, deposits, and transfers are excluded. Only supplied rows are counted, so include every page you want analyzed.

Personal uploads replace the public example in both pages of your browser. A page without your own data stays empty and offers an upload; it never fills in the owner's history. New mobile receipts merge with your saved mobile ledger, while a dining upload replaces the previous dining summary to prevent duplicate totals. Imported data stays browser-local and never modifies the public site or another visitor's data. Use a separate browser profile when different people share a computer.

The gear menu's **View Tommy’s example** temporarily returns to the shared dashboard without deleting personal uploads. Click **Use my own data → Open my saved history instead** to return. The site remembers the selected view after refresh.

The two main pages have shareable addresses ending in `#dining-places` and `#mobile-orders`. Dining totals already include mobile purchases and are never added to the mobile receipt totals. The palette uses Duke navy (#012169), royal blue (#00539B), and white; color reference: https://brand.duke.edu/colors/.

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
