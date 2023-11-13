# Cap-Firebase-Billing

Capping costs on Firebase can be tricky. The Firebase team doesn't want to make cost capping simpler and more reliable, as they see the scalability of Firebase as its greatest strength, and would rather forgive huge accidental bills. However, it's never certain that they'll forgive your bill, and it's better to be safe than sorry.

With that in mind, we're limited to a workaround using PubSub and Firebase Cloud Functions. But, fear not, because this is a seamless guide to help you cap your costs on your Firebase / Google Cloud project.

But keep the following [Google Cloud warning](https://cloud.google.com/billing/docs/how-to/notify#cap_disable_billing_to_stop_usage) in mind:

> **Warning**: This example removes Cloud Billing from your project, shutting down all resources. Resources might not shut down gracefully, and might be irretrievably deleted. There is no graceful recovery if you disable Cloud Billing.
> You can re-enable Cloud Billing, but there is no guarantee of service recovery and manual configuration is required.

Full video walkthrough: https://youtu.be/T8SGJa6ZYCs

## Step 1: Enable Billing on your Firebase Project

You can't cap your costs if you don't already have billing enabled. So, go to your project's [Firebase Console](https://console.firebase.google.com/) and ensure you're on the on the Blaze plan. If you're not, simply click _Modify_, select the Blaze plan, and link a billing account.

## Step 2: Create a Budget and Link a PubSub Topic to it

1. Click on the gear icon in the top left corner of the Firebase Console, and select _Usage and Billing_.

2. Under the _Details and Settings_ tab, click on _Create Budget_. You'll be taken to the Google Cloud Console. Every Firebase project is a Google Cloud project under the hood, so it's important to get used to it.

3. Click on _Create Budget_.

4. You can name whatever you want, but I recommend naming it something like `<your-project-name> CAP`.

5. Set the budget amount to whatever you want your cap to be.

6. Set as many thresholds as you want (I recommend at least 3 to keep on top of your spending).

7. Check `Email alerts to billing admins and users` to receive email notifications when thresholds are reached and when billing is disabled.

8. Check `Connect a Pub/Sub topic to this budget` and open the dropdown that appears. Click on _Switch Project_ and select your Firebase project. Then, click on _Create a topic_ and name it whatever you want. I recommend naming it _billing_.

9. Click _Save_.

## Step 3: Create a PubSub Listener Cloud Function

I highly recommend you see the video for this part, as there are a lot of steps involved, and... who knows? You might learn something new! But if you're in a hurry, here's the gist of it:

1. Set up your cloud functions environment if you haven't already. You can follow steps 1, 2, 3 from the [official guide](https://firebase.google.com/docs/functions/get-started?gen=2nd). I recommend choosing TypeScript as your language, as the code provided has types that will make your life way easier if you want to customize it.

2. Go to your functions directory: `cd functions`

3. Install required dependencies by running `npm install discord-api-types @google-cloud/billing` from your command line.

4. Copy the files from `/functions/src` in this repository and paste it into your `functions` directory.

5. Do any necessary code refactoring if you're using JavaScript or if you already Cloud Functions set up.

6. Go to your `billingUtils.ts` and replace `MIN_COST_DIFF_FOR_ALERT = 1` to whatever you want your minimum cost difference for an alert to be. Using this constant in our code is useful to avoid getting spammed with alerts for tiny/unexisting spending increases. More on this in the next step.

## Step 4: Keep Track of Previous Billing Alerts

Your PubSub listener function will be triggered every time a new message is published to your billing PubSub topic, which from personal experience, can be once or twice every hour. That isn't good as your webhook will be spammed with alerts for tiny/unexisting spending increases.

To avoid this, we'll keep track of previous billing alerts in a Realtime Database node.

**OBS**: You can use a Firestore doc if you want, but since we're only storing 2 values (around 50 bytes), Realtime DB will likely be cheaper.

1. Go to your project's [Firebase Console](https://console.firebase.google.com/) and click on _Realtime Database_ in the left sidebar.

2. Create a database if you don't already have one.

3. Create a node called `billing` and add the following 2 children to it:

```js
lastReportedCost: 0;
lastReportedBillingStart: "";
```

5. Make sure your billing node's read and write rules are set to false. This information is sensitive, and you don't want the public to be able to read or write to it. Your Cloud Function will be able to read and write to it regardless of the rules, as it has admin privileges.

## Step 5: Get a Discord Webhook URL and Set it as an Environment Variable

This step is optional, but I highly recommend it. It's a great way to get notified of spending increases in real time, and it's super easy to set up. If you decide to skip this step, you can simply remove the `sendDiscordMessage` function calls from `index.ts` and all discord-related code.

If you'd like to send a Slack message instead, follow the instructions on Firebase's [official video](https://youtu.be/hd9FQOlI2Ts?si=SVlh12EzdZ3VCsFA).

1. Create a Discord server if you don't already have one.

2. Create a webhook in the channel of your choice. You can follow [this extremely simple guide](https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks) if you don't know how.

3. Create a `.env` file in your `functions` directory if you don't already have one.

4. Copy the webhook URL and paste it into your `.env` file as follows: `DISCORD_WEBHOOK_URL="<your-webhook-url>"`.

## Step 6: Deploy your Cloud Function

1. Run `firebase deploy --only functions` from your command line.

## Step 7: Enable the Cloud Billing API and Give your Cloud Function Billing Permissions

1. Enable the [Cloud Billing API](https://console.cloud.google.com/marketplace/product/google/cloudbilling.googleapis.com) for your project. You won't be able to access your billing info from your Cloud Function if you don't do this.

2. Go to your [Cloud Functions page](https://console.cloud.google.com/functions) and and select your newly created PubSub listener function.

3. Under the Details tab, simply look at which service account is used by your function.

4. In a new tab, go to your [IAM page](https://console.cloud.google.com/iam-admin/iam) (Stands for Identity and Access Management) and find the service account used by your function (ensure it's the same one by looking at the previous tab). Click on the pencil icon to edit it, and grant it the "Project Billing Manager" role.

## Step 8: Test your Cloud Function

We can test our Cloud Function by manually publishing a message to our billing PubSub topic. There are [various ways](https://cloud.google.com/pubsub/docs/publisher#publish-messages) to do this, but I'll go over the easiest one: using Google Cloud Console.

**OBS**: if you have a Windows PC and decide to use the gcloud CLI, make sure to run you command in a Git Bash terminal, as you will get a JSON parsing error otherwise. [Reference](https://stackoverflow.com/questions/77364542/json-parsing-error-in-firebase-pubsub-function-when-publishing-message-with-gclo?noredirect=1#comment136389229_77364542).

1. Go to your [PubSub page](https://console.cloud.google.com/cloudpubsub/topic/list) and select your billing topic.

2. Under the _Messages_ tab, click on _Publish Message_.

3. Copy the following JSON ([Reference](https://cloud.google.com/billing/docs/how-to/notify#test-your-cloud-function)) template and paste it into the _Message body_ field:

```js
{
  "budgetDisplayName": "name-of-budget",
  "alertThresholdExceeded": 1.0,
  "costAmount": 100.01,
  "costIntervalStart": "2019-01-01T00:00:00Z",
  "budgetAmount": 100.0,
  "budgetAmountType": "SPECIFIED_AMOUNT",
  "currencyCode": "USD"
}
```

4. Replace `costAmount` with a value >= your budget amount.

5. Click on _Publish_. You'll receive a Discord message if you followed step 5, your billing node in your Realtime Database will be updated, and your billing will be disabled.

## Contributing

I likely won't be able to actively maintain this repository, so if some issues arise in the future, feel free to open a PR to fix it! I'll be happy to merge it if it's a good addition.

As a general rule, please divide your PR message into 3 parts:

1. The problem you're trying to solve.
2. The solution you're proposing.
3. How and where you tested your solution.
