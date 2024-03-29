import {getFunctions, httpsCallable} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-functions.js";
import {FIREBASE_FUNCTIONS_REGION} from "./WebAppConfig.js";
import {isNullish, isBoolean} from "./WebBaseLite.js";

const NAME = "open-personal-archive-web-functions";
const VERSION = "2.4.4";
const AUTHOR = "Ryan Stephen Ehrenreich";
const COPYRIGHT = "Copyright � 2021 Open Personal Archive�";

export const ActivityTypes = {
  _typeName: "ActivityType",
  web_page_load: "browser_page_load",
  web_page_view: "browser_page_view",
  web_page_action: "browser_page_action",
  web_page_error: "browser_page_error",
};

async function recordPageLoad(app, resource = window.location.href, data = {}, otherState = null) {
  return await recordLogItem(app, ActivityTypes.web_page_load, resource, null, data, otherState);
}

async function recordPageView(app, resource = window.location.href, data = {}, otherState = null) {
  return await recordLogItem(app, ActivityTypes.web_page_view, resource, null, data, otherState);
}

async function recordPageAction(app, resource = window.location.href, action, data = {}, otherState = null) {
  return await recordLogItem(app, ActivityTypes.web_page_action, resource, action, data, otherState);
}

async function recordPageError(app, error, resource = window.location.href, otherState = null) {
  const data = {error: JSON.stringify(error)};
  return await recordLogItem(app, ActivityTypes.web_page_error, resource, null, data, otherState, true);
}

async function recordLogItem(app, activityType, resource, action, data, otherState = null, isPageError = false) {
  try {
    const functions = getFunctions(app, FIREBASE_FUNCTIONS_REGION);
    const functionObject = httpsCallable(functions, "recordLogItem");
    const functionArgs = {activityType, resource, action, data, otherState};
    return await functionObject(functionArgs);
  } catch (error) {
    console.error((!isNullish(error.message)) ? error.message : error);

    if (!isPageError) {
      return await recordPageError();
    }
  }
}

async function submitUserEmail(app, event, contactForm, emailInput, submitButton, waitIndicator, contactResult) {
  let logResult = null;

  try {
    event.preventDefault();

    emailInput.disabled = true;
    submitButton.disabled = true;
    waitIndicator.style.display = submitButton.style.display;
    waitIndicator.style.visibility = submitButton.style.visibility;
    submitButton.style.display = "none";
    submitButton.style.visibility = "hidden";

    const functionName = "createContact";
    const functionArgs = {email: emailInput.value};
    logResult = await recordPageAction(app, window.location.href, functionName, functionArgs);
    functionArgs.externalLogItemId = logResult.data.payload.id;

    const functions = getFunctions(app, FIREBASE_FUNCTIONS_REGION);
    const functionObject = httpsCallable(functions, functionName);
    const functionResult = await functionObject(functionArgs);
    const functionData = (!isNullish(functionResult.data)) ? functionResult.data : {};
    const functionSuccess = (isBoolean(functionData.success) && functionData.success);

    if (!functionSuccess) {
      throw new Error("There was an error processing your submission.");
    }

    contactResult.style.display = contactForm.style.display;
    contactResult.style.visibility = contactForm.style.visibility;
    contactForm.remove();
  } catch (error) {
    emailInput.disabled = false;
    submitButton.disabled = false;
    submitButton.style.display = waitIndicator.style.display;
    submitButton.style.visibility = waitIndicator.style.visibility;
    waitIndicator.style.display = "none";
    waitIndicator.style.visibility = "hidden";
    window.alert("There was an error processing your request... Please try again later.");

    console.error((!isNullish(error.message)) ? error.message : error);
    await recordPageError();
  }
}

export {recordPageLoad, recordPageView, recordPageAction, recordPageError, submitUserEmail};
