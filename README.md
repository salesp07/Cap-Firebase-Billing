# Cap-Firebase-Billing

Capping costs on Firebase can be tricky. The Firebase team doesn't want to make cost capping simpler and more reliable, as they see the scalability of Firebase as its greatest strength, and would rather forgive huge accidental bills. However, it's never certain that they'll forgive your bill, and it's better to be safe than sorry.

With that in mind, we're limited to a workaround using PubSub and Firebase Cloud Functions. But, fear not, because this is a seamless guide to help you cap your costs on your Firebase / Google Cloud project.

But keep the following [Google Cloud warning](https://cloud.google.com/billing/docs/how-to/notify#cap_disable_billing_to_stop_usage) in mind:

> **Warning**: This example removes Cloud Billing from your project, shutting down all resources. Resources might not shut down gracefully, and might be irretrievably deleted. There is no graceful recovery if you disable Cloud Billing.
> You can re-enable Cloud Billing, but there is no guarantee of service recovery and manual configuration is required.

## Step 1: Enable Billing on your Firebase Project

You can't cap your costs if you don't have billing enabled. So, go to your [Firebase Console](https://console.firebase.google.com/) and ensure you're on the on the Blaze plan. If you're not, simply click _Modify_, select the Blaze plan, and link a billing account.

## Step 2: Create a Budget and Link a PubSub Topic to it

Click on the gear icon in the top left corner of the Firebase Console, and select _Usage and Billing_. Under the _Details and Settings_ tab, click on _Create Budget_. You'll be taken to the Google Cloud Console. Every Firebase project is a Google Cloud project under the hood, so it's important to get used to it.

Click on _Create Budget_ and fill out the form. You can name whatever you want, but I recommend naming it something like _Firebase Cost Cap_. Set the budget amount to whatever you want your cap to be, set as many thresholds as you want (I recommend at least 3 to have you on top of your spending), and check `Email alerts to billing admins and users` to receive email notifications when thresholds are reached or .

Check `Connect a Pub/Sub topic to this budget` and open the dropdown that appears. Click on _Switch Project_ and select your Firebase project. Then, click on _Create a topic_ and name it whatever you want. I recommend naming it _billing_. Click _Save_.

## Step 3: Create a PubSub Listener Cloud Function

I highly recommend you see the video for this part, as there are a lot of steps involved. But, if you're a fast reader, here's the gist of it:

## Step 4: Enable the Cloud Billing API and Give your Cloud Function Billing Permissions

1. Enable the [Cloud Billing API](https://console.cloud.google.com/marketplace/product/google/cloudbilling.googleapis.com) for your project.

2. Go to your [Cloud Functions page](https://console.cloud.google.com/functions) and and select your newly created PubSub listener function.

3. Under the Details tab, simply look at which service account is used by your function.

4. In a new tab, go to your [IAM page](https://console.cloud.google.com/iam-admin/iam) (Stands for Identity and Access Management) and find the service account used by your function (ensure it's the same one by looking at the previous tab). Click on the pencil icon to edit it, and grant it the "Project Billing Manager" role.
