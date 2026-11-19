# Meal Ledger

A private food-order dashboard that runs in your browser. Group meals, expand flavors and fillings, browse all years of order history, and export your tallies.

## Your data stays on your device

This repository contains the website code and sample demo data only. It contains no owner's receipts, email credentials, access tokens, or private backups. Receipt processing and storage happen in your browser using IndexedDB. Microsoft access tokens stay in memory and are lost on refresh. Each signed-in mailbox has a separate local ledger. Use your own browser profile on shared computers.

GitHub serves the app files. When you connect Outlook, the app talks directly to Microsoft Graph using your own account's delegated permissions. Imported receipt files are read on your device; they are not uploaded to GitHub. There is no shared database or cloud backup, and clearing your browser's site data removes your local ledger. Download a private receipt backup before changing browsers or devices.

## Get started

1. Open the GitHub Pages website and choose **Use my data** to leave the labeled demo.
2. Use **Import receipts** to add `.eml` receipt emails, paste receipt text, paste a batch, or restore your own Meal Ledger `.json` backup.
3. The default view is **All time**. Year buttons make last year's orders easy to find.
4. Open **My meals** and expand **Flavors**, **Fillings**, or **Variations** beneath each meal. Milkshake flavors count toward one Milkshake total; Sazon quesadillas count toward one Quesadilla total.

## Connect your own Outlook / Duke email

Microsoft requires an approved app registration. In **Connections**, follow the setup instructions using **Single-page application (SPA)** and the exact redirect URI shown there (the website's root URL, including any repository path and trailing slash). Add Microsoft Graph **delegated** `Mail.Read` and `User.Read`, then enter the public Application (client) ID. Do not create or enter a client secret. Use an app registration that allows the account type you intend to connect.

After signing in with your own Microsoft account, leave the scan date empty to scan all available mail, including previous years. A school or workplace can block app registration or consent; if so, use receipt imports. The site does not bypass institutional policies, and a live Microsoft connection is not preconfigured in this repository.

## Backups and moving existing history

Use **Import receipts → Download my receipt backup** on the device holding your data. On your new device, use **Import receipts** and choose that `.json` file. Keep backups private: they contain receipt text. CSV Export downloads the current filtered meal and variation tally without counting both parent and child rows twice.

## Accuracy

The parser supports Duke Transact receipts plus generic priced receipt rows. Uncertain receipts and refund notices go to review. Refund pairs deduplicate by transaction identity, and you can exclude confirmed refunds. Review unfamiliar receipt formats before relying on totals. Spending reflects USD receipt totals, including any meal-plan tender, taxes, and fees; it is not necessarily out-of-pocket cash spending.

This is the compiled static website. No server, mailbox credentials, or database needs to be deployed. GitHub Pages can serve these files directly from the repository root.
