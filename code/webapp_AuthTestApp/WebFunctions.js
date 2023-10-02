import {getFunctions, httpsCallable} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-functions.js";
import {FIREBASE_FUNCTIONS_REGION} from "./WebAppConfig.js";
import {isNullish} from "./WebBaseLite.js";

const NAME = "open-personal-archive-web-functions";
const VERSION = "2.3.2";
const AUTHOR = "Ryan Stephen Ehrenreich";
const COPYRIGHT = "Copyright © 2021 Open Personal Archive™";
const BUILD_DATE = "2023-10-02T09:40:21.822Z";

export const ActivityTypes = {
  _typeName: "ActivityType",
  web_page_load: "browser_page_load",
  web_page_view: "browser_page_view",
  web_page_action: "browser_page_action",
  web_page_error: "browser_page_error",
};

async function recordPageLoad(app, resource = window.location.href, data = {}, otherState = {}) {
  await recordLogItem(app, ActivityTypes.web_page_load, resource, null, data, otherState);
}

async function recordPageView(app, resource = window.location.href, data = {}, otherState = {}) {
  await recordLogItem(app, ActivityTypes.web_page_view, resource, null, data, otherState);
}

async function recordPageAction(app, resource = window.location.href, action, data = {}, otherState = {}) {
  await recordLogItem(app, ActivityTypes.web_page_view, resource, action, data, otherState);
}

async function recordPageError(app, error, resource = window.location.href, otherState = {}) {
  const data = {error: JSON.stringify(error)};
  await recordLogItem(app, ActivityTypes.web_page_view, resource, null, data, otherState);
}

async function recordLogItem(app, activityType, resource, action, data, otherState) {
  try {
    const functions = getFunctions(app, FIREBASE_FUNCTIONS_REGION);
    const functionObject = httpsCallable(functions, "recordLogItem");
    const functionArgs = {activityType, resource, action, data, otherState};
    await functionObject(functionArgs);
  } catch (error) {
    try {
      await recordPageError();
    } catch (error) {
      console.error(error);
    }
  }
}

export {recordPageLoad, recordPageView, recordPageAction, recordPageError};
